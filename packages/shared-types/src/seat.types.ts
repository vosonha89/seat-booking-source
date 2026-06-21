/**
 * Represents the possible statuses of a seat.
 */
export enum SeatStatus {
	AVAILABLE = 'AVAILABLE',
	RESERVED = 'RESERVED',
	BOOKED = 'BOOKED',
}

/**
 * Represents a seat entity with its properties.
 */
export interface ISeat {
	/** Unique identifier for the seat. */
	id: string;
	/** Human-readable label for the seat (e.g., 'A1'). */
	label: string;
	/** Current status of the seat. */
	status: SeatStatus;
	/** ID of the user who reserved the seat, if any. */
	reservedBy?: string;
	/** Timestamp when the seat was reserved, if any. */
	reservedAt?: Date;
}

