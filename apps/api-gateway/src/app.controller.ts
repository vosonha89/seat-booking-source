import { Controller, Get, Req, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { createProxyMiddleware } from 'http-proxy-middleware';

/**
 * Root controller handling health-check and welcome endpoints.
 */
@Controller()
export class AppController {
	/**
	 * Create an instance of AppController.
	 * @param appService - The application service providing business logic.
	 */
	constructor(private readonly appService: AppService) {}

	/**
	 * Return a welcome message from the application service.
	 * @returns A greeting string.
	 */
	@Get()
	getHello(): string {
		return this.appService.getHello();
	}

	/**
	 * Proxy route to order service for seat endpoints.
	 * @param req - Request object
	 * @param res - Response object
	 */
	@Get('api/seats')
	getSeats(@Req() req: any, @Res() res: any) {
		const proxy = createProxyMiddleware({
			target: 'http://localhost:3002',
			changeOrigin: true,
			pathRewrite: { '^/api/seats': '/seats' },
		});
		return proxy(req, res);
	}

	/**
	 * Proxy route to order service for individual seat endpoints.
	 * @param req - Request object
	 * @param res - Response object
	 */
	@Get('api/seats/:id')
	getSeatById(@Req() req: any, @Res() res: any) {
		const proxy = createProxyMiddleware({
			target: 'http://localhost:3002',
			changeOrigin: true,
			pathRewrite: { '^/api/seats': '/seats' },
		});
		return proxy(req, res);
	}
}
