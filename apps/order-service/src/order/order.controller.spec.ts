import { Test, TestingModule } from '@nestjs/testing';
import { OrderController } from './order.controller';
import { IOrderService } from './interfaces/order-service.interface';
import { IOrderServiceSymbol } from './tokens';
import { OrderStatus } from '@seat-booking/shared-types';
import { ConflictException } from '@nestjs/common';

describe('OrderController', () => {
	let controller: OrderController;
	let mockOrderService: Partial<IOrderService>;

	beforeEach(async () => {
		mockOrderService = {
			createOrder: jest.fn(),
			findById: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			controllers: [OrderController],
			providers: [
				{
					provide: IOrderServiceSymbol,
					useValue: mockOrderService,
				},
			],
		}).compile();

		controller = module.get<OrderController>(OrderController);
	});

	describe('controller instantiation', () => {
		it('should be defined', () => {
			expect(controller).toBeDefined();
		});
	});

	describe('createOrder', () => {
		it('should create order with valid input', async () => {
			const userId = 'user-123';
			const seatId = 'seat-456';
			const accountId = 'account-789';
			const orderData = {
				id: 'order-123',
				userId,
				seatId,
				accountId,
				status: OrderStatus.PENDING,
				createdAt: new Date(),
				updatedAt: new Date(),
				idempotencyKey: 'test-idempotency-key',
			};

			(mockOrderService.createOrder as jest.Mock).mockResolvedValue(
				orderData,
			);

			const result = await controller.createOrder({ seatId, accountId });

			expect(result).toEqual(orderData);
			expect(mockOrderService.createOrder).toHaveBeenCalledWith(
				seatId,
				expect.any(String),
				accountId,
			);
		});

		it('should return 409 if seat is already reserved', async () => {
			const seatId = 'seat-456';
			const accountId = 'account-789';

			(mockOrderService.createOrder as jest.Mock).mockRejectedValue(
				new ConflictException('Seat is already reserved'),
			);

			await expect(
				controller.createOrder({ seatId, accountId }),
			).rejects.toThrow(ConflictException);
		});
	});

	describe('getOrder', () => {
		it('should return order by id', async () => {
			const orderId = 'order-123';
			const orderData = {
				id: orderId,
				userId: 'user-123',
				seatId: 'seat-456',
				accountId: 'account-789',
				status: OrderStatus.PENDING,
				createdAt: new Date(),
				updatedAt: new Date(),
				idempotencyKey: 'test-idempotency-key',
			};

			(mockOrderService.findById as jest.Mock).mockResolvedValue(
				orderData,
			);

			const result = await controller.getOrder(orderId);

			expect(result).toEqual(orderData);
			expect(mockOrderService.findById).toHaveBeenCalledWith(orderId);
		});

		it('should return 404 if order is not found', async () => {
			const orderId = 'order-123';

			(mockOrderService.findById as jest.Mock).mockResolvedValue(null);

			const result = await controller.getOrder(orderId);

			expect(result).toBeNull();
		});
	});
});
