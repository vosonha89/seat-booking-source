import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

/**
 * Represents a webhook log entity in the PostgreSQL database.
 * Maps to the 'webhook_logs' table.
 * Used for idempotency checks to prevent duplicate webhook processing.
 */
@Entity({ name: 'webhook_logs' })
export class WebhookLog extends BaseEntity {
	/** Unique identifier for the webhook. */
	@Column({ name: 'webhook_id', length: 255 })
	public webhookId!: string;

	/** ID of the order associated with the webhook. */
	@Column({ name: 'order_id', type: 'uuid' })
	public orderId!: string;

	/** Timestamp when the webhook was processed. */
	@Column({ name: 'processed_at', type: 'timestamptz', default: () => 'NOW()' })
	public processedAt!: Date;
}
