import { Controller, Get } from "@nestjs/common";
import { AppService } from "./app.service";

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
}
