/**
 * SQS Message Types for Seat Booking System
 */

/**
 * Payment Processing Message
 * Sent by Order Service to Payment Service when a new order is created
 */
export interface PaymentProcessingMessage {
  /** Unique identifier for the order */
  orderId: string;

  /** Unique identifier for the seat being booked */
  seatId: string;

  /** Unique identifier for the account that owns the order */
  accountId: string;

  /** Unique identifier for the user who created the order */
  userId: string;

  /** Amount to be paid (fixed at 100.00 for this version) */
  amount: number;
}
