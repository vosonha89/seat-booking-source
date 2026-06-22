import React from "react";
import { ISeat, SeatStatus } from "@seat-booking/shared-types";

const SeatStatusEnum = {
	AVAILABLE: "AVAILABLE" as const,
	RESERVED: "RESERVED" as const,
	BOOKED: "BOOKED" as const,
};

interface SeatCardProps {
	seat: ISeat;
	onClick?: () => void;
}

export function SeatCard({ seat, onClick }: SeatCardProps) {
	const getStatusColor = () => {
		switch (seat.status) {
			case SeatStatusEnum.AVAILABLE:
				return "bg-green-100 border-green-500 text-green-800";
			case SeatStatusEnum.RESERVED:
				return "bg-yellow-100 border-yellow-500 text-yellow-800";
			case SeatStatusEnum.BOOKED:
				return "bg-red-100 border-red-500 text-red-800";
			default:
				return "bg-gray-100 border-gray-500 text-gray-800";
		}
	};

	const getStatusIcon = () => {
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
		switch (seat.status) {
			case SeatStatusEnum.AVAILABLE:
				return "Available";
			case SeatStatusEnum.RESERVED:
				return "Reserved";
			case SeatStatusEnum.BOOKED:
				return "Booked";
			default:
				return "Unknown";
		}
	};

	return (
		<button
			className={`border-2 rounded-lg p-4 text-center cursor-pointer transition-all duration-200 hover:shadow-md ${getStatusColor()} ${
				seat.status === SeatStatusEnum.AVAILABLE
					? "hover:border-green-700"
					: "cursor-not-allowed"
			}`}
			onClick={onClick}
		>
			<div className="text-4xl mb-2">{getStatusIcon()}</div>
			<div className="text-xl font-semibold mb-1">{seat.label}</div>
			<div className="text-sm">{getStatusText()}</div>
		</button>
	);
}
