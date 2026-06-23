/**
 * Represents the possible statuses of a payment.
 */
export enum PaymentStatus {
	PENDING = 'PENDING',
	SUCCESS = 'SUCCESS',
	FAILED = 'FAILED',
}

/**
 * Represents a payment entity.
 */
export interface IPayment {
	/** Unique identifier for the payment. */
	id: string;
	/** ID of the order associated with this payment. */
	orderId: string;
	/** Status of the payment. */
	status: PaymentStatus;
	/** Payment amount in cents. */
	amount: number;
	/** Transaction ID from the payment gateway. */
	transactionId?: string;
	/** Response data from the payment gateway. */
	gatewayResponse?: any;
	/** Idempotency key to prevent duplicate payment processing. */
	idempotencyKey: string;
	/** Timestamp when the payment was created. */
	createdAt: Date;
	/** Timestamp when the payment was last updated. */
	updatedAt: Date;
}

/**
 * Represents a payment message to be sent to the SQS queue.
 */
export interface IPaymentMessage {
	/** Unique identifier for the order. */
	orderId: string;
	/** ID of the account for ordering (used for SQS FIFO grouping). */
	accountId: string;
	/** Payment amount. */
	amount: number;
	/** Idempotency key to prevent duplicate processing. */
	idempotencyKey: string;
}

/**
 * Represents the payload received from a payment webhook.
 */
export interface IWebhookPayload {
	/** Unique identifier for the webhook. */
	webhookId: string;
	/** ID of the order associated with the payment. */
	orderId: string;
	/** Status of the payment. */
	status: PaymentStatus;
}
