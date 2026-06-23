import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SeatRepository } from './seat.repository';
import { Seat } from '@seat-booking/database';
import { SeatStatusEnum } from '@seat-booking/shared-types';

describe('SeatRepository', () => {
	let repository: SeatRepository;
	let typeOrmRepository: jest.Mocked<Repository<Seat>>;

	beforeEach(async () => {
		typeOrmRepository = {
			find: jest.fn(),
			findOneBy: jest.fn(),
			save: jest.fn(),
		} as unknown as jest.Mocked<Repository<Seat>>;

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				SeatRepository,
				{
					provide: getRepositoryToken(Seat, 'postgres'),
					useValue: typeOrmRepository,
				},
			],
		}).compile();

		repository = module.get<SeatRepository>(SeatRepository);
	});

	describe('findAll', () => {
		it('should return all seats', async () => {
			// Arrange
			const mockSeats = [
				{ id: '1', label: 'A1', status: SeatStatusEnum.AVAILABLE },
			];
			typeOrmRepository.find.mockResolvedValue(mockSeats);

			// Act
			const seats = await repository.findAll();

			// Assert
			expect(seats).toEqual(mockSeats);
			expect(typeOrmRepository.find).toHaveBeenCalled();
		});
	});

	describe('findById', () => {
		it('should return null when seat not found', async () => {
			// Arrange
			typeOrmRepository.findOneBy.mockResolvedValue(null);

			// Act
			const result = await repository.findById('non-existent-id');

			// Assert
			expect(result).toBeNull();
			expect(typeOrmRepository.findOneBy).toHaveBeenCalledWith({
				id: 'non-existent-id',
			});
		});

		it('should return seat when found', async () => {
			// Arrange
			const mockSeat = {
				id: '1',
				label: 'A1',
				status: SeatStatusEnum.AVAILABLE,
			};
			typeOrmRepository.findOneBy.mockResolvedValue(mockSeat);

			// Act
			const result = await repository.findById('1');

			// Assert
			expect(result).toEqual(mockSeat);
			expect(typeOrmRepository.findOneBy).toHaveBeenCalledWith({
				id: '1',
			});
		});
	});

	describe('updateStatus', () => {
		it('should throw error when seat not found', async () => {
			// Arrange
			typeOrmRepository.findOneBy.mockResolvedValue(null);

			// Act & Assert
			await expect(
				repository.updateStatus(
					'non-existent-id',
					SeatStatusEnum.BOOKED,
				),
			).rejects.toThrow('Seat with ID non-existent-id not found');
			expect(typeOrmRepository.findOneBy).toHaveBeenCalledWith({
				id: 'non-existent-id',
			});
		});

		it('should update seat status', async () => {
			// Arrange
			const mockSeat = {
				id: '1',
				label: 'A1',
				status: SeatStatusEnum.AVAILABLE,
			};
			typeOrmRepository.findOneBy.mockResolvedValue(mockSeat);
			typeOrmRepository.save.mockResolvedValue({
				...mockSeat,
				status: SeatStatusEnum.BOOKED,
				reservedBy: 'user-123',
			});

			// Act
			const updatedSeat = await repository.updateStatus(
				'1',
				SeatStatusEnum.BOOKED,
				'user-123',
			);

			// Assert
			expect(updatedSeat.status).toBe(SeatStatusEnum.BOOKED);
			expect(updatedSeat.reservedBy).toBe('user-123');
			expect(typeOrmRepository.findOneBy).toHaveBeenCalledWith({
				id: '1',
			});
			expect(typeOrmRepository.save).toHaveBeenCalled();
		});
	});
});
