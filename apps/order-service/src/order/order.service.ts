import { Injectable, Inject, ConflictException, Logger } from '@nestjs/common';
import {
	IOrder,
	OrderStatus,
	SeatStatusEnum,
	PaymentStatus,
} from '@seat-booking/shared-types';
import { PaymentProcessingMessage } from '@seat-booking/shared-types';
import { IOrderService } from './interfaces/order-service.interface';
import { IOrderRepository } from './interfaces/order-repository.interface';
import { ISeatRepository } from '../seat/interfaces/seat-repository.interface';
import { IPaymentRepository } from './interfaces/payment-repository.interface';
import { IOrderRepositorySymbol, IPaymentRepositorySymbol } from './tokens';
import { ISeatRepositorySymbol } from '../seat/tokens';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { SqsProducerService } from './sqs-producer.service';

/**
 * Implementation of the order service interface.
 * Uses TypeORM repository to interact with the PostgreSQL database.
 */
@Injectable()
export class OrderService implements IOrderService {
	private readonly logger = new Logger(OrderService.name);

	constructor(
		@Inject(IOrderRepositorySymbol)
		private readonly orderRepository: IOrderRepository,
		@Inject(ISeatRepositorySymbol)
		private readonly seatRepository: ISeatRepository,
		@Inject(IPaymentRepositorySymbol)
		private readonly paymentRepository: IPaymentRepository,
		@InjectDataSource('postgres')
		private readonly dataSource: DataSource,
		private readonly sqsProducerService: SqsProducerService,
	) {}

	/**
	 * Creates a new order and reserves the seat.
	 * @param seatId - ID of the seat to reserve.
	 * @param userId - ID of the user creating the order.
	 * @param accountId - ID of the account for the order.
	 * @returns Promise that resolves to the created IOrder object.
	 * @throws ConflictException if the seat is already reserved.
	 * @throws Error if the seat is not found.
	 */
	public async createOrder(
		seatId: string,
		userId: string,
		accountId: string,
	): Promise<IOrder> {
		this.logger.log(
			`Creating order: seatId=${seatId}, userId=${userId}, accountId=${accountId}`,
		);

		// Start transaction with SERIALIZABLE isolation level for maximum safety
		const order = await this.dataSource.transaction(
			'SERIALIZABLE' as any,
			async (manager) => {
				// Find seat with pessimistic write lock to prevent double booking
				this.logger.debug(`Finding seat ${seatId} with write lock`);
				const seat = await this.seatRepository.findByIdForUpdate(
					seatId,
					manager,
				);

				if (!seat) {
					this.logger.error(`Seat with ID ${seatId} not found`);
					throw new Error(`Seat with ID ${seatId} not found`);
				}

				// Check if seat is already reserved or booked
				if (seat.status !== SeatStatusEnum.AVAILABLE) {
					this.logger.warn(
						`Seat ${seatId} is already ${seat.status}, cannot reserve`,
					);
					throw new ConflictException('Seat is already reserved');
				}

				// Generate idempotency key using UUID (simplified for now)
				const idempotencyKey = `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

				// Create order
				this.logger.debug(
					`Creating order record with idempotency key: ${idempotencyKey}`,
				);
				const createdOrder = await this.orderRepository.createOrder(
					{
						userId,
						seatId,
						accountId,
						status: OrderStatus.PENDING,
						idempotencyKey,
					},
					manager,
				);

				// Create payment record
				this.logger.debug(
					`Creating payment record for order ${createdOrder.id}`,
				);
				await this.paymentRepository.createPayment(
					{
						orderId: createdOrder.id,
						status: PaymentStatus.PENDING,
						amount: 10000, // $100.00 in cents
						idempotencyKey,
					},
					manager,
				);

				// Update seat status to RESERVED
				this.logger.debug(
					`Updating seat ${seatId} status from AVAILABLE to RESERVED`,
				);
				seat.status = SeatStatusEnum.RESERVED;
				await this.seatRepository.update(seat, manager);

				return createdOrder;
			},
		);

		this.logger.log(`Order ${order.id} created successfully`);

		// Publish message to SQS after transaction commit (fire and forget)
		const paymentMessage: PaymentProcessingMessage = {
			orderId: order.id,
			seatId: order.seatId,
			accountId: order.accountId,
			userId: order.userId,
			amount: 100.0, // Fixed amount for this version
		};

		// Fire and forget to ensure order creation completes even if SQS is down
		this.sqsProducerService
			.sendPaymentProcessingMessage(paymentMessage)
			.catch((error) => {
				this.logger.error(
					`Failed to publish payment processing message for order ${order.id}`,
					error,
				);
			});

		return order;
	}

	/**
	 * Finds an order by its ID.
	 * @param id - Unique identifier of the order.
	 * @returns Promise that resolves to the IOrder object or null if not found.
	 */
	public async findById(id: string): Promise<IOrder | null> {
		return this.orderRepository.findById(id);
	}

	/**
	 * Updates the payment status of an order.
	 * @param orderId - ID of the order to update.
	 * @param status - New payment status.
	 * @returns Promise that resolves to the updated IOrder object.
	 * @throws Error if the order is not found.
	 */
	public async updatePaymentStatus(
		orderId: string,
		status: 'CONFIRMED' | 'FAILED',
	): Promise<IOrder> {
		this.logger.log(
			`Updating payment status for order ${orderId} to ${status}`,
		);

		// Start transaction to ensure atomicity
		const updatedOrder = await this.dataSource.transaction(
			async (manager) => {
				// Find order with pessimistic write lock
				this.logger.debug(`Finding order ${orderId} with write lock`);
				const order = await this.orderRepository.findByIdForUpdate(
					orderId,
					manager,
				);

				if (!order) {
					this.logger.error(`Order with ID ${orderId} not found`);
					throw new Error(`Order with ID ${orderId} not found`);
				}

				// Find payment record
				this.logger.debug(
					`Finding payment record for order ${orderId}`,
				);
				const payment = await this.paymentRepository.findByOrderId(
					orderId,
					manager,
				);
				if (payment) {
					// Update payment status
					this.logger.debug(
						`Updating payment ${payment.id} status to ${status}`,
					);
					await this.paymentRepository.updateStatus(
						payment.id,
						status === 'CONFIRMED'
							? PaymentStatus.SUCCESS
							: PaymentStatus.FAILED,
						manager,
					);
				}

				// Update order status
				order.status = status as OrderStatus;
				const orderResult = await this.orderRepository.update(
					order,
					manager,
				);

				// If payment failed, release the seat
				if (status === 'FAILED') {
					this.logger.warn(
						`Payment failed for order ${orderId}, releasing seat ${order.seatId}`,
					);
					const seat = await this.seatRepository.findByIdForUpdate(
						order.seatId,
						manager,
					);
					if (seat) {
						seat.status = SeatStatusEnum.AVAILABLE;
						await this.seatRepository.update(seat, manager);
					}
				} else {
					this.logger.debug(
						`Order ${orderId} confirmed successfully`,
					);
				}

				return orderResult;
			},
		);

		this.logger.log(
			`Payment status for order ${orderId} updated to ${status} successfully`,
		);
		return updatedOrder;
	}
}
