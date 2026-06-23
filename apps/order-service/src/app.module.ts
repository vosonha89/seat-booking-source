import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BaseLoggingModule } from '@seat-booking/base-logging';
import { SeatModule } from './seat/seat.module';
import { OrderModule } from './order/order.module';
import { Seat, Order, WebhookLog, AuditPayment } from '@seat-booking/database';

/**
 * Root application module configuring the order service.
 */
@Module({
	imports: [
		BaseLoggingModule,
		TypeOrmModule.forRoot({
			name: 'postgres',
			type: 'postgres',
			host: process.env['POSTGRES_HOST'] ?? 'localhost',
			port: Number(process.env['POSTGRES_PORT'] ?? 5432),
			database: process.env['POSTGRES_DB'] ?? 'seat_booking',
			username: process.env['POSTGRES_USER'] ?? 'postgres',
			password: process.env['POSTGRES_PASSWORD'] ?? 'postgres',
			synchronize: true,
			logging: false,
			entities: [Seat, Order, WebhookLog],
		}),
		TypeOrmModule.forRoot({
			name: 'mongodb',
			type: 'mongodb',
			host: process.env['MONGODB_HOST'] ?? 'localhost',
			port: Number(process.env['MONGODB_PORT'] ?? 27017),
			database: process.env['MONGODB_DB'] ?? 'seat_booking_audit',
			synchronize: true,
			logging: false,
			entities: [AuditPayment],
		}),
		SeatModule,
		OrderModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
