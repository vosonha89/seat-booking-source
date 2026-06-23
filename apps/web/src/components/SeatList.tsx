import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/react';
import { apiService } from '../services/api.service';
import { SeatCard } from './SeatCard';
import { ISeat, SeatStatusEnum } from '@seat-booking/shared-types';
import { OrderStatus } from '@seat-booking/shared-types';

export function SeatList() {
	const [seats, setSeats] = useState<ISeat[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedSeat, setSelectedSeat] = useState<ISeat | null>(null);
	const [isBooking, setIsBooking] = useState(false);
	const [bookingStatus, setBookingStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
	const [bookingError, setBookingError] = useState<string | null>(null);
	const [orderId, setOrderId] = useState<string | null>(null);
	const { getToken } = useAuth();

	useEffect(() => {
		const fetchSeats = async () => {
			try {
				setLoading(true);
				setError(null);
				const token = await getToken();
				const data = await apiService.seats.getAll(token || undefined);
				setSeats(data);
			} catch (err) {
				console.error('Error fetching seats:', err);
				setError('Failed to load seats');
			} finally {
				setLoading(false);
			}
		};

		fetchSeats();
	}, [getToken]);

	useEffect(() => {
		let pollingInterval: NodeJS.Timeout;

		const pollOrderStatus = async () => {
			if (!orderId) return;

			try {
				const token = await getToken();
				const order = await apiService.orders.getStatus(orderId, token || undefined);

				if (order.status === OrderStatus.CONFIRMED) {
					setBookingStatus('success');
					clearInterval(pollingInterval);
					// Refresh seats to get updated status
					const token = await getToken();
					const data = await apiService.seats.getAll(token || undefined);
					setSeats(data);
				} else if (order.status === OrderStatus.FAILED || order.status === OrderStatus.EXPIRED) {
					setBookingStatus('error');
					setBookingError('Booking failed. Please try again.');
					clearInterval(pollingInterval);
					// Refresh seats to get updated status
					const token = await getToken();
					const data = await apiService.seats.getAll(token || undefined);
					setSeats(data);
				}
			} catch (err) {
				console.error('Error polling order status:', err);
			}
		};

		if (bookingStatus === 'pending' && orderId) {
			pollingInterval = setInterval(pollOrderStatus, 1000);
		}

		return () => {
			if (pollingInterval) {
				clearInterval(pollingInterval);
			}
		};
	}, [bookingStatus, orderId, getToken]);

	const handleSeatClick = (seat: ISeat) => {
		if (seat.status !== SeatStatusEnum.AVAILABLE || isBooking) return;
		setSelectedSeat(seat);
	};

	const handleConfirmBooking = async () => {
		if (!selectedSeat) return;

		setIsBooking(true);
		setBookingStatus('pending');
		setBookingError(null);

		try {
			const token = await getToken();
			const order = await apiService.orders.create(selectedSeat.id, token || undefined);
			console.log('Order received from API:', order);
			setOrderId(order.id);

			// Optimistically update seat status
			setSeats(prevSeats =>
				prevSeats.map(seat =>
					seat.id === selectedSeat.id
						? { ...seat, status: SeatStatusEnum.RESERVED }
						: seat
				)
			);
		} catch (err: any) {
			console.error('Error creating order:', err);
			setBookingStatus('error');
			setBookingError(err.response?.data?.message || 'Failed to create order. Please try again.');
			setIsBooking(false);
		}
	};

	const handleCancelBooking = () => {
		setSelectedSeat(null);
		setIsBooking(false);
		setBookingStatus('idle');
		setBookingError(null);
		setOrderId(null);
	};

	const handleRetryBooking = () => {
		setBookingStatus('idle');
		setBookingError(null);
		setOrderId(null);
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
			{selectedSeat && bookingStatus === 'idle' && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
						<h3 className="text-xl font-semibold mb-4">Confirm Booking</h3>
						<p className="mb-4">
							Are you sure you want to book seat <strong>{selectedSeat.label}</strong>?
						</p>
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

			{/* Booking Pending Modal */}
			{bookingStatus === 'pending' && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
						<div className="text-center">
							<div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
							<h3 className="text-xl font-semibold mb-2">Processing Payment</h3>
							<p className="text-gray-600 mb-4">
								Your booking is being processed. Please wait...
							</p>
							<p className="text-sm text-gray-500">
								Order ID: {orderId}
							</p>
						</div>
					</div>
				</div>
			)}

			{/* Booking Success Modal */}
			{bookingStatus === 'success' && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
						<div className="text-center">
							<div className="inline-block text-green-500 mb-4">
								<i className="fi fi-ss-check-circle text-6xl"></i>
							</div>
							<h3 className="text-xl font-semibold mb-2">Booking Successful!</h3>
							<p className="text-gray-600 mb-4">
								Your seat has been successfully booked.
							</p>
							<p className="text-sm text-gray-500 mb-6">
								Order ID: {orderId}
							</p>
							<button
								onClick={handleCancelBooking}
								className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
							>
								OK
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Booking Error Modal */}
			{bookingStatus === 'error' && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
						<div className="text-center">
							<div className="inline-block text-red-500 mb-4">
								<i className="fi fi-ss-x-circle text-6xl"></i>
							</div>
							<h3 className="text-xl font-semibold mb-2">Booking Failed</h3>
							<p className="text-gray-600 mb-4">
								{bookingError}
							</p>
							<div className="flex space-x-3">
								<button
									onClick={handleRetryBooking}
									className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
								>
									Retry
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
				</div>
			)}
		</div>
	);
}
