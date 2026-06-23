import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Seat } from '@seat-booking/database';
import { ISeat, SeatStatusEnum, SeatStatus } from '@seat-booking/shared-types';
import { ISeatRepository } from './interfaces/seat-repository.interface';

/**
 * TypeORM implementation of the seat repository interface.
 */
@Injectable()
export class SeatRepository implements ISeatRepository {
	constructor(
		@InjectRepository(Seat, 'postgres')
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
	 * Finds a single seat by its ID with pessimistic write lock for update operations.
	 * @param id - Unique identifier of the seat.
	 * @param manager - Optional TypeORM entity manager for transaction support.
	 * @returns Promise that resolves to the ISeat object or null if not found.
	 */
	public async findByIdForUpdate(id: string, manager?: EntityManager): Promise<ISeat | null> {
		const repository = manager ? manager.getRepository(Seat) : this.seatRepository;

		const seat = await repository.createQueryBuilder('seat')
			.setLock('pessimistic_write')
			.where('seat.id = :id', { id })
			.getOne();

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
		status: SeatStatus,
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
	 * Updates a seat.
	 * @param seat - Seat data to update.
	 * @param manager - Optional TypeORM entity manager for transaction support.
	 * @returns Promise that resolves to the updated ISeat object.
	 */
	public async update(
		seat: Partial<ISeat>,
		manager?: EntityManager,
	): Promise<ISeat> {
		const repository = manager ? manager.getRepository(Seat) : this.seatRepository;
		const existingSeat = await repository.findOneBy({ id: seat.id });

		if (!existingSeat) {
			throw new Error(`Seat with ID ${seat.id} not found`);
		}

		const updatedSeat = repository.merge(existingSeat, seat);

		if (seat.status === SeatStatusEnum.RESERVED && seat.reservedBy) {
			updatedSeat.reservedBy = seat.reservedBy;
			updatedSeat.reservedAt = new Date();
		} else if (seat.status !== SeatStatusEnum.RESERVED) {
			updatedSeat.reservedBy = null;
			updatedSeat.reservedAt = null;
		}

		const savedSeat = await repository.save(updatedSeat);
		return this.mapEntityToDto([savedSeat])[0];
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
