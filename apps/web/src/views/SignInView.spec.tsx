import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, Navigate } from 'react-router-dom';
import { SignInView } from './SignInView';
import { useAuth } from '@clerk/react';

vi.mock('@clerk/react', () => ({
	...vi.importActual('@clerk/react'),
	useAuth: vi.fn(),
	SignIn: vi.fn(() => <div data-testid="sign-in-component" />),
}));

vi.mock('react-router-dom', async () => {
	const actual = await vi.importActual('react-router-dom');
	return {
		...actual,
		Navigate: vi.fn(() => <div data-testid="navigate-component" />),
	};
});

describe('SignInView', () => {
	it('renders sign in form when not signed in', () => {
		(useAuth as vi.Mock).mockReturnValue({
			isSignedIn: false,
			isLoaded: true,
		});

		render(
			<BrowserRouter>
				<SignInView />
			</BrowserRouter>
		);

		expect(screen.getByTestId('sign-in-component')).toBeInTheDocument();
		expect(screen.queryByTestId('navigate-component')).not.toBeInTheDocument();
	});

	it('redirects to booking page when signed in', () => {
		(useAuth as vi.Mock).mockReturnValue({
			isSignedIn: true,
			isLoaded: true,
		});

		render(
			<BrowserRouter>
				<SignInView />
			</BrowserRouter>
		);

		expect(screen.getByTestId('navigate-component')).toBeInTheDocument();
		expect(Navigate).toHaveBeenCalledWith({
			to: '/booking',
			replace: true,
		}, undefined);
	});

	it('displays loading message when not loaded', () => {
		(useAuth as vi.Mock).mockReturnValue({
			isSignedIn: false,
			isLoaded: false,
		});

		render(
			<BrowserRouter>
				<SignInView />
			</BrowserRouter>
		);

		expect(screen.getByText('Loading...')).toBeInTheDocument();
	});
});
