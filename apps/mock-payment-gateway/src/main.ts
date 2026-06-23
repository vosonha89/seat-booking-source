import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
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

if (!process.env.PORT) {
  process.env.PORT = '3004'; // Default port for mock-payment-gateway
  console.log('PORT environment variable not set, using default port 3004');
}

await app.listen(process.env.PORT);
}
bootstrap();
