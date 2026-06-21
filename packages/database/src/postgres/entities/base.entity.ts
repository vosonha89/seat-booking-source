import { PrimaryGeneratedColumn, Column } from 'typeorm';

/**
 * Base entity providing common fields for all database entities.
 */
export abstract class BaseEntity {
	/** Unique identifier (UUID) for the entity. */
	@PrimaryGeneratedColumn('uuid')
	public id!: string;

	/** Timestamp when the entity was created. */
	@Column({ name: 'created_at', type: 'timestamptz', default: () => 'NOW()' })
	public createdAt!: Date;
}
