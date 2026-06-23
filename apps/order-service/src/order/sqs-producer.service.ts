import { Injectable, Logger } from '@nestjs/common';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { PaymentProcessingMessage } from '@seat-booking/shared-types';

/**
 * SQS Producer Service for sending payment processing messages
 * This service is responsible for publishing messages to the SQS FIFO queue
 * after an order is successfully created.
 */
@Injectable()
export class SqsProducerService {
	private readonly logger = new Logger(SqsProducerService.name);
	private readonly sqsClient: SQSClient;
	private readonly queueUrl: string;

	constructor() {
		this.sqsClient = new SQSClient({
			region: process.env.AWS_REGION || 'ap-southeast-1',
			endpoint: process.env.SQS_ENDPOINT || 'http://localhost:4566',
			credentials: {
				accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
				secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
			},
			requestHandler: {
				timeout: 5000, // 5 second timeout to prevent hanging
			},
		});
		this.queueUrl =
			process.env.PAYMENT_QUEUE_URL ||
			'http://sqs.ap-southeast-1.localhost.localstack.cloud:4566/000000000000/payment-queue.fifo';
	}

	/**
	 * Sends a payment processing message to the SQS FIFO queue
	 * @param message The payment processing message to send
	 */
	async sendPaymentProcessingMessage(
		message: PaymentProcessingMessage,
	): Promise<void> {
		this.logger.log(`Preparing to send payment processing message`, {
			orderId: message.orderId,
			seatId: message.seatId,
			accountId: message.accountId,
			amount: message.amount,
		});

		try {
			const command = new SendMessageCommand({
				QueueUrl: this.queueUrl,
				MessageBody: JSON.stringify(message),
				MessageGroupId: message.accountId,
				MessageDeduplicationId: message.orderId,
				DelaySeconds: 0,
			});

			this.logger.debug(
				`Sending SQS message to queue: ${this.queueUrl}`,
				{
					orderId: message.orderId,
					messageGroupId: message.accountId,
					messageDeduplicationId: message.orderId,
				},
			);

			const response = await this.sqsClient.send(command);

			this.logger.log(
				`Successfully published payment processing message to SQS queue`,
				{
					orderId: message.orderId,
					messageId: response.MessageId,
					sequenceNumber: response.SequenceNumber,
				},
			);
		} catch (error) {
			this.logger.error(
				`Failed to publish payment processing message to SQS queue`,
				{
					orderId: message.orderId,
					error:
						error instanceof Error
							? error.message
							: 'Unknown error',
					stack: error instanceof Error ? error.stack : undefined,
				},
			);

			// Re-throw the error so we can handle it in the calling service
			throw error;
		}
	}
}
