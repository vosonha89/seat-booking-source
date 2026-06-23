import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createProxyMiddleware, RequestHandler } from 'http-proxy-middleware';
import * as dotenv from 'dotenv';
import * as http from 'http';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const cors = require('cors');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const express = require('express');
import * as path from 'path';

// Load environment variables from .env file in the service's root directory
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

/**
 * Create a proxy middleware that forwards requests to the order service.
 * Registered WITHOUT an Express path prefix so the full URL is preserved.
 * Uses pathFilter to match only specific paths and pathRewrite to rewrite them.
 * @param pathPrefix - The path prefix to match and rewrite.
 * @param rewriteTo - The target path to rewrite to.
 * @returns Express middleware function for proxying.
 */
function createOrderServiceProxy(
	pathPrefix: string,
	rewriteTo: string,
): RequestHandler {
	return createProxyMiddleware({
		target: 'http://localhost:3002',
		changeOrigin: true,
		pathFilter: [pathPrefix],
		pathRewrite: { [`^${pathPrefix}`]: rewriteTo },
	});
}

/**
 * Bootstrap the NestJS application.
 * Creates a raw Express server with proxy middleware registered first,
 * then attaches NestJS as a catch-all handler for non-proxied routes.
 */
async function bootstrap() {
	// Create a raw Express instance and register proxy middleware FIRST.
	const expressApp = express();

	// Handle CORS preflight requests before proxy middleware so OPTIONS requests
	// receive proper Access-Control-Allow-Origin headers from the gateway.
	expressApp.use(
		cors({
			origin: 'http://localhost:3000',
			methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
			allowedHeaders: ['Content-Type', 'Authorization'],
			credentials: true,
		}),
	);

	// Register proxy middleware on the raw Express app.
	// NO path prefix in app.use() — the full URL is preserved so pathRewrite works.
	expressApp.use(createOrderServiceProxy('/api/seats', '/seats'));
	expressApp.use(createOrderServiceProxy('/api/orders', '/orders'));

	// Create NestJS app with body parser disabled (proxy handles streams)
	const app = await NestFactory.create(AppModule, { bodyParser: false });

	// Enable CORS for frontend development
	app.enableCors({
		origin: 'http://localhost:3000',
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization'],
		credentials: true,
	});

	await app.init();

	// Get the NestJS HTTP handler (a middleware function)
	const nestHandler = app.getHttpAdapter().getInstance() as (
		req: http.IncomingMessage,
		res: http.ServerResponse,
	) => void;

	// Mount NestJS as catch-all after proxy
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
	expressApp.all('*', nestHandler);

	if (!process.env.PORT) {
		throw new Error('PORT environment variable is not set');
	}

	// Start listening on the combined server
	const httpServer = http.createServer(expressApp);
	httpServer.listen(process.env.PORT, () => {
		console.log(`API Gateway running on port ${process.env.PORT}`);
	});
}
bootstrap();
