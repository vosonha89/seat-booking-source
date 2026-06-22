import { Injectable } from '@nestjs/common';
import { Clerk } from '@clerk/clerk-sdk-node';

@Injectable()
export class AuthService {
	private clerk: any;

	constructor() {
		if (!process.env.CLERK_SECRET_KEY) {
			throw new Error('CLERK_SECRET_KEY environment variable is not set');
		}

		this.clerk = Clerk({ secretKey: process.env.CLERK_SECRET_KEY });
	}

	async verifyToken(token: string): Promise<boolean> {
		try {
			const session = await this.clerk.sessions.verifySession(token);
			return !!session;
		} catch (error) {
			return false;
		}
	}
}
