import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeatController } from './seat.controller';
import { SeatService } from './seat.service';
import { SeatRepository } from './seat.repository';
import { ISeatServiceSymbol, ISeatRepositorySymbol } from './tokens';
import { Seat } from '@seat-booking/database';

/**
 * Module for managing seat-related functionality.
 * Registers the seat controller, service, and repository with dependency injection.
 */
@Module({
	imports: [TypeOrmModule.forFeature([Seat])],
	controllers: [SeatController],
	providers: [
		{
			provide: ISeatServiceSymbol,
			useClass: SeatService,
		},
		{
			provide: ISeatRepositorySymbol,
			useClass: SeatRepository,
		},
	],
	exports: [ISeatServiceSymbol, ISeatRepositorySymbol],
})
export class SeatModule {}
