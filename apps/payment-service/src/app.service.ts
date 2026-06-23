import { Injectable, Logger } from "@nestjs/common";
import { PaymentProcessingMessage } from "@seat-booking/shared-types";
import { PaymentGatewayService } from "./payment-gateway.service";

/**
 * Application service providing core business logic for the payment service.
 */
@Injectable()
export class AppService {
	private readonly logger = new Logger(AppService.name);

	constructor(
		private readonly paymentGatewayService: PaymentGatewayService,
	) {}

	/**
	 * Process a payment for an order
	 * @param paymentMessage The payment processing message
	 */
	async processPayment(
		paymentMessage: PaymentProcessingMessage,
	): Promise<void> {
		this.logger.log("Processing payment", {
			orderId: paymentMessage.orderId,
			seatId: paymentMessage.seatId,
			accountId: paymentMessage.accountId,
			userId: paymentMessage.userId,
			amount: paymentMessage.amount,
		});

		// Call mock payment gateway
		const callbackUrl = `http://order-service:3002/webhooks/payment`;
		this.logger.debug("Calling payment gateway", {
			orderId: paymentMessage.orderId,
			callbackUrl,
		});

		await this.paymentGatewayService.processPayment(
			paymentMessage.orderId,
			paymentMessage.amount,
			callbackUrl,
		);

		this.logger.log("Payment processed successfully", {
			orderId: paymentMessage.orderId,
		});
	}

	/**
	 * Return a simple welcome message.
	 * @returns A greeting string.
	 */
	getHello(): string {
		return "Hello World!";
	}
}
