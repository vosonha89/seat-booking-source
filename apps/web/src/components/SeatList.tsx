import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/react';
import { apiService } from '../services/api.service';
import { SeatCard } from './SeatCard';
import { ISeat } from '@seat-booking/shared-types';

export function SeatList() {
	const [seats, setSeats] = useState<ISeat[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
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
					onClick={() => console.log('Seat clicked:', seat)}
				/>
			))}
		</div>
	);
}
