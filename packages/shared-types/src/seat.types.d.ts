export declare enum SeatStatus {
    AVAILABLE = "AVAILABLE",
    RESERVED = "RESERVED",
    BOOKED = "BOOKED"
}
export interface ISeat {
    id: string;
    label: string;
    status: SeatStatus;
    reservedBy?: string;
    reservedAt?: Date;
}
