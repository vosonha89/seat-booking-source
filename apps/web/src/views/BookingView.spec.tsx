import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { BookingView } from './BookingView';

describe('BookingView', () => {
	it('renders seat booking title', () => {
		render(
			<BrowserRouter>
				<BookingView />
			</BrowserRouter>
		);
		expect(screen.getByText('Seat Booking')).toBeInTheDocument();
	});

	it('renders welcome message', () => {
		render(
			<BrowserRouter>
				<BookingView />
			</BrowserRouter>
		);
		expect(
			screen.getByText('Welcome to the seat booking system. Please select your seats below.')
		).toBeInTheDocument();
	});

	it('renders coming soon message', () => {
		render(
			<BrowserRouter>
				<BookingView />
			</BrowserRouter>
		);
		expect(screen.getByText('Seat selection interface coming soon...')).toBeInTheDocument();
	});
});
