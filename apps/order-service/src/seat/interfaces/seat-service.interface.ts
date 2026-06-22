import { ISeat, SeatStatus } from '@seat-booking/shared-types';

/**
 * Interface for the seat service.
 * Defines the contract for seat management operations.
 */
export interface ISeatService {
	/**
	 * Retrieves all seats with their current status.
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
	 * Updates the status of a seat.
	 * @param id - Unique identifier of the seat.
	 * @param status - New status for the seat.
	 * @returns Promise that resolves to the updated ISeat object.
	 */
	updateStatus(id: string, status: SeatStatus): Promise<ISeat>;
}
