import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';
import { OrderStatus } from '@seat-booking/shared-types';

/**
 * Represents an order entity in the PostgreSQL database.
 * Maps to the 'orders' table.
 */
@Entity({ name: 'orders' })
export class Order extends BaseEntity {
	/** ID of the user who created the order. */
	@Column({ name: 'user_id', length: 255 })
	public userId!: string;

	/** ID of the seat being ordered. */
	@Column({ name: 'seat_id', type: 'uuid' })
	public seatId!: string;

	/** ID of the account for ordering (used for SQS FIFO grouping). */
	@Column({ name: 'account_id', length: 255 })
	public accountId!: string;

	/** Current status of the order. */
	@Column({ length: 20, default: OrderStatus.PENDING })
	public status!: OrderStatus;

	/** Idempotency key to prevent duplicate order creation. */
	@Column({ name: 'idempotency_key', length: 255, unique: true })
	public idempotencyKey!: string;

	/** Timestamp when the order was last updated. */
	@Column({ name: 'updated_at', type: 'timestamptz', default: () => 'NOW()' })
	public updatedAt!: Date;
}
