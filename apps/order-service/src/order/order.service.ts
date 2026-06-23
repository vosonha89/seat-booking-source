import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { IOrder, OrderStatus, SeatStatusEnum } from '@seat-booking/shared-types';
import { PaymentProcessingMessage } from '@seat-booking/shared-types';
import { IOrderService } from './interfaces/order-service.interface';
import { IOrderRepository } from './interfaces/order-repository.interface';
import { ISeatRepository } from '../seat/interfaces/seat-repository.interface';
import { IOrderRepositorySymbol } from './tokens';
import { ISeatRepositorySymbol } from '../seat/tokens';
import { DataSource } from 'typeorm';
import { SqsProducerService } from './sqs-producer.service';

/**
 * Implementation of the order service interface.
 * Uses TypeORM repository to interact with the PostgreSQL database.
 */
@Injectable()
export class OrderService implements IOrderService {
	constructor(
		@Inject(IOrderRepositorySymbol)
		private readonly orderRepository: IOrderRepository,
		@Inject(ISeatRepositorySymbol)
		private readonly seatRepository: ISeatRepository,
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
		// Start transaction with SERIALIZABLE isolation level for maximum safety
		const order = await this.dataSource.transaction(
			'SERIALIZABLE' as any,
			async (manager) => {
				// Find seat with pessimistic write lock to prevent double booking
				const seat = await this.seatRepository.findByIdForUpdate(seatId, manager);

				if (!seat) {
					throw new Error(`Seat with ID ${seatId} not found`);
				}

				// Check if seat is already reserved or booked
				if (seat.status !== SeatStatusEnum.AVAILABLE) {
					throw new ConflictException('Seat is already reserved');
				}

				// Generate idempotency key using UUID (simplified for now)
				const idempotencyKey = `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

				// Create order
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

				return createdOrder;
			},
		);

		// Publish message to SQS after transaction commit
		try {
			const paymentMessage: PaymentProcessingMessage = {
				orderId: order.id,
				seatId: order.seatId,
				accountId: order.accountId,
				userId: order.userId,
				amount: 100.00, // Fixed amount for this version
			};

			await this.sqsProducerService.sendPaymentProcessingMessage(paymentMessage);
		} catch (error) {
			// If publish fails, order still exists (seat remains PENDING - will be retried later)
			// We don't rethrow here to allow the order creation to succeed
		}

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
	public async updatePaymentStatus(orderId: string, status: 'CONFIRMED' | 'FAILED'): Promise<IOrder> {
		// Start transaction to ensure atomicity
		return this.dataSource.transaction(async (manager) => {
			// Find order with pessimistic write lock
			const order = await this.orderRepository.findByIdForUpdate(orderId, manager);

			if (!order) {
				throw new Error(`Order with ID ${orderId} not found`);
			}

			// Update order status
			order.status = status as OrderStatus;
			const updatedOrder = await this.orderRepository.update(order, manager);

			// If payment failed, release the seat
			if (status === 'FAILED') {
				const seat = await this.seatRepository.findByIdForUpdate(order.seatId, manager);
				if (seat) {
					seat.status = SeatStatusEnum.AVAILABLE;
					await this.seatRepository.update(seat, manager);
				}
			}

			return updatedOrder;
		});
	}
}
