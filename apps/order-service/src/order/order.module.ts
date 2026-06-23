import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '@seat-booking/database';
import { Seat } from '@seat-booking/database';
import { WebhookLog } from '@seat-booking/database';
import { AuditPayment } from '@seat-booking/database';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { OrderRepository } from './order.repository';
import { IOrderServiceSymbol, IOrderRepositorySymbol } from './tokens';
import { SeatModule } from '../seat/seat.module';
import { SqsProducerService } from './sqs-producer.service';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';

/**
 * Order module for managing order-related endpoints and business logic.
 */
@Module({
	imports: [
		TypeOrmModule.forFeature([Order, Seat, WebhookLog], 'postgres'),
		TypeOrmModule.forFeature([AuditPayment], 'mongodb'),
		SeatModule
	],
	controllers: [OrderController, WebhookController],
	providers: [
		{
			provide: IOrderServiceSymbol,
			useClass: OrderService,
		},
		{
			provide: IOrderRepositorySymbol,
			useClass: OrderRepository,
		},
		SqsProducerService,
		WebhookService,
	],
	exports: [
		IOrderServiceSymbol,
		IOrderRepositorySymbol,
	],
})
export class OrderModule {}
