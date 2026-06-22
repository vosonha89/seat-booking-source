import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Seat } from '@seat-booking/database';
import { ISeat, SeatStatusEnum } from '@seat-booking/shared-types';
import { ISeatRepository } from './interfaces/seat-repository.interface';

/**
 * TypeORM implementation of the seat repository interface.
 */
@Injectable()
export class SeatRepository implements ISeatRepository {
	constructor(
		@InjectRepository(Seat)
		private readonly seatRepository: Repository<Seat>,
	) {}

	/**
	 * Retrieves all seats from the database.
	 * @returns Promise that resolves to an array of ISeat objects.
	 */
	public async findAll(): Promise<ISeat[]> {
		const seats = await this.seatRepository.find({
			order: { label: 'ASC' },
		});
		return this.mapEntityToDto(seats);
	}

	/**
	 * Finds a single seat by its ID.
	 * @param id - Unique identifier of the seat.
	 * @returns Promise that resolves to the ISeat object or null if not found.
	 */
	public async findById(id: string): Promise<ISeat | null> {
		const seat = await this.seatRepository.findOneBy({ id });
		if (!seat) {
			return null;
		}
		return this.mapEntityToDto([seat])[0];
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
		const seat = await this.seatRepository.findOneBy({ id });

		if (!seat) {
			throw new Error(`Seat with ID ${id} not found`);
		}

		seat.status = status;

		if (status === SeatStatusEnum.RESERVED) {
			seat.reservedBy = reservedBy;
			seat.reservedAt = new Date();
		} else {
			seat.reservedBy = null;
			seat.reservedAt = null;
		}

		const updatedSeat = await this.seatRepository.save(seat);
		return this.mapEntityToDto([updatedSeat])[0];
	}

	/**
	 * Maps TypeORM Seat entities to ISeat DTOs.
	 * @param entities - Array of Seat entities.
	 * @returns Array of ISeat DTOs.
	 */
	private mapEntityToDto(entities: Seat[]): ISeat[] {
		return entities.map((entity) => ({
			id: entity.id,
			label: entity.label,
			status: entity.status,
			reservedBy: entity.reservedBy,
			reservedAt: entity.reservedAt,
		}));
	}
}
