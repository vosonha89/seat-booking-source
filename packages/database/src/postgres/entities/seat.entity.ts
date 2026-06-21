import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

/**
 * Represents a seat entity in the PostgreSQL database.
 * Maps to the 'seats' table.
 */
@Entity({ name: 'seats' })
export class Seat extends BaseEntity {
	/** Human-readable label for the seat (e.g., 'A1'). */
	@Column({ length: 10 })
	public label!: string;

	/** Current status of the seat. */
	@Column({ length: 20, default: 'AVAILABLE' })
	public status!: string;

	/** ID of the user who reserved the seat, if any. */
	@Column({ name: 'reserved_by', length: 255, nullable: true })
	public reservedBy?: string;

	/** Timestamp when the seat was reserved, if any. */
	@Column({ name: 'reserved_at', type: 'timestamptz', nullable: true })
	public reservedAt?: Date;
}
