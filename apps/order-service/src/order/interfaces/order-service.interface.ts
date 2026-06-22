import { IOrder } from '@seat-booking/shared-types';

/**
 * Interface for order service operations.
 * Defines business logic for managing orders.
 */
export interface IOrderService {
	/**
	 * Creates a new order and reserves the seat.
	 * @param seatId - ID of the seat to reserve.
	 * @param userId - ID of the user creating the order.
	 * @param accountId - ID of the account for the order.
	 * @returns Promise that resolves to the created IOrder object.
	 * @throws ConflictError if the seat is already reserved.
	 * @throws Error if the seat is not found.
	 */
	createOrder(seatId: string, userId: string, accountId: string): Promise<IOrder>;

	/**
	 * Finds an order by its ID.
	 * @param id - Unique identifier of the order.
	 * @returns Promise that resolves to the IOrder object or null if not found.
	 */
	findById(id: string): Promise<IOrder | null>;
}
