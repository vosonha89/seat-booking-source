import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { createClerkClient } from '@clerk/clerk-sdk-node';

@Module({
	imports: [],
	controllers: [AuthController],
	providers: [
		AuthService,
		{
			provide: 'CLERK_CLIENT',
			useValue: createClerkClient({
				secretKey: process.env.CLERK_SECRET_KEY,
			}),
		},
	],
	exports: [AuthService],
})
export class AuthModule {}
