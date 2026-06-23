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
		this.logger.log('Processing webhook', {
			orderId: payload.orderId,
			webhookId: payload.webhookId,
			status: payload.status,
		});

		// Get order and seat in a single transaction with SERIALIZABLE isolation
		const queryRunner = this.dataSource.createQueryRunner();
		await queryRunner.connect();
		await queryRunner.startTransaction('SERIALIZABLE');

		try {
			// Check idempotency - get webhook log with FOR UPDATE to lock the row
			this.logger.debug('Checking webhook idempotency', {
				webhookId: payload.webhookId,
			});
			const existingWebhookLog = await queryRunner.manager.findOne(
				WebhookLog,
				{
					where: { webhookId: payload.webhookId },
					lock: { mode: 'pessimistic_write' },
				},
			);

			if (existingWebhookLog) {
				this.logger.warn('Webhook already processed', {
					orderId: payload.orderId,
					webhookId: payload.webhookId,
				});
				await queryRunner.commitTransaction();
				return;
			}

			// Get order
			this.logger.debug('Finding order', {
				orderId: payload.orderId,
			});
			const order = (await queryRunner.manager.findOne(Order, {
				where: { id: payload.orderId },
				lock: { mode: 'pessimistic_write' },
			})) as Order;

			if (!order) {
				this.logger.error('Order not found', {
					orderId: payload.orderId,
				});
				await queryRunner.commitTransaction();
				return;
			}

			// Validate state transition
			this.logger.debug('Validating state transition', {
				orderId: payload.orderId,
				currentStatus: order.status,
				targetStatus: payload.status,
			});
			this.validateStateTransition(order.status, payload.status);

			// Get seat
			this.logger.debug('Finding seat', {
				orderId: payload.orderId,
				seatId: order.seatId,
			});
			const seat = (await queryRunner.manager.findOne(Seat, {
				where: { id: order.seatId },
				lock: { mode: 'pessimistic_write' },
			})) as Seat;

			if (!seat) {
				this.logger.error('Seat not found', {
					orderId: payload.orderId,
					seatId: order.seatId,
				});
				await queryRunner.commitTransaction();
				return;
			}

			// Update order status
			const oldOrderStatus = order.status;
			const newOrderStatus = this.mapPaymentStatusToOrderStatus(
				payload.status,
			);
			order.status = newOrderStatus;
			order.updatedAt = new Date();
			this.logger.debug('Updated order status', {
				orderId: payload.orderId,
				oldStatus: oldOrderStatus,
				newStatus: newOrderStatus,
			});

			// Update seat status
			const oldSeatStatus = seat.status;
			let newSeatStatus = oldSeatStatus;
			if (payload.status === PaymentStatus.SUCCESS) {
				seat.status = 'BOOKED';
				newSeatStatus = 'BOOKED';
			} else if (payload.status === PaymentStatus.FAILED) {
				seat.status = 'AVAILABLE';
				newSeatStatus = 'AVAILABLE';
			}
			this.logger.debug('Updated seat status', {
				orderId: payload.orderId,
				seatId: order.seatId,
				oldStatus: oldSeatStatus,
				newStatus: newSeatStatus,
			});

			// Create webhook log
			this.logger.debug('Creating webhook log', {
				webhookId: payload.webhookId,
				orderId: payload.orderId,
			});
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
			this.logger.log('Successfully processed webhook', {
				orderId: payload.orderId,
			});

			// Create audit log (outside transaction to ensure it's recorded even if transaction fails)
			this.logger.debug('Creating audit log', {
				orderId: payload.orderId,
			});
			await this.createAuditLog(
				order,
				oldOrderStatus,
				oldSeatStatus,
				payload,
			);
		} catch (error) {
			await queryRunner.rollbackTransaction();
			this.logger.error('Failed to process webhook', {
				orderId: payload.orderId,
				error: error instanceof Error ? error.message : 'Unknown error',
				stack: error instanceof Error ? error.stack : undefined,
			});
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
	private validateStateTransition(
		currentStatus: OrderStatus,
		paymentStatus: PaymentStatus,
	): void {
		const validTransitions = {
			[OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.FAILED],
			[OrderStatus.PROCESSING]: [
				OrderStatus.CONFIRMED,
				OrderStatus.FAILED,
			],
		};

		const targetStatus = this.mapPaymentStatusToOrderStatus(paymentStatus);

		if (!validTransitions[currentStatus]?.includes(targetStatus)) {
			this.logger.error('Invalid state transition', {
				currentStatus,
				targetStatus,
				paymentStatus,
			});
			throw new ConflictException(
				`Invalid state transition from ${currentStatus} to ${targetStatus}`,
			);
		}
	}

	/**
	 * Maps payment status to order status.
	 * @param paymentStatus Payment status from webhook
	 * @returns Corresponding order status
	 */
	private mapPaymentStatusToOrderStatus(
		paymentStatus: PaymentStatus,
	): OrderStatus {
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
		this.logger.debug('Created audit log', {
			orderId: order.id,
			auditEntry,
		});
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
