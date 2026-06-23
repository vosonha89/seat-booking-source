import { IPayment, PaymentStatus } from '@seat-booking/shared-types';
import { EntityManager } from 'typeorm';

/**
 * Interface for payment repository operations.
 * Defines methods to interact with the payments table in the database.
 */
export interface IPaymentRepository {
	/**
	 * Creates a new payment.
	 * @param payment - Payment data to create.
	 * @param manager - Optional TypeORM entity manager for transaction support.
	 * @returns Promise that resolves to the created IPayment object.
	 */
	createPayment(
		payment: Partial<IPayment>,
		manager?: EntityManager,
	): Promise<IPayment>;

	/**
	 * Finds a payment by its ID.
	 * @param id - Unique identifier of the payment.
	 * @param manager - Optional TypeORM entity manager for transaction support.
	 * @returns Promise that resolves to the IPayment object or null if not found.
	 */
	findById(id: string, manager?: EntityManager): Promise<IPayment | null>;

	/**
	 * Finds a payment by order ID.
	 * @param orderId - Order identifier to find payments for.
	 * @param manager - Optional TypeORM entity manager for transaction support.
	 * @returns Promise that resolves to the IPayment object or null if not found.
	 */
	findByOrderId(
		orderId: string,
		manager?: EntityManager,
	): Promise<IPayment | null>;

	/**
	 * Finds a payment by idempotency key.
	 * @param idempotencyKey - Idempotency key to find payment for.
	 * @param manager - Optional TypeORM entity manager for transaction support.
	 * @returns Promise that resolves to the IPayment object or null if not found.
	 */
	findByIdempotencyKey(
		idempotencyKey: string,
		manager?: EntityManager,
	): Promise<IPayment | null>;

	/**
	 * Updates the status of a payment.
	 * @param id - Unique identifier of the payment.
	 * @param status - New status for the payment.
	 * @param manager - Optional TypeORM entity manager for transaction support.
	 * @returns Promise that resolves to the updated IPayment object.
	 * @throws Error if payment with specified ID is not found.
	 */
	updateStatus(
		id: string,
		status: PaymentStatus,
		manager?: EntityManager,
	): Promise<IPayment>;

	/**
	 * Updates a payment.
	 * @param payment - Payment data to update.
	 * @param manager - Optional TypeORM entity manager for transaction support.
	 * @returns Promise that resolves to the updated IPayment object.
	 */
	update(
		payment: Partial<IPayment>,
		manager?: EntityManager,
	): Promise<IPayment>;
}
