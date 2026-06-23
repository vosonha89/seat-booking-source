import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import {
	SQSClient,
	ReceiveMessageCommand,
	DeleteMessageCommand,
} from "@aws-sdk/client-sqs";
import { PaymentProcessingMessage } from "@seat-booking/shared-types";
import { AppService } from "./app.service";

/**
 * SQS Consumer Service for receiving and processing payment messages
 * This service is responsible for consuming messages from the SQS FIFO queue
 * and processing payment transactions.
 */
@Injectable()
export class SqsConsumerService implements OnModuleInit {
	private readonly logger = new Logger(SqsConsumerService.name);
	private readonly sqsClient: SQSClient;
	private readonly queueUrl: string;
	private isProcessing: boolean = false;

	constructor(private readonly appService: AppService) {
		this.sqsClient = new SQSClient({
			region: process.env.AWS_REGION || "ap-southeast-1",
			endpoint: process.env.SQS_ENDPOINT || "http://localhost:4566",
			credentials: {
				accessKeyId: process.env.AWS_ACCESS_KEY_ID || "test",
				secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "test",
			},
		});
		this.queueUrl =
			process.env.PAYMENT_QUEUE_URL ||
			"http://sqs.ap-southeast-1.localhost.localstack.cloud:4566/000000000000/payment-queue.fifo";
	}

	/**
	 * Start the SQS consumer when the module initializes
	 */
	async onModuleInit(): Promise<void> {
		this.logger.log("SQS consumer service initialized");
		this.startConsuming();
	}

	/**
	 * Start the long-polling consumer loop
	 */
	private async startConsuming(): Promise<void> {
		while (true) {
			try {
				await this.consumeMessages();
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : "Unknown error";
				this.logger.error("Error in SQS consumer loop", {
					error: errorMessage,
				});
				// Wait 5 seconds before retrying
				await this.delay(5000);
			}
		}
	}

	/**
	 * Consume messages from the SQS queue
	 */
	private async consumeMessages(): Promise<void> {
		if (this.isProcessing) {
			this.logger.debug(
				"Still processing previous message, waiting before next poll",
			);
			await this.delay(1000);
			return;
		}

		this.isProcessing = true;

		try {
			this.logger.debug(
				`Polling for messages from queue: ${this.queueUrl}`,
			);
			const command = new ReceiveMessageCommand({
				QueueUrl: this.queueUrl,
				MaxNumberOfMessages: 1,
				WaitTimeSeconds: 20,
				VisibilityTimeout: 30,
				MessageAttributeNames: ["All"],
			});

			const response = await this.sqsClient.send(command);

			if (response.Messages && response.Messages.length > 0) {
				const message = response.Messages[0];
				this.logger.log(
					"Received payment processing message from SQS",
					{
						messageId: message.MessageId,
						receiptHandle: message.ReceiptHandle,
					},
				);
				await this.processMessage(message.Body, message.ReceiptHandle);
			} else {
				this.logger.debug("No messages received from SQS");
			}
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";
			this.logger.error("Error receiving messages from SQS", {
				error: errorMessage,
				stack: error instanceof Error ? error.stack : undefined,
			});
		} finally {
			this.isProcessing = false;
		}
	}

	/**
	 * Process a single payment message
	 */
	private async processMessage(
		body: string | undefined,
		receiptHandle: string | undefined,
	): Promise<void> {
		if (!body || !receiptHandle) {
			this.logger.error(
				"Invalid message - missing body or receipt handle",
			);
			return;
		}

		try {
			this.logger.debug("Parsing payment message body");
			const paymentMessage: PaymentProcessingMessage = JSON.parse(body);

			this.logger.log("Processing payment message", {
				orderId: paymentMessage.orderId,
				seatId: paymentMessage.seatId,
				accountId: paymentMessage.accountId,
				userId: paymentMessage.userId,
				amount: paymentMessage.amount,
			});

			// Process the payment
			await this.appService.processPayment(paymentMessage);

			// ACK the message after successful processing
			this.logger.debug(
				"Payment processed successfully, acknowledging message",
			);
			await this.acknowledgeMessage(receiptHandle);
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";
			this.logger.error("Failed to process payment message", {
				error: errorMessage,
				stack: error instanceof Error ? error.stack : undefined,
			});
			// Do NOT ACK the message - let it return to the queue for retry
		}
	}

	/**
	 * Acknowledge the message by deleting it from the queue
	 */
	private async acknowledgeMessage(receiptHandle: string): Promise<void> {
		try {
			this.logger.debug("Deleting message from SQS");
			const command = new DeleteMessageCommand({
				QueueUrl: this.queueUrl,
				ReceiptHandle: receiptHandle,
			});

			await this.sqsClient.send(command);

			this.logger.log("Successfully acknowledged payment message");
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";
			this.logger.error("Failed to acknowledge message", {
				error: errorMessage,
				stack: error instanceof Error ? error.stack : undefined,
			});
		}
	}

	/**
	 * Delay function for retry logic
	 */
	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}
