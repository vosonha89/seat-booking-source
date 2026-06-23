import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WebhookService } from './webhook.service';
import { Order } from '@seat-booking/database';
import { Seat } from '@seat-booking/database';
import { WebhookLog } from '@seat-booking/database';
import { AuditPayment } from '@seat-booking/database';
import { Payment } from '@seat-booking/database';
import { OrderStatus } from '@seat-booking/shared-types';
import { PaymentStatus } from '@seat-booking/shared-types';
import { IWebhookPayload } from '@seat-booking/shared-types';
import { IOrderRepositorySymbol } from './tokens';
import { IOrderRepository } from './interfaces/order-repository.interface';

describe('WebhookService', () => {
	let service: WebhookService;
	let orderRepository: jest.Mocked<IOrderRepository>;
	let seatRepository: jest.Mocked<Repository<Seat>>;
	let webhookLogRepository: jest.Mocked<Repository<WebhookLog>>;
	let auditPaymentRepository: jest.Mocked<Repository<AuditPayment>>;

	beforeEach(async () => {
		// Create mock repositories
		orderRepository = {
			findById: jest.fn(),
			findByIdForUpdate: jest.fn(),
			createOrder: jest.fn(),
			updateStatus: jest.fn(),
			update: jest.fn(),
		} as any;

		seatRepository = {} as any;
		webhookLogRepository = {} as any;
		auditPaymentRepository = {
			create: jest.fn(),
			save: jest.fn(),
		} as any;

		const mockDataSource = {
			createQueryRunner: jest.fn(),
		} as any;

		const testModule: TestingModule = await Test.createTestingModule({
			providers: [
				WebhookService,
				{
					provide: IOrderRepositorySymbol,
					useValue: orderRepository,
				},
				{
					provide: getRepositoryToken(Seat, 'postgres'),
					useValue: seatRepository,
				},
				{
					provide: getRepositoryToken(WebhookLog, 'postgres'),
					useValue: webhookLogRepository,
				},
				{
					provide: getRepositoryToken(AuditPayment, 'mongodb'),
					useValue: auditPaymentRepository,
				},
				{
					provide: 'postgresDataSource',
					useValue: mockDataSource,
				},
			],
		}).compile();

		service = testModule.get<WebhookService>(WebhookService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('processWebhook', () => {
		it('should process a valid webhook and update order/seat/payment status', async () => {
			// Arrange
			const payload: IWebhookPayload = {
				webhookId: 'webhook-123',
				orderId: 'order-456',
				status: PaymentStatus.SUCCESS,
				transactionId: 'txn-abc-123',
			};

			const mockOrder = {
				id: 'order-456',
				userId: 'user-123',
				seatId: 'seat-789',
				status: OrderStatus.PENDING,
				updatedAt: new Date(),
			} as Order;

			const mockSeat = {
				id: 'seat-789',
				status: 'RESERVED',
			} as Seat;

			const mockPayment = {
				id: 'payment-abc',
				orderId: 'order-456',
				status: PaymentStatus.PENDING,
				amount: 10000,
				idempotencyKey: 'order-123-abc',
				updatedAt: new Date(),
			} as Payment;

			const mockWebhookLog = null;

			const queryRunner = {
				manager: {
					findOne: jest.fn(),
					create: jest.fn(),
					save: jest.fn(),
				},
				connect: jest.fn(),
				startTransaction: jest.fn(),
				commitTransaction: jest.fn(),
				rollbackTransaction: jest.fn(),
				release: jest.fn(),
			};

			const mockDataSource = {
				createQueryRunner: jest.fn().mockReturnValue(queryRunner),
			};

			// Replace the data source in the service
			(service as any).dataSource = mockDataSource;

			queryRunner.manager.findOne.mockImplementation((entity) => {
				if (entity === WebhookLog) {
					return Promise.resolve(mockWebhookLog);
				} else if (entity === Order) {
					return Promise.resolve(mockOrder);
				} else if (entity === Seat) {
					return Promise.resolve(mockSeat);
				} else if (entity === Payment) {
					return Promise.resolve(mockPayment);
				}
				return Promise.resolve(null);
			});

			queryRunner.manager.create.mockReturnValue({});
			queryRunner.manager.save.mockResolvedValue({});

			// Act
			await service.processWebhook(payload);

			// Assert
			expect(queryRunner.startTransaction).toHaveBeenCalledWith(
				'SERIALIZABLE',
			);
			expect(queryRunner.manager.findOne).toHaveBeenCalledWith(
				WebhookLog,
				expect.objectContaining({
					where: { webhookId: payload.webhookId },
				}),
			);
			expect(queryRunner.manager.findOne).toHaveBeenCalledWith(
				Order,
				expect.objectContaining({ where: { id: payload.orderId } }),
			);
			expect(queryRunner.manager.findOne).toHaveBeenCalledWith(
				Seat,
				expect.objectContaining({ where: { id: mockOrder.seatId } }),
			);
			expect(queryRunner.manager.findOne).toHaveBeenCalledWith(
				Payment,
				expect.objectContaining({ where: { orderId: payload.orderId } }),
			);
			expect(mockPayment.status).toBe(PaymentStatus.SUCCESS);
			expect(mockPayment.transactionId).toBe('txn-abc-123');
			expect(queryRunner.manager.save).toHaveBeenCalledTimes(4); // order, seat, payment, webhook log
			expect(queryRunner.commitTransaction).toHaveBeenCalled();
			expect(auditPaymentRepository.create).toHaveBeenCalled();
			expect(auditPaymentRepository.save).toHaveBeenCalled();
		});

		it('should return early if webhook has already been processed', async () => {
			// Arrange
			const payload: IWebhookPayload = {
				webhookId: 'webhook-123',
				orderId: 'order-456',
				status: PaymentStatus.SUCCESS,
			};

			const mockWebhookLog = {
				webhookId: 'webhook-123',
				orderId: 'order-456',
			} as WebhookLog;

			const queryRunner = {
				manager: {
					findOne: jest.fn().mockResolvedValue(mockWebhookLog),
					create: jest.fn(),
					save: jest.fn(),
				},
				connect: jest.fn(),
				startTransaction: jest.fn(),
				commitTransaction: jest.fn(),
				rollbackTransaction: jest.fn(),
				release: jest.fn(),
			};

			const mockDataSource = {
				createQueryRunner: jest.fn().mockReturnValue(queryRunner),
			};

			// Replace the data source in the service
			(service as any).dataSource = mockDataSource;

			// Act
			await service.processWebhook(payload);

			// Assert
			expect(queryRunner.manager.findOne).toHaveBeenCalledWith(
				WebhookLog,
				expect.objectContaining({
					where: { webhookId: payload.webhookId },
				}),
			);
			expect(queryRunner.manager.findOne).not.toHaveBeenCalledWith(
				Order,
				expect.anything(),
			);
			expect(queryRunner.manager.findOne).not.toHaveBeenCalledWith(
				Seat,
				expect.anything(),
			);
			expect(queryRunner.manager.save).not.toHaveBeenCalled();
			expect(queryRunner.commitTransaction).toHaveBeenCalled();
			expect(auditPaymentRepository.create).not.toHaveBeenCalled();
			expect(auditPaymentRepository.save).not.toHaveBeenCalled();
		});
	});
});
