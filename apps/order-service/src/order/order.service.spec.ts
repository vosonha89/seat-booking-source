import { Test, TestingModule } from '@nestjs/testing';
import { OrderService } from './order.service';
import {
	IOrderServiceSymbol,
	IOrderRepositorySymbol,
	IPaymentRepositorySymbol,
} from './tokens';
import { IOrderRepository } from './interfaces/order-repository.interface';
import { ISeatRepository } from '../seat/interfaces/seat-repository.interface';
import { IPaymentRepository } from './interfaces/payment-repository.interface';
import { ISeatRepositorySymbol } from '../seat/tokens';
import {
	OrderStatus,
	SeatStatusEnum,
	PaymentStatus,
} from '@seat-booking/shared-types';
import { DataSource } from 'typeorm';
import { ConflictException } from '@nestjs/common';
import { SqsProducerService } from './sqs-producer.service';

describe('OrderService', () => {
	let service: OrderService;
	let mockOrderRepository: jest.Mocked<IOrderRepository>;
	let mockSeatRepository: jest.Mocked<ISeatRepository>;
	let mockPaymentRepository: jest.Mocked<IPaymentRepository>;
	let mockDataSource: Partial<DataSource>;
	let mockSqsProducerService: Partial<SqsProducerService>;

	beforeEach(async () => {
		// Create mock repositories
		mockOrderRepository = {
			createOrder: jest.fn(),
			findById: jest.fn(),
			updateStatus: jest.fn(),
			findByIdForUpdate: jest.fn(),
			update: jest.fn(),
		};

		mockSeatRepository = {
			findByIdForUpdate: jest.fn(),
			findById: jest.fn(),
			findAll: jest.fn(),
			updateStatus: jest.fn(),
			update: jest.fn(),
		};

		mockPaymentRepository = {
			createPayment: jest.fn(),
			findById: jest.fn(),
			findByOrderId: jest.fn(),
			findByIdempotencyKey: jest.fn(),
			updateStatus: jest.fn(),
			update: jest.fn(),
		};

		mockDataSource = {
			transaction: jest.fn(),
		};

		mockSqsProducerService = {
			sendPaymentProcessingMessage: jest
				.fn()
				.mockResolvedValue(undefined),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				{
					provide: IOrderServiceSymbol,
					useClass: OrderService,
				},
				{
					provide: IOrderRepositorySymbol,
					useValue: mockOrderRepository,
				},
				{
					provide: ISeatRepositorySymbol,
					useValue: mockSeatRepository,
				},
				{
					provide: IPaymentRepositorySymbol,
					useValue: mockPaymentRepository,
				},
				{
					provide: 'postgresDataSource',
					useValue: mockDataSource,
				},
				{
					provide: SqsProducerService,
					useValue: mockSqsProducerService,
				},
			],
		}).compile();

		service = module.get<OrderService>(IOrderServiceSymbol);
	});

	describe('service instantiation', () => {
		it('should be defined', () => {
			expect(service).toBeDefined();
		});
	});

	describe('createOrder', () => {
		it('should create order when seat is available', async () => {
			const seatId = 'seat-123';
			const userId = 'user-456';
			const accountId = 'account-789';
			const orderData = {
				userId,
				seatId,
				accountId,
				status: OrderStatus.PENDING,
				idempotencyKey: 'test-idempotency-key',
			};
			const createdOrder = {
				id: 'order-123',
				...orderData,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			mockSeatRepository.findByIdForUpdate.mockResolvedValue({
				id: seatId,
				label: 'A1',
				status: SeatStatusEnum.AVAILABLE,
			});
			mockOrderRepository.createOrder.mockResolvedValue(createdOrder);
			mockPaymentRepository.createPayment.mockResolvedValue({
				id: 'payment-123',
				orderId: createdOrder.id,
				status: PaymentStatus.PENDING,
				amount: 10000,
				idempotencyKey: 'test-idempotency-key',
				createdAt: new Date(),
				updatedAt: new Date(),
			});
			(mockDataSource.transaction as jest.Mock).mockImplementation(
				(isolationLevel, callback) => callback({}),
			);

			const result = await service.createOrder(seatId, userId, accountId);

			expect(result).toEqual(createdOrder);
			expect(mockDataSource.transaction).toHaveBeenCalledWith(
				'SERIALIZABLE',
				expect.any(Function),
			);
			expect(mockSeatRepository.findByIdForUpdate).toHaveBeenCalledWith(
				seatId,
				expect.any(Object),
			);
			expect(mockOrderRepository.createOrder).toHaveBeenCalledWith(
				expect.objectContaining({
					userId,
					seatId,
					accountId,
					status: OrderStatus.PENDING,
				}),
				expect.any(Object),
			);
		});

		it('should throw ConflictException when seat is already reserved', async () => {
			const seatId = 'seat-123';
			const userId = 'user-456';
			const accountId = 'account-789';

			mockSeatRepository.findByIdForUpdate.mockResolvedValue({
				id: seatId,
				label: 'A1',
				status: SeatStatusEnum.BOOKED,
			});
			(mockDataSource.transaction as jest.Mock).mockImplementation(
				(isolationLevel, callback) => callback({}),
			);

			await expect(
				service.createOrder(seatId, userId, accountId),
			).rejects.toThrow(ConflictException);
		});

		it('should throw error when seat is not found', async () => {
			const seatId = 'seat-123';
			const userId = 'user-456';
			const accountId = 'account-789';

			mockSeatRepository.findByIdForUpdate.mockResolvedValue(null);
			(mockDataSource.transaction as jest.Mock).mockImplementation(
				(isolationLevel, callback) => callback({}),
			);

			await expect(
				service.createOrder(seatId, userId, accountId),
			).rejects.toThrow(Error);
		});
	});

	describe('updatePaymentStatus', () => {
		it('should update payment status and order status', async () => {
			const orderId = 'order-123';
			const orderData = {
				id: orderId,
				userId: 'user-456',
				seatId: 'seat-123',
				accountId: 'account-789',
				status: OrderStatus.PENDING,
				idempotencyKey: 'test-idempotency-key',
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			mockOrderRepository.findByIdForUpdate.mockResolvedValue(orderData);
			mockPaymentRepository.findByOrderId.mockResolvedValue({
				id: 'payment-123',
				orderId,
				status: PaymentStatus.PENDING,
				amount: 10000,
				idempotencyKey: 'test-idempotency-key',
				createdAt: new Date(),
				updatedAt: new Date(),
			});
			mockOrderRepository.update.mockResolvedValue({
				...orderData,
				status: OrderStatus.CONFIRMED,
			});
			(mockDataSource.transaction as jest.Mock).mockImplementation(
				(callback) => callback({}),
			);

			const result = await service.updatePaymentStatus(
				orderId,
				'CONFIRMED',
			);

			expect(result).toEqual({
				...orderData,
				status: OrderStatus.CONFIRMED,
			});
			expect(mockOrderRepository.findByIdForUpdate).toHaveBeenCalledWith(
				orderId,
				expect.any(Object),
			);
			expect(mockPaymentRepository.findByOrderId).toHaveBeenCalledWith(
				orderId,
				expect.any(Object),
			);
			expect(mockPaymentRepository.updateStatus).toHaveBeenCalledWith(
				'payment-123',
				PaymentStatus.SUCCESS,
				expect.any(Object),
			);
			expect(mockOrderRepository.update).toHaveBeenCalledWith(
				expect.objectContaining({ status: OrderStatus.CONFIRMED }),
				expect.any(Object),
			);
		});

		it('should update payment status to failed and release seat', async () => {
			const orderId = 'order-123';
			const orderData = {
				id: orderId,
				userId: 'user-456',
				seatId: 'seat-123',
				accountId: 'account-789',
				status: OrderStatus.PENDING,
				idempotencyKey: 'test-idempotency-key',
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			mockOrderRepository.findByIdForUpdate.mockResolvedValue(orderData);
			mockPaymentRepository.findByOrderId.mockResolvedValue({
				id: 'payment-123',
				orderId,
				status: PaymentStatus.PENDING,
				amount: 10000,
				idempotencyKey: 'test-idempotency-key',
				createdAt: new Date(),
				updatedAt: new Date(),
			});
			mockOrderRepository.update.mockResolvedValue({
				...orderData,
				status: OrderStatus.FAILED,
			});
			mockSeatRepository.findByIdForUpdate.mockResolvedValue({
				id: 'seat-123',
				label: 'A1',
				status: SeatStatusEnum.RESERVED,
			});
			(mockDataSource.transaction as jest.Mock).mockImplementation(
				(callback) => callback({}),
			);

			const result = await service.updatePaymentStatus(orderId, 'FAILED');

			expect(result).toEqual({
				...orderData,
				status: OrderStatus.FAILED,
			});
			expect(mockSeatRepository.update).toHaveBeenCalledWith(
				expect.objectContaining({ status: SeatStatusEnum.AVAILABLE }),
				expect.any(Object),
			);
		});
	});

	describe('findById', () => {
		it('should find order by id', async () => {
			const orderId = 'order-123';
			const orderData = {
				id: orderId,
				userId: 'user-456',
				seatId: 'seat-123',
				accountId: 'account-789',
				status: OrderStatus.PENDING,
				idempotencyKey: 'test-idempotency-key',
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			mockOrderRepository.findById.mockResolvedValue(orderData);

			const result = await service.findById(orderId);

			expect(result).toEqual(orderData);
			expect(mockOrderRepository.findById).toHaveBeenCalledWith(orderId);
		});

		it('should return null when order not found', async () => {
			const orderId = 'order-123';

			mockOrderRepository.findById.mockResolvedValue(null);

			const result = await service.findById(orderId);

			expect(result).toBeNull();
			expect(mockOrderRepository.findById).toHaveBeenCalledWith(orderId);
		});
	});
});
