import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BaseLoggingModule } from '@seat-booking/base-logging';
import { AuthModule } from './auth/auth.module';

/**
 * Root application module configuring the API gateway service.
 */
@Module({
	imports: [BaseLoggingModule, AuthModule],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
