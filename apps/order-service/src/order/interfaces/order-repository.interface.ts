import { IOrder, OrderStatus } from '@seat-booking/shared-types';
import { EntityManager } from 'typeorm';

/**
 * Interface for order repository operations.
 * Defines methods to interact with the orders table in the database.
 */
export interface IOrderRepository {
	/**
	 * Creates a new order.
	 * @param order - Order data to create.
	 * @param manager - Optional TypeORM entity manager for transaction support.
	 * @returns Promise that resolves to the created IOrder object.
	 */
	createOrder(order: Partial<IOrder>, manager?: EntityManager): Promise<IOrder>;

	/**
	 * Finds an order by its ID.
	 * @param id - Unique identifier of the order.
	 * @param manager - Optional TypeORM entity manager for transaction support.
	 * @returns Promise that resolves to the IOrder object or null if not found.
	 */
	findById(id: string, manager?: EntityManager): Promise<IOrder | null>;

	/**
	 * Finds an order by its ID with pessimistic write lock.
	 * @param id - Unique identifier of the order.
	 * @param manager - TypeORM entity manager for transaction support.
	 * @returns Promise that resolves to the IOrder object or null if not found.
	 */
	findByIdForUpdate(id: string, manager: EntityManager): Promise<IOrder | null>;

	/**
	 * Updates the status of an order.
	 * @param id - Unique identifier of the order.
	 * @param status - New status for the order.
	 * @param manager - Optional TypeORM entity manager for transaction support.
	 * @returns Promise that resolves to the updated IOrder object.
	 * @throws Error if order with specified ID is not found.
	 */
	updateStatus(id: string, status: OrderStatus, manager?: EntityManager): Promise<IOrder>;

	/**
	 * Updates an order.
	 * @param order - Order data to update.
	 * @param manager - Optional TypeORM entity manager for transaction support.
	 * @returns Promise that resolves to the updated IOrder object.
	 */
	update(order: Partial<IOrder>, manager?: EntityManager): Promise<IOrder>;
}
