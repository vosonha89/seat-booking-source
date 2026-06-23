import React from "react";
import {
	BrowserRouter as Router,
	Routes,
	Route,
	Navigate,
} from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { SignInView, BookingView, PaymentProgressView } from "./views";
import { useAuth } from "@clerk/react";
import { Layout } from "./components/Layout";
import "./styles.css";

function RootRedirect() {
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

	// Redirect based on authentication status
	if (isSignedIn) {
		return <Navigate to="/booking" replace />;
	}

	return <Navigate to="/sign-in" replace />;
}

export function App() {
	return (
		<Router>
			<Routes>
				<Route path="/" element={<RootRedirect />} />
				<Route
					path="/booking"
					element={
						<ProtectedRoute>
							<Layout>
								<BookingView />
							</Layout>
						</ProtectedRoute>
					}
				/>
				<Route
					path="/payment-progress"
					element={
						<ProtectedRoute>
							<Layout>
								<PaymentProgressView />
							</Layout>
						</ProtectedRoute>
					}
				/>
				<Route path="/sign-in/*" element={<SignInView />} />
			</Routes>
		</Router>
	);
}
