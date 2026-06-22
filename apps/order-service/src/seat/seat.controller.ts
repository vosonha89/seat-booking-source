import { Controller, Get, Param, Inject } from '@nestjs/common';
import { ISeat } from '@seat-booking/shared-types';
import { ISeatService } from './interfaces/seat-service.interface';
import { ISeatServiceSymbol } from './tokens';

/**
 * Controller handling seat-related API endpoints.
 */
@Controller('seats')
export class SeatController {
	/**
	 * Create an instance of SeatController.
	 * @param seatService - The seat service providing business logic.
	 */
	constructor(
		@Inject(ISeatServiceSymbol) private readonly seatService: ISeatService,
	) {}

	/**
	 * Retrieves all seats with their current status.
	 * @returns Promise that resolves to an array of ISeat objects.
	 */
	@Get()
	public async getSeats(): Promise<ISeat[]> {
		return this.seatService.findAll();
	}

	/**
	 * Retrieves a single seat by its ID.
	 * @param id - Unique identifier of the seat.
	 * @returns Promise that resolves to the ISeat object or null if not found.
	 */
	@Get(':id')
	public async getSeatById(@Param('id') id: string): Promise<ISeat | null> {
		return this.seatService.findById(id);
	}
}
