import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api.service';
import { SeatCard } from './SeatCard';
import { ISeat, SeatStatusEnum } from '@seat-booking/shared-types';

export function SeatList() {
	const [seats, setSeats] = useState<ISeat[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedSeat, setSelectedSeat] = useState<ISeat | null>(null);
	const [isBooking, setIsBooking] = useState(false);
	const [bookingError, setBookingError] = useState<string | null>(null);
	const { getToken } = useAuth();
	const navigate = useNavigate();

	useEffect(() => {
		let cancelled = false;
		const controller = new AbortController();

		const fetchSeats = async () => {
			try {
				setLoading(true);
				setError(null);
				const token = await getToken();
				if (cancelled || controller.signal.aborted) return;
				const data = await apiService.seats.getAll(token || undefined);
				if (!cancelled) {
					setSeats(data);
				}
			} catch (err) {
				if (cancelled || controller.signal.aborted) return;
				console.error('Error fetching seats:', err);
				setError('Failed to load seats');
			} finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		};

		void fetchSeats();

		return () => {
			cancelled = true;
			controller.abort();
		};
	}, [getToken]);

	const handleSeatClick = (seat: ISeat) => {
		if (seat.status !== SeatStatusEnum.AVAILABLE || isBooking) return;
		setSelectedSeat(seat);
	};

	const handleConfirmBooking = async () => {
		if (!selectedSeat) return;

		setIsBooking(true);
		setBookingError(null);

		try {
			const token = await getToken();
			const order = await apiService.orders.create(selectedSeat.id, token || undefined);
			console.log('Order received from API:', order);

			// Redirect to payment progress page with order details
			navigate('/payment-progress', {
				state: {
					orderId: order.id,
					seatLabel: selectedSeat.label,
				},
			});
		} catch (err: unknown) {
			console.error('Error creating order:', err);
			const message =
				err instanceof Error ? err.message : 'Failed to create order. Please try again.';
			setBookingError(message);
			setIsBooking(false);
		}
	};

	const handleCancelBooking = () => {
		setSelectedSeat(null);
		setIsBooking(false);
		setBookingError(null);
	};

	if (loading) {
		return (
			<div className="text-center py-12">
				<div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
				<p className="mt-4 text-gray-600">Loading seats...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="text-center py-12 text-red-600">
				<p>{error}</p>
				<button
					onClick={() => window.location.reload()}
					className="mt-4 px-4 py-2 bg-red-100 rounded hover:bg-red-200"
				>
					Retry
				</button>
			</div>
		);
	}

	if (seats.length === 0) {
		return (
			<div className="text-center py-12 text-gray-500">
				<p>No seats available</p>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{seats.map((seat) => (
				<SeatCard
					key={seat.id}
					seat={seat}
					selected={selectedSeat?.id === seat.id}
					disabled={isBooking && selectedSeat?.id !== seat.id}
					loading={isBooking && selectedSeat?.id === seat.id}
					onClick={() => handleSeatClick(seat)}
				/>
			))}

			{/* Confirmation Modal */}
			{selectedSeat && !isBooking && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
						<h3 className="text-xl font-semibold mb-4">Confirm Booking</h3>
						<p className="mb-4">
							Are you sure you want to book seat <strong>{selectedSeat.label}</strong>?
						</p>
						<p className="text-sm text-gray-500 mb-4">
							You will be redirected to the payment progress page to complete the reservation.
						</p>
						{bookingError && (
							<p className="text-sm text-red-600 mb-4">{bookingError}</p>
						)}
						<div className="flex space-x-3">
							<button
								onClick={handleConfirmBooking}
								className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
							>
								Confirm
							</button>
							<button
								onClick={handleCancelBooking}
								className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
