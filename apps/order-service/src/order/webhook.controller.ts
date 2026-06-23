import {
	Controller,
	Post,
	Body,
	HttpCode,
	HttpStatus,
	Logger,
} from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { IWebhookPayload } from '@seat-booking/shared-types';

/**
 * Controller for handling payment webhook events.
 * Provides endpoint to receive payment status updates from external payment gateways.
 */
@Controller('webhooks')
export class WebhookController {
	private readonly logger = new Logger(WebhookController.name);

	constructor(private readonly webhookService: WebhookService) {}

	/**
	 * Handles payment webhook events.
	 * @param payload The webhook payload containing payment status information
	 * @returns 200 OK if successful, 409 Conflict if webhook has already been processed
	 */
	@Post('payment')
	@HttpCode(HttpStatus.OK)
	async handlePaymentWebhook(
		@Body() payload: IWebhookPayload,
	): Promise<void> {
		this.logger.log('Received payment webhook', {
			orderId: payload.orderId,
			status: payload.status,
		});

		try {
			this.logger.debug('Processing webhook payload', { payload });
			await this.webhookService.processWebhook(payload);
			this.logger.log('Successfully processed payment webhook', {
				orderId: payload.orderId,
			});
		} catch (error) {
			this.logger.error('Failed to process payment webhook', {
				orderId: payload.orderId,
				error: error instanceof Error ? error.message : 'Unknown error',
				stack: error instanceof Error ? error.stack : undefined,
			});
			throw error;
		}
	}
}
