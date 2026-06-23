import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file in the service's root directory
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

/**
 * Bootstrap the NestJS application.
 * Creates the app instance and starts listening on the configured port.
 */
async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	const port = process.env.PORT || 3002;
	await app.listen(port);
	console.log(`Order service running on port ${port}`);
}
bootstrap();
