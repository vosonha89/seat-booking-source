import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

/**
 * Bootstrap the NestJS application.
 * Creates the app instance and starts listening on the configured port.
 */
async function bootstrap() {
const app = await NestFactory.create(AppModule);

if (!process.env.PORT) {
  throw new Error('PORT environment variable is not set');
}

await app.listen(process.env.PORT);
}
bootstrap();
