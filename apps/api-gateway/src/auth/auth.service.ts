import { Injectable, Logger } from '@nestjs/common';
import { Clerk } from '@clerk/clerk-sdk-node';

@Injectable()
export class AuthService {
	private clerk: any;
	private readonly logger = new Logger(AuthService.name);

	constructor() {
		if (!process.env.CLERK_SECRET_KEY) {
			throw new Error('CLERK_SECRET_KEY environment variable is not set');
		}

		this.clerk = Clerk({ secretKey: process.env.CLERK_SECRET_KEY });
	}

	async verifyToken(token: string): Promise<boolean> {
		try {
			const { claims } = await this.clerk.verifyToken(token);
			this.logger.debug('Token verified successfully:', claims);
			return !!claims;
		} catch (error: any) {
			this.logger.error('Token verification failed:', error.message);
			return false;
		}
	}
}
