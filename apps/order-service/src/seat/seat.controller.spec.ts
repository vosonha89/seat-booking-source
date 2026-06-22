import { Test, TestingModule } from '@nestjs/testing';
import { SeatController } from './seat.controller';
import { ISeatServiceSymbol } from './tokens';
import { ISeatService } from './interfaces/seat-service.interface';
import { SeatStatusEnum } from '@seat-booking/shared-types';

describe('SeatController', () => {
	let controller: SeatController;
	let mockSeatService: jest.Mocked<ISeatService>;

	beforeEach(async () => {
		// Create mock service
		mockSeatService = {
			findAll: jest.fn(),
			findById: jest.fn(),
			updateStatus: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			controllers: [SeatController],
			providers: [
				{
					provide: ISeatServiceSymbol,
					useValue: mockSeatService,
				},
			],
		}).compile();

		controller = module.get<SeatController>(SeatController);
	});

	describe('controller instantiation', () => {
		it('should be defined', () => {
			expect(controller).toBeDefined();
		});
	});

	describe('getSeats', () => {
		it('should call seatService.findAll()', async () => {
			const mockSeats = [];
			mockSeatService.findAll.mockResolvedValue(mockSeats);

			await controller.getSeats();

			expect(mockSeatService.findAll).toHaveBeenCalledTimes(1);
		});

		it('should return the seats from the service', async () => {
			const mockSeats = [
				{
					id: 'A1',
					label: 'A1',
					status: SeatStatusEnum.AVAILABLE,
				},
				{
					id: 'A2',
					label: 'A2',
					status: SeatStatusEnum.RESERVED,
				},
			];
			mockSeatService.findAll.mockResolvedValue(mockSeats);

			const result = await controller.getSeats();

			expect(result).toEqual(mockSeats);
		});
	});

	describe('getSeatById', () => {
		it('should call seatService.findById() with correct id', async () => {
			const mockSeat = {
				id: 'A1',
				label: 'A1',
				status: SeatStatusEnum.AVAILABLE,
			};
			mockSeatService.findById.mockResolvedValue(mockSeat);

			await controller.getSeatById('A1');

			expect(mockSeatService.findById).toHaveBeenCalledWith('A1');
			expect(mockSeatService.findById).toHaveBeenCalledTimes(1);
		});

		it('should return the seat from the service', async () => {
			const mockSeat = {
				id: 'A1',
				label: 'A1',
				status: SeatStatusEnum.AVAILABLE,
			};
			mockSeatService.findById.mockResolvedValue(mockSeat);

			const result = await controller.getSeatById('A1');

			expect(result).toEqual(mockSeat);
		});

		it('should return null when seat is not found', async () => {
			mockSeatService.findById.mockResolvedValue(null);

			const result = await controller.getSeatById('non-existent');

			expect(result).toBeNull();
		});
	});
});
