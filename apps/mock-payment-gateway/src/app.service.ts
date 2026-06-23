import { Injectable, Logger } from "@nestjs/common";
import axios from "axios";

/**
 * Application service providing core business logic for the mock payment gateway.
 */
@Injectable()
export class AppService {
	private readonly logger = new Logger(AppService.name);
	private readonly paymentDelay = 1000; // 1 second delay to simulate async payment

	/**
	 * Return a simple welcome message.
	 * @returns A greeting string.
	 */
	getHello(): string {
		return "Hello World!";
	}

	/**
	 * Process a payment and simulate async webhook call
	 * @param orderId The order ID
	 * @param amount The payment amount
	 * @param callbackUrl The URL to call back with payment status
	 */
	async processPayment(orderId: string, amount: number, callbackUrl: string): Promise<void> {
		this.logger.log('Processing payment', { orderId, amount, callbackUrl });

		// Simulate payment processing delay
		await this.delay(this.paymentDelay);

		// Simulate webhook call to order service
		await this.callWebhook(callbackUrl, orderId, 'CONFIRMED');
	}

	/**
	 * Call the payment status webhook
	 * @param callbackUrl The webhook URL
	 * @param orderId The order ID
	 * @param status The payment status (CONFIRMED or FAILED)
	 */
	private async callWebhook(callbackUrl: string, orderId: string, status: 'CONFIRMED' | 'FAILED'): Promise<void> {
		try {
			// Replace order-service with localhost for local development
			const resolvedUrl = callbackUrl.replace('http://order-service:3002', 'http://localhost:3002');

			this.logger.log('Calling payment webhook', { orderId, status, url: resolvedUrl });

			await axios.post(resolvedUrl, {
				orderId,
				status,
			}, {
				timeout: 5000,
			});

			this.logger.log('Webhook call successful', { orderId });
		} catch (error) {
			this.logger.error('Webhook call failed', { orderId, error: error instanceof Error ? error.message : 'Unknown error' });
		}
	}

	/**
	 * Delay function for simulating processing time
	 */
	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}

