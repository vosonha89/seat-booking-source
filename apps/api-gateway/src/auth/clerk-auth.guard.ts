import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthService } from './auth.service';

/**
 * Guard that verifies Clerk JWTs on NestJS-guarded routes.
 * Note: The api-gateway's main proxy routes use the Express-level
 * clerkAuthMiddleware in main.ts instead of this NestJS guard.
 * This guard is available for any NestJS controllers that need
 * auth verification (e.g. the /auth/validate endpoint).
 */
@Injectable()
export class ClerkAuthGuard implements CanActivate {
	constructor(private readonly authService: AuthService) {}

	/**
	 * Verifies the Bearer token from the Authorization header.
	 * @param context - The NestJS execution context.
	 * @returns True if the token is valid, false otherwise.
	 */
	public async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();
		const token = this.extractTokenFromHeader(request);

		if (!token) {
			return false;
		}

		try {
			await this.authService.verifyToken(token);
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * Extracts the Bearer token from the request Authorization header.
	 * @param request - The HTTP request.
	 * @returns The raw token string, or undefined if not present.
	 */
	private extractTokenFromHeader(request: { headers: { authorization?: string } }): string | undefined {
		const [type, token] = request.headers.authorization?.split(' ') ?? [];
		return type === 'Bearer' ? token : undefined;
	}
}
