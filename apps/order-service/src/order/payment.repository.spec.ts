import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PaymentRepository } from './payment.repository';
import { Payment } from '@seat-booking/database/src/postgres/entities/payment.entity';
import { PaymentStatus } from '@seat-booking/shared-types';

describe('PaymentRepository', () => {
	let paymentRepository: PaymentRepository;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				PaymentRepository,
				{
					provide: getRepositoryToken(Payment, 'postgres'),
					useValue: {
						create: jest.fn(),
						save: jest.fn(),
						findOneBy: jest.fn(),
						update: jest.fn(),
					},
				},
			],
		}).compile();

		paymentRepository = module.get<PaymentRepository>(PaymentRepository);
	});

	describe('repository instantiation', () => {
		it('should be defined', () => {
			expect(paymentRepository).toBeDefined();
		});
	});

	describe('createPayment', () => {
		it('should create a payment record', async () => {
			const paymentData = {
				orderId: 'order-123',
				status: PaymentStatus.PENDING,
				amount: 10000,
				idempotencyKey: 'test-idempotency-key',
			};

			const createdPayment = {
				id: 'payment-123',
				...paymentData,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			paymentRepository['paymentRepository'].create = jest
				.fn()
				.mockReturnValue(createdPayment);
			paymentRepository['paymentRepository'].save = jest
				.fn()
				.mockResolvedValue(createdPayment);

			const result = await paymentRepository.createPayment(paymentData);

			expect(
				paymentRepository['paymentRepository'].create,
			).toHaveBeenCalledWith(paymentData);
			expect(
				paymentRepository['paymentRepository'].save,
			).toHaveBeenCalledWith(createdPayment);
			expect(result).toEqual(createdPayment);
		});
	});

	describe('findByOrderId', () => {
		it('should find payment by orderId', async () => {
			const orderId = 'order-123';
			const paymentData = {
				id: 'payment-123',
				orderId,
				status: PaymentStatus.PENDING,
				amount: 10000,
				idempotencyKey: 'test-idempotency-key',
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			paymentRepository['paymentRepository'].findOneBy = jest
				.fn()
				.mockResolvedValue(paymentData);

			const result = await paymentRepository.findByOrderId(orderId);

			expect(
				paymentRepository['paymentRepository'].findOneBy,
			).toHaveBeenCalledWith({ orderId });
			expect(result).toEqual(paymentData);
		});

		it('should return null when payment not found by orderId', async () => {
			const orderId = 'order-123';

			paymentRepository['paymentRepository'].findOneBy = jest
				.fn()
				.mockResolvedValue(null);

			const result = await paymentRepository.findByOrderId(orderId);

			expect(result).toBeNull();
		});
	});

	describe('findByIdempotencyKey', () => {
		it('should find payment by idempotencyKey', async () => {
			const idempotencyKey = 'test-idempotency-key';
			const paymentData = {
				id: 'payment-123',
				orderId: 'order-123',
				status: PaymentStatus.PENDING,
				amount: 10000,
				idempotencyKey,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			paymentRepository['paymentRepository'].findOneBy = jest
				.fn()
				.mockResolvedValue(paymentData);

			const result =
				await paymentRepository.findByIdempotencyKey(idempotencyKey);

			expect(
				paymentRepository['paymentRepository'].findOneBy,
			).toHaveBeenCalledWith({
				idempotencyKey,
			});
			expect(result).toEqual(paymentData);
		});

		it('should return null when payment not found by idempotencyKey', async () => {
			const idempotencyKey = 'test-idempotency-key';

			paymentRepository['paymentRepository'].findOneBy = jest
				.fn()
				.mockResolvedValue(null);

			const result =
				await paymentRepository.findByIdempotencyKey(idempotencyKey);

			expect(result).toBeNull();
		});
	});

	describe('updateStatus', () => {
		it('should update payment status', async () => {
			const paymentId = 'payment-123';
			const newStatus = PaymentStatus.SUCCESS;

			paymentRepository['paymentRepository'].findOneBy = jest
				.fn()
				.mockResolvedValue({
					id: paymentId,
					orderId: 'order-123',
					status: PaymentStatus.PENDING,
					amount: 10000,
					idempotencyKey: 'test-idempotency-key',
					createdAt: new Date(),
					updatedAt: new Date(),
				});
			paymentRepository['paymentRepository'].save = jest
				.fn()
				.mockResolvedValue({
					id: paymentId,
					orderId: 'order-123',
					status: newStatus,
					amount: 10000,
					idempotencyKey: 'test-idempotency-key',
					createdAt: new Date(),
					updatedAt: new Date(),
				});

			const result = await paymentRepository.updateStatus(
				paymentId,
				newStatus,
			);

			expect(
				paymentRepository['paymentRepository'].findOneBy,
			).toHaveBeenCalledWith({ id: paymentId });
			expect(
				paymentRepository['paymentRepository'].save,
			).toHaveBeenCalled();
			expect(result.status).toEqual(newStatus);
		});
	});

	describe('update', () => {
		it('should update payment record', async () => {
			const updateData = {
				id: 'payment-123',
				status: PaymentStatus.FAILED,
				amount: 10000,
			};

			paymentRepository['paymentRepository'].findOneBy = jest
				.fn()
				.mockResolvedValue({
					id: 'payment-123',
					orderId: 'order-123',
					status: PaymentStatus.PENDING,
					amount: 10000,
					idempotencyKey: 'test-idempotency-key',
					createdAt: new Date(),
					updatedAt: new Date(),
				});
			paymentRepository['paymentRepository'].merge = jest
				.fn()
				.mockReturnValue({
					id: 'payment-123',
					orderId: 'order-123',
					status: PaymentStatus.FAILED,
					amount: 10000,
					idempotencyKey: 'test-idempotency-key',
					createdAt: new Date(),
					updatedAt: new Date(),
				});
			paymentRepository['paymentRepository'].save = jest
				.fn()
				.mockResolvedValue({
					id: 'payment-123',
					orderId: 'order-123',
					status: PaymentStatus.FAILED,
					amount: 10000,
					idempotencyKey: 'test-idempotency-key',
					createdAt: new Date(),
					updatedAt: new Date(),
				});

			const result = await paymentRepository.update(updateData, null);

			expect(
				paymentRepository['paymentRepository'].findOneBy,
			).toHaveBeenCalledWith({ id: updateData.id });
			expect(
				paymentRepository['paymentRepository'].merge,
			).toHaveBeenCalled();
			expect(
				paymentRepository['paymentRepository'].save,
			).toHaveBeenCalled();
			expect(result.status).toEqual(PaymentStatus.FAILED);
			expect(result.amount).toEqual(updateData.amount);
		});
	});
});
