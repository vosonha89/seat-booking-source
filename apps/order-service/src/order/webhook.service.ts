import { Injectable, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderStatus } from '@seat-booking/shared-types';
import { PaymentStatus } from '@seat-booking/shared-types';
import { IWebhookPayload } from '@seat-booking/shared-types';
import { Order } from '@seat-booking/database';
import { Seat } from '@seat-booking/database';
import { WebhookLog } from '@seat-booking/database';
import { AuditPayment } from '@seat-booking/database';
import { Inject } from '@nestjs/common';
import { IOrderRepository } from './interfaces/order-repository.interface';
import { IOrderRepositorySymbol } from './tokens';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

/**
 * Service for processing payment webhook events.
 * Handles idempotency checks, atomic state updates, and audit logging.
 */
@Injectable()
export class WebhookService {
	private readonly logger = new Logger(WebhookService.name);

	constructor(
		@Inject(IOrderRepositorySymbol)
		private readonly orderRepository: IOrderRepository,
		@InjectRepository(Seat, 'postgres')
		private readonly seatRepository: Repository<Seat>,
		@InjectRepository(WebhookLog, 'postgres')
		private readonly webhookLogRepository: Repository<WebhookLog>,
		@InjectRepository(AuditPayment, 'mongodb')
		private readonly auditPaymentRepository: Repository<AuditPayment>,
		@InjectDataSource('postgres')
		private readonly dataSource: DataSource,
	) {}

	/**
	 * Processes a payment webhook event.
	 * @param payload The webhook payload
	 * @throws ConflictException if webhook has already been processed
	 */
	async processWebhook(payload: IWebhookPayload): Promise<void> {
		this.logger.log(`Processing webhook for orderId: ${payload.orderId}, webhookId: ${payload.webhookId}`);

		// Get order and seat in a single transaction with SERIALIZABLE isolation
		const queryRunner = this.dataSource.createQueryRunner();
		await queryRunner.connect();
		await queryRunner.startTransaction('SERIALIZABLE');

		try {
			// Check idempotency - get webhook log with FOR UPDATE to lock the row
			const existingWebhookLog = await queryRunner.manager.findOne(WebhookLog, {
				where: { webhookId: payload.webhookId },
				lock: { mode: 'pessimistic_write' },
			});

			if (existingWebhookLog) {
				this.logger.log(`Webhook already processed for orderId: ${payload.orderId}, webhookId: ${payload.webhookId}`);
				await queryRunner.commitTransaction();
				return;
			}

			// Get order
			const order = await queryRunner.manager.findOne(Order, {
				where: { id: payload.orderId },
				lock: { mode: 'pessimistic_write' },
			}) as Order;

			if (!order) {
				this.logger.error(`Order not found for orderId: ${payload.orderId}`);
				await queryRunner.commitTransaction();
				return;
			}

			// Validate state transition
			this.validateStateTransition(order.status, payload.status);

			// Get seat
			const seat = await queryRunner.manager.findOne(Seat, {
				where: { id: order.seatId },
				lock: { mode: 'pessimistic_write' },
			}) as Seat;

			if (!seat) {
				this.logger.error(`Seat not found for seatId: ${order.seatId}`);
				await queryRunner.commitTransaction();
				return;
			}

			// Update order status
			const oldOrderStatus = order.status;
			order.status = this.mapPaymentStatusToOrderStatus(payload.status);
			order.updatedAt = new Date();

			// Update seat status
			const oldSeatStatus = seat.status;
			if (payload.status === PaymentStatus.SUCCESS) {
				seat.status = 'BOOKED';
			} else if (payload.status === PaymentStatus.FAILED) {
				seat.status = 'AVAILABLE';
			}

			// Create webhook log
			const webhookLog = queryRunner.manager.create(WebhookLog, {
				webhookId: payload.webhookId,
				orderId: payload.orderId,
				processedAt: new Date(),
			});

			// Save all changes
			await queryRunner.manager.save(order);
			await queryRunner.manager.save(seat);
			await queryRunner.manager.save(webhookLog);

			await queryRunner.commitTransaction();
			this.logger.log(`Successfully processed webhook for orderId: ${payload.orderId}`);

			// Create audit log (outside transaction to ensure it's recorded even if transaction fails)
			await this.createAuditLog(order, oldOrderStatus, oldSeatStatus, payload);
		} catch (error) {
			await queryRunner.rollbackTransaction();
			this.logger.error(`Failed to process webhook for orderId: ${payload.orderId}`, (error as Error).stack);
			throw error;
		} finally {
			await queryRunner.release();
		}
	}

	/**
	 * Validates the state transition for an order.
	 * @param currentStatus Current order status
	 * @param paymentStatus Payment status from webhook
	 * @throws ConflictException if transition is invalid
	 */
	private validateStateTransition(currentStatus: OrderStatus, paymentStatus: PaymentStatus): void {
		const validTransitions = {
			[OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.FAILED],
			[OrderStatus.PROCESSING]: [OrderStatus.CONFIRMED, OrderStatus.FAILED],
		};

		const targetStatus = this.mapPaymentStatusToOrderStatus(paymentStatus);

		if (!validTransitions[currentStatus]?.includes(targetStatus)) {
			this.logger.error(
				`Invalid state transition: ${currentStatus} → ${targetStatus} for payment status: ${paymentStatus}`,
			);
			throw new ConflictException(`Invalid state transition from ${currentStatus} to ${targetStatus}`);
		}
	}

	/**
	 * Maps payment status to order status.
	 * @param paymentStatus Payment status from webhook
	 * @returns Corresponding order status
	 */
	private mapPaymentStatusToOrderStatus(paymentStatus: PaymentStatus): OrderStatus {
		switch (paymentStatus) {
			case PaymentStatus.SUCCESS:
				return OrderStatus.CONFIRMED;
			case PaymentStatus.FAILED:
				return OrderStatus.FAILED;
			default:
				return OrderStatus.PENDING;
		}
	}

	/**
	 * Creates an audit log entry for the payment.
	 * @param order The order
	 * @param oldOrderStatus Previous order status
	 * @param oldSeatStatus Previous seat status
	 * @param payload Webhook payload
	 */
	private async createAuditLog(
		order: Order,
		oldOrderStatus: OrderStatus,
		oldSeatStatus: string,
		payload: IWebhookPayload,
	): Promise<void> {
		const auditEntry = this.auditPaymentRepository.create({
			entityId: order.id,
			action: 'PAYMENT_STATUS_UPDATED',
			oldValue: {
				orderStatus: oldOrderStatus,
				seatStatus: oldSeatStatus,
			},
			newValue: {
				orderStatus: order.status,
				seatStatus: this.mapPaymentStatusToSeatStatus(payload.status),
				paymentStatus: payload.status,
			},
			performedBy: order.userId,
			performedAt: new Date(),
		});

		await this.auditPaymentRepository.save(auditEntry);
		this.logger.log(`Created audit log for orderId: ${order.id}`);
	}

	/**
	 * Maps payment status to seat status.
	 * @param paymentStatus Payment status from webhook
	 * @returns Corresponding seat status
	 */
	private mapPaymentStatusToSeatStatus(paymentStatus: PaymentStatus): string {
		switch (paymentStatus) {
			case PaymentStatus.SUCCESS:
				return 'BOOKED';
			case PaymentStatus.FAILED:
				return 'AVAILABLE';
			default:
				return 'RESERVED';
		}
	}
}
