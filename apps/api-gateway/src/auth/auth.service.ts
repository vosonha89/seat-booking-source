import { Injectable, Logger } from '@nestjs/common';
import { Clerk } from '@clerk/clerk-sdk-node';

/**
 * Result of a successful Clerk token verification.
 */
export interface TokenVerificationResult {
	/** Clerk user ID (the `sub` claim). */
	userId: string;
}

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

	/**
	 * Verifies a Clerk JWT and returns the decoded claims including userId.
	 * @param token - The raw Bearer token to verify.
	 * @returns The verification result containing the userId.
	 * @throws Error if the token is invalid or verification fails.
	 */
	public async verifyToken(token: string): Promise<TokenVerificationResult> {
		const { claims } = await this.clerk.verifyToken(token);
		this.logger.debug('Token verified successfully:', claims);

		if (!claims || !claims.sub) {
			throw new Error('Token claims missing or invalid');
		}

		return { userId: claims.sub as string };
	}
}
