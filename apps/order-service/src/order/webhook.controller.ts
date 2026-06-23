import { Controller, Post, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';
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
	async handlePaymentWebhook(@Body() payload: IWebhookPayload): Promise<void> {
		this.logger.log(`Received payment webhook for orderId: ${payload.orderId}`);
		await this.webhookService.processWebhook(payload);
		this.logger.log(`Successfully processed payment webhook for orderId: ${payload.orderId}`);
	}
}
