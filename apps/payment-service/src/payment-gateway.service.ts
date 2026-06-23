import { Injectable, Logger } from "@nestjs/common";
import axios from "axios";

/**
 * Payment Gateway Service for communicating with the mock payment gateway
 * This service is responsible for sending payment requests to the mock gateway
 * and handling the response.
 */
@Injectable()
export class PaymentGatewayService {
	private readonly logger = new Logger(PaymentGatewayService.name);
	private readonly baseUrl: string;
	private readonly maxRetries: number = 3;
	private readonly retryDelay: number = 1000;

	constructor() {
		this.baseUrl =
			process.env.MOCK_PAYMENT_GATEWAY_URL || "http://localhost:3004";
	}

	/**
	 * Process a payment through the mock payment gateway
	 * @param orderId The order ID
	 * @param amount The payment amount
	 * @param callbackUrl The URL to call back with payment status
	 */
	async processPayment(
		orderId: string,
		amount: number,
		callbackUrl: string,
	): Promise<void> {
		this.logger.log("Calling mock payment gateway", {
			orderId,
			amount,
			callbackUrl,
			gatewayUrl: this.baseUrl,
		});

		const paymentData = {
			orderId,
			amount,
			callbackUrl,
		};

		this.logger.debug("Payment request data", { paymentData });

		let lastError: Error | null = null;

		for (let retry = 0; retry < this.maxRetries; retry++) {
			try {
				this.logger.debug("Sending payment request", {
					orderId,
					retry: retry + 1,
					maxRetries: this.maxRetries,
				});

				const response = await axios.post(
					`${this.baseUrl}/pay`,
					paymentData,
					{
						timeout: 5000,
					},
				);

				this.logger.log("Mock payment gateway response received", {
					orderId,
					status: response.status,
					data: response.data,
				});

				return;
			} catch (error) {
				lastError =
					error instanceof Error ? error : new Error("Unknown error");
				this.logger.error("Mock payment gateway call failed", {
					orderId,
					retry: retry + 1,
					maxRetries: this.maxRetries,
					error: lastError.message,
					stack: lastError.stack,
				});

				if (retry < this.maxRetries - 1) {
					const delay = this.retryDelay * (retry + 1);
					this.logger.log("Retrying payment gateway call", {
						orderId,
						delay,
						nextAttempt: retry + 2,
					});
					await this.delay(delay); // Exponential backoff
				}
			}
		}

		this.logger.error("All retries for payment gateway call failed", {
			orderId,
			maxRetries: this.maxRetries,
		});

		throw (
			lastError ||
			new Error("Payment gateway call failed after all retries")
		);
	}

	/**
	 * Delay function for retry logic
	 */
	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}
