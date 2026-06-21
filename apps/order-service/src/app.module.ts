import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BaseLoggingModule } from '@seat-booking/base-logging';

/**
 * Root application module configuring the order service.
 */
@Module({
	imports: [BaseLoggingModule],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
