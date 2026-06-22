/**
 * Represents the possible statuses of a seat.
 */
export type SeatStatus = 'AVAILABLE' | 'RESERVED' | 'BOOKED';

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

// Constants for seat status to replace enum
export const SeatStatusEnum = {
	AVAILABLE: 'AVAILABLE' as const,
	RESERVED: 'RESERVED' as const,
	BOOKED: 'BOOKED' as const,
};

