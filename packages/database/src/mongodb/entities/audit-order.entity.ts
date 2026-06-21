import { Entity, ObjectIdColumn, ObjectId, Column, Index } from 'typeorm';

/**
 * Represents an audit log entry for order-related actions in MongoDB.
 * Maps to the 'audit_orders' collection with a 5-year TTL index.
 */
@Entity({ name: 'audit_orders' })
@Index('idx_audit_orders_performed_at', ['performedAt'], { expireAfterSeconds: 60 * 60 * 24 * 365 * 5 })
export class AuditOrder {
	/** MongoDB ObjectId. */
	@ObjectIdColumn()
	public id!: ObjectId;

	/** ID of the entity being audited. */
	@Column()
	public entityId!: string;

	/** Action performed on the entity (e.g., 'CREATE', 'UPDATE', 'DELETE'). */
	@Column()
	public action!: string;

	/** Previous value of the entity before the action, if applicable. */
	@Column({ type: 'mixed' })
	public oldValue?: unknown;

	/** New value of the entity after the action, if applicable. */
	@Column({ type: 'mixed' })
	public newValue?: unknown;

	/** ID of the user or system that performed the action. */
	@Column()
	public performedBy!: string;

	/** Timestamp when the action was performed. */
	@Column()
	public performedAt!: Date;
}
