import { ISeat, SeatStatus } from '@seat-booking/shared-types';
import { EntityManager } from 'typeorm';

/**
 * Interface for seat repository operations.
 * Defines methods to interact with the seats table in the database.
 */
export interface ISeatRepository {
	/**
	 * Retrieves all seats from the database.
	 * @returns Promise that resolves to an array of ISeat objects.
	 */
	findAll(): Promise<ISeat[]>;

	/**
	 * Finds a single seat by its ID.
	 * @param id - Unique identifier of the seat.
	 * @returns Promise that resolves to the ISeat object or null if not found.
	 */
	findById(id: string): Promise<ISeat | null>;

	/**
	 * Finds a single seat by its ID with pessimistic write lock for update operations.
	 * @param id - Unique identifier of the seat.
	 * @param manager - Optional TypeORM entity manager for transaction support.
	 * @returns Promise that resolves to the ISeat object or null if not found.
	 */
	findByIdForUpdate(id: string, manager?: EntityManager): Promise<ISeat | null>;

	/**
	 * Updates the status of a seat.
	 * @param id - Unique identifier of the seat.
	 * @param status - New status for the seat.
	 * @param reservedBy - Optional user ID who reserved the seat.
	 * @returns Promise that resolves to the updated ISeat object.
	 * @throws Error if seat with specified ID is not found.
	 */
	updateStatus(id: string, status: SeatStatus, reservedBy?: string): Promise<ISeat>;
}
