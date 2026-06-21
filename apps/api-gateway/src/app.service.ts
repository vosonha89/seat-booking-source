import { Injectable } from '@nestjs/common';

/**
 * Application service providing core business logic for the API gateway.
 */
@Injectable()
export class AppService {
	/**
	 * Return a simple welcome message.
	 * @returns A greeting string.
	 */
	getHello(): string {
		return 'Hello World!';
	}
}
