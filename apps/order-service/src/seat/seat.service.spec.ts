import { Test, TestingModule } from '@nestjs/testing';
import { SeatService } from './seat.service';
import { ISeatServiceSymbol, ISeatRepositorySymbol } from './tokens';
import { SeatStatusEnum } from '@seat-booking/shared-types';
import { ISeatRepository } from './interfaces/seat-repository.interface';

describe('SeatService', () => {
	let service: SeatService;
	let mockRepository: jest.Mocked<ISeatRepository>;

	beforeEach(async () => {
		// Create mock repository
		mockRepository = {
			findAll: jest.fn(),
			findById: jest.fn(),
			findByIdForUpdate: jest.fn(),
			updateStatus: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				{
					provide: ISeatServiceSymbol,
					useClass: SeatService,
				},
				{
					provide: ISeatRepositorySymbol,
					useValue: mockRepository,
				},
			],
		}).compile();

		service = module.get<SeatService>(ISeatServiceSymbol);
	});

	describe('service instantiation', () => {
		it('should be defined', () => {
			expect(service).toBeDefined();
		});
	});

	describe('findAll', () => {
		it('should return all seats', async () => {
			// Arrange
			const mockSeats = [
				{ id: '1', label: 'A1', status: SeatStatusEnum.AVAILABLE },
				{ id: '2', label: 'A2', status: SeatStatusEnum.RESERVED },
			];
			mockRepository.findAll.mockResolvedValue(mockSeats);

			// Act
			const seats = await service.findAll();

			// Assert
			expect(seats).toEqual(mockSeats);
			expect(mockRepository.findAll).toHaveBeenCalled();
		});
	});

	describe('findById', () => {
		it('should return null for non-existent seat', async () => {
			// Arrange
			mockRepository.findById.mockResolvedValue(null);

			// Act
			const nonExistentSeat = await service.findById('non-existent-id');

			// Assert
			expect(nonExistentSeat).toBeNull();
			expect(mockRepository.findById).toHaveBeenCalledWith('non-existent-id');
		});

		it('should find existing seat by id', async () => {
			// Arrange
			const mockSeat = { id: '1', label: 'A1', status: SeatStatusEnum.AVAILABLE };
			mockRepository.findById.mockResolvedValue(mockSeat);

			// Act
			const foundSeat = await service.findById('1');

			// Assert
			expect(foundSeat).toEqual(mockSeat);
			expect(mockRepository.findById).toHaveBeenCalledWith('1');
		});
	});

	describe('updateStatus', () => {
		it('should update seat status', async () => {
			// Arrange
			const updatedSeat = { id: '1', label: 'A1', status: SeatStatusEnum.RESERVED };
			mockRepository.updateStatus.mockResolvedValue(updatedSeat);

			// Act
			const result = await service.updateStatus('1', SeatStatusEnum.RESERVED, 'user-123');

			// Assert
			expect(result).toEqual(updatedSeat);
			expect(mockRepository.updateStatus).toHaveBeenCalledWith('1', SeatStatusEnum.RESERVED, 'user-123');
		});

		it('should throw error when updating non-existent seat', async () => {
			// Arrange
			mockRepository.updateStatus.mockRejectedValue(new Error('Seat not found'));

			// Act & Assert
			await expect(
				service.updateStatus('non-existent-id', SeatStatusEnum.BOOKED),
			).rejects.toThrow();
			expect(mockRepository.updateStatus).toHaveBeenCalledWith('non-existent-id', SeatStatusEnum.BOOKED, undefined);
		});

		it('should update seat status with valid enum value', async () => {
			// Arrange
			const updatedSeat = { id: '1', label: 'A1', status: SeatStatusEnum.BOOKED };
			mockRepository.updateStatus.mockResolvedValue(updatedSeat);

			// Act
			await service.updateStatus('1', SeatStatusEnum.BOOKED, 'user-123');

			// Assert
			expect(mockRepository.updateStatus).toHaveBeenCalledWith('1', SeatStatusEnum.BOOKED, 'user-123');
		});
	});
});
