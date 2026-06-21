import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

/**
 * Root application module configuring the order service.
 */
@Module({
	imports: [],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
