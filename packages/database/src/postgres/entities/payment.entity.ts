import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';
import { PaymentStatus } from '@seat-booking/shared-types';

/**
 * Represents a payment entity in the PostgreSQL database.
 * Maps to the 'payments' table.
 */
@Entity({ name: 'payments' })
export class Payment extends BaseEntity {
	/** ID of the order associated with this payment. */
	@Column({ name: 'order_id', type: 'uuid' })
	public orderId!: string;

	/** Status of the payment. */
	@Column({ length: 20, default: PaymentStatus.PENDING })
	public status!: PaymentStatus;

	/** Payment amount in cents. */
	@Column({ type: 'integer', default: 0 })
	public amount!: number;

	/** Transaction ID from the payment gateway. */
	@Column({ name: 'transaction_id', length: 255, nullable: true })
	public transactionId?: string;

	/** Response data from the payment gateway. */
	@Column({ name: 'gateway_response', type: 'jsonb', nullable: true })
	public gatewayResponse?: any;

	/** Idempotency key to prevent duplicate payment processing. */
	@Column({ name: 'idempotency_key', length: 255, unique: true })
	public idempotencyKey!: string;

	/** Timestamp when the payment was last updated. */
	@Column({ name: 'updated_at', type: 'timestamptz', default: () => 'NOW()' })
	public updatedAt!: Date;
}
