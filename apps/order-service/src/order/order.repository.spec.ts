import { OrderRepository } from './order.repository';
import { Repository } from 'typeorm';
import { Order } from '@seat-booking/database';
import { OrderStatus } from '@seat-booking/shared-types';

describe('OrderRepository', () => {
	let repository: OrderRepository;
	let mockOrderRepository: Partial<Repository<Order>>;

	beforeEach(() => {
		// Create mock repository
		mockOrderRepository = {
			create: jest.fn(),
			save: jest.fn(),
			findOneBy: jest.fn(),
		};

		repository = new OrderRepository(
			mockOrderRepository as unknown as Repository<Order>,
		);
	});

	describe('repository instantiation', () => {
		it('should be defined', () => {
			expect(repository).toBeDefined();
		});
	});

	describe('createOrder', () => {
		it('should create and save an order', async () => {
			const orderData = {
				userId: 'user-123',
				seatId: 'seat-456',
				accountId: 'account-789',
				status: OrderStatus.PENDING,
				idempotencyKey: 'test-idempotency-key',
			};
			const savedOrder = {
				...orderData,
				id: 'order-123',
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			(mockOrderRepository.create as jest.Mock).mockReturnValue(
				orderData,
			);
			(mockOrderRepository.save as jest.Mock).mockResolvedValue(
				savedOrder,
			);

			const result = await repository.createOrder(orderData);

			expect(result).toEqual(savedOrder);
			expect(mockOrderRepository.create).toHaveBeenCalledWith(orderData);
			expect(mockOrderRepository.save).toHaveBeenCalledWith(orderData);
		});
	});

	describe('findById', () => {
		it('should find an order by id', async () => {
			const orderId = 'order-123';
			const order = {
				id: orderId,
				userId: 'user-123',
				seatId: 'seat-456',
				accountId: 'account-789',
				status: OrderStatus.PENDING,
				idempotencyKey: 'test-idempotency-key',
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			(mockOrderRepository.findOneBy as jest.Mock).mockResolvedValue(
				order,
			);

			const result = await repository.findById(orderId);

			expect(result).toEqual(order);
			expect(mockOrderRepository.findOneBy).toHaveBeenCalledWith({
				id: orderId,
			});
		});

		it('should return null if order is not found', async () => {
			const orderId = 'order-999';

			(mockOrderRepository.findOneBy as jest.Mock).mockResolvedValue(
				null,
			);

			const result = await repository.findById(orderId);

			expect(result).toBeNull();
			expect(mockOrderRepository.findOneBy).toHaveBeenCalledWith({
				id: orderId,
			});
		});
	});
});
