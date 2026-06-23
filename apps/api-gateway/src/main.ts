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

	// Enable CORS for frontend development
	app.enableCors({
		origin: 'http://localhost:3000',
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization'],
		credentials: true,
	});

	if (!process.env.PORT) {
		throw new Error('PORT environment variable is not set');
	}

	await app.listen(process.env.PORT, '0.0.0.0');
}
bootstrap();
