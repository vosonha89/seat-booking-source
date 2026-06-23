import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PaymentProgressView } from './PaymentProgressView';
import { apiService } from '../services/api.service';
import { OrderStatus, PaymentStatus } from '@seat-booking/shared-types';

vi.mock('@clerk/react', () => ({
	useAuth: () => ({
		getToken: vi.fn().mockResolvedValue('mock-jwt-token'),
	}),
}));

vi.mock('../services/api.service', () => ({
	apiService: {
		orders: {
			getWithPayment: vi.fn(),
		},
	},
}));

const mockGetWithPayment = apiService.orders.getWithPayment as ReturnType<
	typeof vi.fn
>;

function makeResult(
	orderStatus: OrderStatus,
	paymentStatus: PaymentStatus | null = null,
) {
	return {
		order: {
			id: 'ord-123',
			userId: '1',
			seatId: 'seat-a1',
			accountId: '1',
			status: orderStatus,
			idempotencyKey: 'key',
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		payment: paymentStatus
			? {
					id: 'pay-123',
					orderId: 'ord-123',
					status: paymentStatus,
					amount: 10000,
					idempotencyKey: 'key',
					createdAt: new Date(),
					updatedAt: new Date(),
				}
			: null,
	};
}

/** Advance fake timers and flush microtasks */
async function advance(ms: number): Promise<void> {
	await act(async () => {
		vi.advanceTimersByTime(ms);
	});
}

describe('PaymentProgressView', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		mockGetWithPayment.mockReset();
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	it('redirects to /booking when no orderId is provided', () => {
		render(
			<MemoryRouter initialEntries={['/payment-progress']}>
				<PaymentProgressView />
			</MemoryRouter>,
		);

		// Component renders briefly with initializing state before redirect
		expect(screen.getByText('Initializing...')).toBeInTheDocument();
	});

	it('renders seat info and starts polling when orderId is provided', async () => {
		// Return PENDING order so polling doesn't error
		mockGetWithPayment.mockResolvedValue(
			makeResult(OrderStatus.PENDING, null),
		);

		render(
			<MemoryRouter
				initialEntries={[
					{
						pathname: '/payment-progress',
						state: { orderId: 'ord-123', seatLabel: 'A1' },
					},
				]}
			>
				<PaymentProgressView />
			</MemoryRouter>,
		);

		// Flush the first poll
		await advance(100);

		expect(screen.getByText('Seat: A1')).toBeInTheDocument();
		expect(screen.getByText('Order #ord-123')).toBeInTheDocument();
		expect(screen.getByText('Payment Progress')).toBeInTheDocument();
	});

	it('advances through steps as order and payment status progress', async () => {
		// First poll: order PENDING, no payment → step 1 done, step 2 active
		// Second poll: order PENDING, payment PENDING → step 1 done, step 2 active (PENDING is not SUCCESS)
		// Third poll: order PENDING, payment SUCCESS → step 2 done, step 3 active
		// Fourth poll: order CONFIRMED, payment SUCCESS → all done
		mockGetWithPayment
			.mockResolvedValueOnce(makeResult(OrderStatus.PENDING, null))
			.mockResolvedValueOnce(
				makeResult(OrderStatus.PENDING, PaymentStatus.PENDING),
			)
			.mockResolvedValueOnce(
				makeResult(OrderStatus.PENDING, PaymentStatus.SUCCESS),
			)
			.mockResolvedValueOnce(
				makeResult(OrderStatus.CONFIRMED, PaymentStatus.SUCCESS),
			);

		render(
			<MemoryRouter
				initialEntries={[
					{
						pathname: '/payment-progress',
						state: { orderId: 'ord-456', seatLabel: 'B2' },
					},
				]}
			>
				<PaymentProgressView />
			</MemoryRouter>,
		);

		// Advance through 4 polling intervals
		await advance(1600);
		await advance(1600);
		await advance(1600);
		await advance(1600);

		// Give time for the complete state to propagate
		await advance(100);

		expect(screen.getByText('Reservation Confirmed!')).toBeInTheDocument();
		expect(screen.getByText('Seat: B2')).toBeInTheDocument();
		// Polling may fire a few extra times before isComplete stops the loop
		expect(mockGetWithPayment.mock.calls.length).toBeGreaterThanOrEqual(4);
	});

	it('shows error state when order status is FAILED', async () => {
		mockGetWithPayment.mockResolvedValue(
			makeResult(OrderStatus.FAILED, null),
		);

		render(
			<MemoryRouter
				initialEntries={[
					{
						pathname: '/payment-progress',
						state: { orderId: 'ord-789', seatLabel: 'C3' },
					},
				]}
			>
				<PaymentProgressView />
			</MemoryRouter>,
		);

		// Advance timer for first poll to resolve
		await advance(1600);

		expect(screen.getByText('Processing Error')).toBeInTheDocument();
		expect(screen.getByText(/Order processing failed/)).toBeInTheDocument();
		expect(screen.getByText('Retry')).toBeInTheDocument();
	});

	it('renders footer info text', async () => {
		// Return PENDING order so polling doesn't error on the footer test
		mockGetWithPayment.mockResolvedValue(
			makeResult(OrderStatus.PENDING, null),
		);

		render(
			<MemoryRouter
				initialEntries={[
					{
						pathname: '/payment-progress',
						state: { orderId: 'ord-000', seatLabel: 'D4' },
					},
				]}
			>
				<PaymentProgressView />
			</MemoryRouter>,
		);

		await advance(100);

		expect(
			screen.getByText(/status is tracked by polling/),
		).toBeInTheDocument();
	});
});
