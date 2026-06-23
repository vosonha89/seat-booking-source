/**
 * Represents the possible statuses of an order.
 */
export enum OrderStatus {
	PENDING = 'PENDING',
	PROCESSING = 'PROCESSING',
	CONFIRMED = 'CONFIRMED',
	FAILED = 'FAILED',
	EXPIRED = 'EXPIRED',
}

/**
 * Represents an order entity with its properties.
 */
export interface IOrder {
	/** Unique identifier for the order. */
	id: string;
	/** ID of the user who created the order. */
	userId: string;
	/** ID of the seat being ordered. */
	seatId: string;
	/** ID of the account for ordering (used for SQS FIFO grouping). */
	accountId: string;
	/** Current status of the order. */
	status: OrderStatus;
	/** Idempotency key to prevent duplicate order creation. */
	idempotencyKey: string;
	/** Timestamp when the order was created. */
	createdAt: Date;
	/** Timestamp when the order was last updated. */
	updatedAt: Date;
}

/**
 * Data transfer object for creating a new order.
 * userId and accountId are injected by the api-gateway's Clerk auth middleware
 * via x-user-id and x-user-account-id headers, not sent by the client.
 */
export interface ICreateOrderDto {
	/** ID of the seat to order. */
	seatId: string;
}

