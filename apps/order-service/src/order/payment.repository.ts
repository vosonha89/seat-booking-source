import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Payment } from '@seat-booking/database';
import { IPayment, PaymentStatus } from '@seat-booking/shared-types';
import { IPaymentRepository } from './interfaces/payment-repository.interface';

/**
 * TypeORM implementation of the payment repository interface.
 */
@Injectable()
export class PaymentRepository implements IPaymentRepository {
	constructor(
		@InjectRepository(Payment, 'postgres')
		private readonly paymentRepository: Repository<Payment>,
	) {}

	/**
	 * Creates a new payment.
	 * @param payment - Payment data to create.
	 * @param manager - Optional TypeORM entity manager for transaction support.
	 * @returns Promise that resolves to the created IPayment object.
	 */
	public async createPayment(
		payment: Partial<IPayment>,
		manager?: EntityManager,
	): Promise<IPayment> {
		const repository = manager
			? manager.getRepository(Payment)
			: this.paymentRepository;
		const newPayment = repository.create(payment);
		const savedPayment = await repository.save(newPayment);
		return this.mapEntityToDto(savedPayment);
	}

	/**
	 * Finds a payment by its ID.
	 * @param id - Unique identifier of the payment.
	 * @param manager - Optional TypeORM entity manager for transaction support.
	 * @returns Promise that resolves to the IPayment object or null if not found.
	 */
	public async findById(
		id: string,
		manager?: EntityManager,
	): Promise<IPayment | null> {
		const repository = manager
			? manager.getRepository(Payment)
			: this.paymentRepository;
		const payment = await repository.findOneBy({ id });
		if (!payment) {
			return null;
		}
		return this.mapEntityToDto(payment);
	}

	/**
	 * Finds a payment by order ID.
	 * @param orderId - Order identifier to find payments for.
	 * @param manager - Optional TypeORM entity manager for transaction support.
	 * @returns Promise that resolves to the IPayment object or null if not found.
	 */
	public async findByOrderId(
		orderId: string,
		manager?: EntityManager,
	): Promise<IPayment | null> {
		const repository = manager
			? manager.getRepository(Payment)
			: this.paymentRepository;
		const payment = await repository.findOneBy({ orderId });
		if (!payment) {
			return null;
		}
		return this.mapEntityToDto(payment);
	}

	/**
	 * Finds a payment by idempotency key.
	 * @param idempotencyKey - Idempotency key to find payment for.
	 * @param manager - Optional TypeORM entity manager for transaction support.
	 * @returns Promise that resolves to the IPayment object or null if not found.
	 */
	public async findByIdempotencyKey(
		idempotencyKey: string,
		manager?: EntityManager,
	): Promise<IPayment | null> {
		const repository = manager
			? manager.getRepository(Payment)
			: this.paymentRepository;
		const payment = await repository.findOneBy({ idempotencyKey });
		if (!payment) {
			return null;
		}
		return this.mapEntityToDto(payment);
	}

	/**
	 * Updates the status of a payment.
	 * @param id - Unique identifier of the payment.
	 * @param status - New status for the payment.
	 * @param manager - Optional TypeORM entity manager for transaction support.
	 * @returns Promise that resolves to the updated IPayment object.
	 * @throws Error if payment with specified ID is not found.
	 */
	public async updateStatus(
		id: string,
		status: PaymentStatus,
		manager?: EntityManager,
	): Promise<IPayment> {
		const repository = manager
			? manager.getRepository(Payment)
			: this.paymentRepository;
		const payment = await repository.findOneBy({ id });

		if (!payment) {
			throw new Error(`Payment with ID ${id} not found`);
		}

		payment.status = status;
		payment.updatedAt = new Date();

		const updatedPayment = await repository.save(payment);
		return this.mapEntityToDto(updatedPayment);
	}

	/**
	 * Updates a payment.
	 * @param payment - Payment data to update.
	 * @param manager - Optional TypeORM entity manager for transaction support.
	 * @returns Promise that resolves to the updated IPayment object.
	 */
	public async update(
		payment: Partial<IPayment>,
		manager?: EntityManager,
	): Promise<IPayment> {
		const repository = manager
			? manager.getRepository(Payment)
			: this.paymentRepository;
		const existingPayment = await repository.findOneBy({ id: payment.id });

		if (!existingPayment) {
			throw new Error(`Payment with ID ${payment.id} not found`);
		}

		const updatedPayment = repository.merge(existingPayment, payment);
		updatedPayment.updatedAt = new Date();

		const savedPayment = await repository.save(updatedPayment);
		return this.mapEntityToDto(savedPayment);
	}

	/**
	 * Maps TypeORM Payment entity to IPayment DTO.
	 * @param entity - Payment entity to map.
	 * @returns IPayment DTO.
	 */
	private mapEntityToDto(entity: Payment): IPayment {
		return {
			id: entity.id,
			orderId: entity.orderId,
			status: entity.status as PaymentStatus,
			amount: entity.amount,
			transactionId: entity.transactionId,
			gatewayResponse: entity.gatewayResponse,
			idempotencyKey: entity.idempotencyKey,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
		};
	}
}
