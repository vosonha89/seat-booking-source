import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { BaseLoggingModule } from "@seat-booking/base-logging";
import { SqsConsumerService } from "./sqs-consumer.service";
import { PaymentGatewayService } from "./payment-gateway.service";

/**
 * Root application module configuring the payment service.
 */
@Module({
	imports: [BaseLoggingModule],
	controllers: [AppController],
	providers: [AppService, SqsConsumerService, PaymentGatewayService],
})
export class AppModule {}
