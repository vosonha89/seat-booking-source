import { Injectable, Inject } from '@nestjs/common';
import { ISeat } from '@seat-booking/shared-types';
import { ISeatService } from './interfaces/seat-service.interface';
import { ISeatRepository } from './interfaces/seat-repository.interface';
import { ISeatRepositorySymbol } from './tokens';

/**
 * Implementation of the seat service interface.
 * Uses TypeORM repository to interact with the PostgreSQL database.
 */
@Injectable()
export class SeatService implements ISeatService {
	constructor(
		@Inject(ISeatRepositorySymbol)
		private readonly seatRepository: ISeatRepository,
	) {}

	/**
	 * Retrieves all seats from the database.
	 * @returns Promise that resolves to an array of ISeat objects.
	 */
	public async findAll(): Promise<ISeat[]> {
		return this.seatRepository.findAll();
	}

	/**
	 * Finds a single seat by its ID.
	 * @param id - Unique identifier of the seat.
	 * @returns Promise that resolves to the ISeat object or null if not found.
	 */
	public async findById(id: string): Promise<ISeat | null> {
		return this.seatRepository.findById(id);
	}

	/**
	 * Updates the status of a seat.
	 * @param id - Unique identifier of the seat.
	 * @param status - New status for the seat.
	 * @param reservedBy - Optional user ID who reserved the seat.
	 * @returns Promise that resolves to the updated ISeat object.
	 * @throws Error if seat with specified ID is not found.
	 */
	public async updateStatus(
		id: string,
		status: string,
		reservedBy?: string,
	): Promise<ISeat> {
		return this.seatRepository.updateStatus(id, status, reservedBy);
	}
}
