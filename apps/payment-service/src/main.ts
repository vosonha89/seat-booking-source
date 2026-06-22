import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

/**
 * Bootstrap the NestJS application.
 * Creates the app instance and starts listening on the configured port.
 */
async function bootstrap() {
const app = await NestFactory.create(AppModule);

if (!process.env.PORT) {
  process.env.PORT = '3003'; // Default port for payment-service
  console.log('PORT environment variable not set, using default port 3003');
}

await app.listen(process.env.PORT);
}
bootstrap();
