import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { BookingView } from './BookingView';
import { useAuth } from '@clerk/react';

vi.mock('@clerk/react', () => ({
	...vi.importActual('@clerk/react'),
	useAuth: vi.fn(),
}));

vi.mock('../components/SeatList', () => ({
	SeatList: vi.fn(() => <div data-testid="seat-list-component" />),
}));

describe('BookingView', () => {
	it('renders seat booking title', () => {
		(useAuth as vi.Mock).mockReturnValue({
			isSignedIn: true,
			isLoaded: true,
			getToken: vi.fn(),
		});

		render(
			<BrowserRouter>
				<BookingView />
			</BrowserRouter>
		);
		expect(screen.getByText('Seat Booking')).toBeInTheDocument();
	});

	it('renders welcome message', () => {
		(useAuth as vi.Mock).mockReturnValue({
			isSignedIn: true,
			isLoaded: true,
			getToken: vi.fn(),
		});

		render(
			<BrowserRouter>
				<BookingView />
			</BrowserRouter>
		);
		expect(
			screen.getByText('Welcome to the seat booking system. Please select your seats below.')
		).toBeInTheDocument();
	});

	it('renders seat list component', () => {
		(useAuth as vi.Mock).mockReturnValue({
			isSignedIn: true,
			isLoaded: true,
			getToken: vi.fn(),
		});

		render(
			<BrowserRouter>
				<BookingView />
			</BrowserRouter>
		);
		expect(screen.getByTestId('seat-list-component')).toBeInTheDocument();
	});
});
