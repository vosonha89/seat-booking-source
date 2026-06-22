export declare enum OrderStatus {
    PENDING = "PENDING",
    PROCESSING = "PROCESSING",
    CONFIRMED = "CONFIRMED",
    FAILED = "FAILED",
    EXPIRED = "EXPIRED"
}
export interface IOrder {
    id: string;
    userId: string;
    seatId: string;
    accountId: string;
    status: OrderStatus;
    idempotencyKey: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface ICreateOrderDto {
    seatId: string;
    accountId: string;
}
