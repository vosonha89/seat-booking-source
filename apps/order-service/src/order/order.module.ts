import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '@seat-booking/database';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { OrderRepository } from './order.repository';
import { IOrderServiceSymbol, IOrderRepositorySymbol } from './tokens';

/**
 * Order module for managing order-related endpoints and business logic.
 */
@Module({
	imports: [TypeOrmModule.forFeature([Order])],
	controllers: [OrderController],
	providers: [
		{
			provide: IOrderServiceSymbol,
			useClass: OrderService,
		},
		{
			provide: IOrderRepositorySymbol,
			useClass: OrderRepository,
		},
	],
	exports: [
		IOrderServiceSymbol,
		IOrderRepositorySymbol,
	],
})
export class OrderModule {}
