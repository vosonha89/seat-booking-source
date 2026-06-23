import { Controller, Get, Post, Body } from "@nestjs/common";
import { AppService } from "./app.service";

/**
 * Root controller handling health-check, welcome, and payment endpoints.
 */
@Controller()
export class AppController {
	/**
	 * Create an instance of AppController.
	 * @param appService - The application service providing business logic.
	 */
	constructor(private readonly appService: AppService) {}

	/**
	 * Return a welcome message from the application service.
	 * @returns A greeting string.
	 */
	@Get()
	getHello(): string {
		return this.appService.getHello();
	}

	/**
	 * Process a payment request
	 * @param body The payment request body
	 * @returns A success response
	 */
	@Post("/pay")
	async processPayment(
		@Body() body: { orderId: string; amount: number; callbackUrl: string },
	): Promise<{ message: string; orderId: string }> {
		// Process payment asynchronously to avoid blocking the response
		this.appService
			.processPayment(body.orderId, body.amount, body.callbackUrl)
			.catch((error) => {
				console.error("Payment processing failed:", error);
			});

		return {
			message: "Payment processing initiated",
			orderId: body.orderId,
		};
	}
}
