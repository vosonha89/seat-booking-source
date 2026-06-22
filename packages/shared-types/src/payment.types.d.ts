export declare enum PaymentStatus {
    PENDING = "PENDING",
    SUCCESS = "SUCCESS",
    FAILED = "FAILED"
}
export interface IPaymentMessage {
    orderId: string;
    accountId: string;
    amount: number;
    idempotencyKey: string;
}
export interface IWebhookPayload {
    webhookId: string;
    orderId: string;
    status: PaymentStatus;
}
