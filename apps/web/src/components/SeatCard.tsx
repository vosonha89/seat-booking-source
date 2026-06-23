import React from 'react';
import { ISeat, SeatStatusEnum } from '@seat-booking/shared-types';

interface SeatCardProps {
	seat: ISeat;
	onClick?: () => void;
	selected?: boolean;
	disabled?: boolean;
	loading?: boolean;
}

export function SeatCard({
	seat,
	onClick,
	selected = false,
	disabled = false,
	loading = false,
}: SeatCardProps) {
	const getStatusColor = () => {
		if (selected) {
			return 'bg-blue-100 border-blue-500 text-blue-800';
		}
		switch (seat.status) {
			case SeatStatusEnum.AVAILABLE:
				return 'bg-green-100 border-green-500 text-green-800';
			case SeatStatusEnum.RESERVED:
				return 'bg-yellow-100 border-yellow-500 text-yellow-800';
			case SeatStatusEnum.BOOKED:
				return 'bg-gray-100 border-gray-500 text-gray-800';
			default:
				return 'bg-gray-100 border-gray-500 text-gray-800';
		}
	};

	const getStatusIcon = () => {
		if (loading) {
			return (
				<div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
			);
		}
		if (selected) {
			return <i className="fi fi-ss-check-circle text-4xl"></i>;
		}
		switch (seat.status) {
			case SeatStatusEnum.AVAILABLE:
				return <i className="fi fi-ss-check-circle text-4xl"></i>;
			case SeatStatusEnum.RESERVED:
				return <i className="fi fi-ss-clock text-4xl"></i>;
			case SeatStatusEnum.BOOKED:
				return <i className="fi fi-ss-x-circle text-4xl"></i>;
			default:
				return <i className="fi fi-ss-minus-circle text-4xl"></i>;
		}
	};

	const getStatusText = () => {
		if (loading) {
			return 'Processing...';
		}
		if (selected) {
			return 'Selected';
		}
		switch (seat.status) {
			case SeatStatusEnum.AVAILABLE:
				return 'Available';
			case SeatStatusEnum.RESERVED:
				return 'Pending';
			case SeatStatusEnum.BOOKED:
				return 'Booked';
			default:
				return 'Unknown';
		}
	};

	const isDisabled = disabled || seat.status !== SeatStatusEnum.AVAILABLE || loading;

	return (
		<button
			className={`border-2 rounded-lg p-4 text-center cursor-pointer transition-all duration-200 hover:shadow-md ${getStatusColor()} ${
				isDisabled ? 'cursor-not-allowed opacity-70' : 'hover:border-green-700'
			} ${selected ? 'ring-2 ring-blue-500' : ''}`}
			onClick={onClick}
			disabled={isDisabled}
		>
			<div className="text-4xl mb-2">{getStatusIcon()}</div>
			<div className="text-xl font-semibold mb-1">{seat.label}</div>
			<div className="text-sm">{getStatusText()}</div>
		</button>
	);
}
