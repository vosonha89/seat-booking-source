import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { IWebhookPayload } from '@seat-booking/shared-types';
import { PaymentStatus } from '@seat-booking/shared-types';

describe('WebhookController', () => {
	let app: INestApplication;
	let webhookService: jest.Mocked<Partial<WebhookService>>;

	beforeEach(async () => {
		// Create mock service
		webhookService = {
			processWebhook: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			controllers: [WebhookController],
			providers: [
				{
					provide: WebhookService,
					useValue: webhookService,
				},
			],
		}).compile();

		app = module.createNestApplication();
		await app.init();
	});

	afterEach(async () => {
		await app.close();
	});

	describe('POST /webhooks/payment', () => {
		it('should process payment webhook successfully', async () => {
			// Arrange
			const payload: IWebhookPayload = {
				webhookId: 'webhook-123',
				orderId: 'order-456',
				status: PaymentStatus.SUCCESS,
			};

			webhookService.processWebhook.mockResolvedValue();

			// Act
			const response = await request(app.getHttpServer())
				.post('/webhooks/payment')
				.send(payload)
				.expect(200);

			// Assert
			expect(response.body).toEqual({});
			expect(webhookService.processWebhook).toHaveBeenCalledWith(payload);
		});

		it('should handle errors when processing webhook', async () => {
			// Arrange
			const payload: IWebhookPayload = {
				webhookId: 'webhook-123',
				orderId: 'order-456',
				status: PaymentStatus.FAILED,
			};

			const errorMessage = 'Failed to process webhook';
			webhookService.processWebhook.mockRejectedValue(new Error(errorMessage));

			// Act
			const response = await request(app.getHttpServer())
				.post('/webhooks/payment')
				.send(payload);

			// Assert
			expect(response.status).toBeGreaterThanOrEqual(400);
			expect(webhookService.processWebhook).toHaveBeenCalledWith(payload);
		});
	});
});
