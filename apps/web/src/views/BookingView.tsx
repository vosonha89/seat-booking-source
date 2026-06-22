import React from 'react';
import { SeatList } from '../components/SeatList';

/**
 * BookingView - A protected view component for the seat booking interface.
 *
 * This view is accessible only to authenticated users and provides the main
 * interface for selecting and booking seats.
 */
export function BookingView() {
	return (
		<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
			<div className="bg-white rounded-lg shadow-md p-6">
				<h2 className="text-2xl font-bold text-gray-900 mb-4">
					Seat Booking
				</h2>
				<p className="text-gray-600 mb-6">
					Welcome to the seat booking system. Please select your seats below.
				</p>

				<SeatList />
			</div>
		</div>
	);
}
