import { Entity, ObjectIdColumn, ObjectId, Column, Index } from 'typeorm';

/**
 * Represents an audit log entry for payment-related actions in MongoDB.
 * Maps to the 'audit_payments' collection with a 7-year TTL index (financial compliance).
 */
@Entity({ name: 'audit_payments' })
@Index('idx_audit_payments_performed_at', ['performedAt'], { expireAfterSeconds: 60 * 60 * 24 * 365 * 7 })
export class AuditPayment {
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
