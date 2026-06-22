import React from "react";
import { SignIn } from "@clerk/react";
import { useAuth } from "@clerk/react";
import { Navigate } from "react-router-dom";

/**
 * SignInView - A view component that wraps the Clerk SignIn form with predefined configurations.
 *
 * This view handles user authentication using Clerk's built-in authentication UI,
 * providing routing configuration and redirect behavior.
 */
export function SignInView() {
	const { isSignedIn, isLoaded } = useAuth();

	// If still loading, show nothing
	if (!isLoaded) {
		return (
			<div style={{
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				height: '100vh',
				width: '100vw'
			}}>
				Loading...
			</div>
		);
	}

	// If already authenticated, redirect to booking page
	if (isSignedIn) {
		return <Navigate to="/booking" replace />;
	}

	return (
		<div className="flex-1 flex flex-col justify-center items-center">
			<SignIn
				routing="path"
				path="/sign-in"
				signUpUrl="/sign-up"
				forceRedirectUrl="/booking"
				fallbackRedirectUrl="/booking"
				signUpForceRedirectUrl="/booking"
				signUpFallbackRedirectUrl="/booking"
			/>
		</div>
	);
}
