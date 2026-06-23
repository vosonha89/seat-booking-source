import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Stepper, StepperStep } from '../components/Stepper';
import { apiService } from '../services/api.service';
import { OrderStatus } from '@seat-booking/shared-types';

/** Payment progress step keys */
type StepKey = 'order' | 'payment' | 'confirm';

/** Definition for each step in the payment flow */
interface PaymentStep {
	key: StepKey;
	config: StepperStep;
	title: string;
	description: string;
}

/** The ordered steps displayed in the stepper */
const STEPS: PaymentStep[] = [
	{
		key: 'order',
		config: {
			id: 'order',
			label: 'Order',
			icon: 'fi fi-ss-shopping-cart',
		},
		title: 'Creating Your Order',
		description:
			'Reserving your seat and preparing the order details...',
	},
	{
		key: 'payment',
		config: {
			id: 'payment',
			label: 'Payment',
			icon: 'fi fi-ss-credit-card',
		},
		title: 'Processing Payment',
		description:
			'Securely processing your payment through the payment gateway...',
	},
	{
		key: 'confirm',
		config: {
			id: 'confirm',
			label: 'Confirm',
			icon: 'fi fi-ss-check-circle',
		},
		title: 'Confirming Reservation',
		description:
			'Finalizing your seat reservation and sending confirmation...',
	},
];

/** Polling interval in milliseconds */
const POLL_INTERVAL = 1500;

/** Navigation state passed from SeatList */
interface PaymentLocationState {
	orderId?: string;
	seatLabel?: string;
}

/**
 * PaymentProgressView - Displays a step-by-step payment progress flow
 * driven by real order and payment status from the backend.
 *
 * This page is only accessible when navigated from SeatList with an orderId
 * in location.state. If accessed directly without an orderId, the user is
 * redirected back to /booking.
 *
 * The view polls the order+payment status endpoint every 1.5s and advances
 * the stepper based on the actual backend state:
 *   Step 1 (Order)  → completed when order.status === PENDING
 *   Step 2 (Payment) → completed when payment exists with PENDING status
 *   Step 3 (Confirm) → completed when order.status === CONFIRMED
 *
 * If the order status becomes FAILED, an error is shown with a back button.
 */
export function PaymentProgressView() {
	const [currentStepIndex, setCurrentStepIndex] = useState(0);
	const [completedStepIndex, setCompletedStepIndex] = useState(-1);
	const [isPolling, setIsPolling] = useState(false);
	const [isComplete, setIsComplete] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const abortRef = useRef<boolean>(false);
	const navigate = useNavigate();
	const location = useLocation();

	const state = location.state as PaymentLocationState | null;
	const orderId = state?.orderId;
	const seatLabel = state?.seatLabel;

	/**
	 * Derive step completion from the backend order and payment status.
	 *
	 * Step 1 (Order): completed when the order exists with PENDING status.
	 * Step 2 (Payment): completed when the payment exists with PENDING status.
	 * Step 3 (Confirm): completed when the order status is CONFIRMED.
	 */
	const deriveStepStatus = useCallback(
		(orderStatus: OrderStatus, paymentStatus: string | null) => {
			const step1Complete =
				orderStatus === OrderStatus.PENDING ||
				orderStatus === OrderStatus.CONFIRMED ||
				orderStatus === OrderStatus.FAILED;
			const step2Complete =
				step1Complete && paymentStatus === 'SUCCESS';
			const step3Complete =
				step2Complete && orderStatus === OrderStatus.CONFIRMED;

			return { step1Complete, step2Complete, step3Complete };
		},
		[],
	);

	/**
	 * Poll the backend for order + payment status.
	 * On each response, advances the stepper steps based on real state.
	 */
	const pollStatus = useCallback(async () => {
		if (!orderId || abortRef.current) return;

		try {
			const result = await apiService.orders.getWithPayment(orderId);
			if (abortRef.current) return;

			const orderStatus = result.order.status;
			const paymentStatus = result.payment?.status ?? null;

			// Check for terminal failure
			if (orderStatus === OrderStatus.FAILED) {
				setError(
					'Order processing failed. The payment could not be completed.',
				);
				setIsPolling(false);
				return;
			}

			const { step1Complete, step2Complete, step3Complete } =
				deriveStepStatus(orderStatus, paymentStatus);

			// Update step completion and current step index
			if (step3Complete) {
				setCurrentStepIndex(2);
				setCompletedStepIndex(2);
				setIsComplete(true);
				setIsPolling(false);
			} else if (step2Complete) {
				setCurrentStepIndex(2);
				setCompletedStepIndex(1);
			} else if (step1Complete) {
				setCurrentStepIndex(1);
				setCompletedStepIndex(0);
			}
		} catch {
			if (abortRef.current) return;
			console.error('[PaymentProgress] Poll failed, will retry...');
		}
	}, [orderId, deriveStepStatus]);

	/** Start polling */
	const startPolling = useCallback(() => {
		setIsPolling(true);
		abortRef.current = false;
	}, []);

	/** Stop polling and clean up */
	const stopPolling = useCallback(() => {
		abortRef.current = true;
		setIsPolling(false);
		if (pollRef.current !== null) {
			clearTimeout(pollRef.current);
			pollRef.current = null;
		}
	}, []);

	/** Go back to booking */
	const handleBack = useCallback(() => {
		stopPolling();
		navigate('/booking');
	}, [navigate, stopPolling]);

	/** Retry polling after error */
	const handleRetry = useCallback(() => {
		setError(null);
		setIsComplete(false);
		startPolling();
	}, [startPolling]);

	// Redirect to /booking if no orderId is present
	useEffect(() => {
		if (!orderId) {
			void navigate('/booking', { replace: true });
		}
	}, [orderId, navigate]);

	// Start polling when orderId is available
	useEffect(() => {
		if (orderId && !isPolling && !isComplete && !error) {
			startPolling();
		}
	}, [orderId, isPolling, isComplete, error, startPolling]);

	// Polling loop: poll every POLL_INTERVAL while isPolling is true
	useEffect(() => {
		if (!isPolling || abortRef.current) return;

		// Poll immediately on start
		void pollStatus();

		// Schedule recurring polls after each completes
		const scheduleNext = (): void => {
			pollRef.current = setTimeout(() => {
				if (abortRef.current) return;
				void pollStatus().then(() => {
					if (!abortRef.current) {
						scheduleNext();
					}
				});
			}, POLL_INTERVAL);
		};
		scheduleNext();

		return () => {
			if (pollRef.current !== null) {
				clearTimeout(pollRef.current);
				pollRef.current = null;
			}
		};
	}, [isPolling, pollStatus]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			abortRef.current = true;
			if (pollRef.current !== null) {
				clearTimeout(pollRef.current);
			}
		};
	}, []);

	const currentStep = STEPS[currentStepIndex];
	const stepsForStepper = STEPS.map((s) => s.config);

	return (
		<div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
			<div className='bg-white rounded-lg shadow-md p-6'>
				{/* Header */}
				<div className='text-center mb-8'>
					<h2 className='text-2xl font-bold text-gray-900 mb-2'>
						Payment Progress
					</h2>
					<p className='text-gray-500'>
						Track your seat reservation through each step of the process.
					</p>
					{seatLabel && (
						<div className='mt-3 inline-flex items-center space-x-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium'>
							<i className='fi fi-ss-seat' />
							<span>Seat: {seatLabel}</span>
							{orderId && (
								<span className='text-indigo-400'>•</span>
							)}
							{orderId && (
								<span className='text-indigo-500'>Order #{orderId}</span>
							)}
						</div>
					)}
				</div>

				{/* Stepper */}
				<div className='mb-10'>
					<Stepper
						steps={stepsForStepper}
						currentStep={isComplete ? STEPS.length - 1 : currentStepIndex}
						completedStep={isComplete ? STEPS.length - 1 : completedStepIndex}
					/>
				</div>

			{/* Step detail card */}
			<div className='bg-gray-50 rounded-xl p-6 mb-8'>
				{!isPolling && !isComplete && !error ? (
					/* Waiting state — redirected away if no orderId */
					<div className='text-center'>
						<div className='inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4' />
						<h3 className='text-xl font-semibold text-gray-900 mb-2'>
						 Initializing...
						</h3>
						<p className='text-gray-600'>
							Preparing payment steps...
						</p>
					</div>
				) : isComplete ? (
						/* Success state */
						<div className='text-center'>
							<div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
								<svg
									className='w-10 h-10 text-green-500'
									fill='currentColor'
									viewBox='0 0 20 20'
								>
									<path
										fillRule='evenodd'
										d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
										clipRule='evenodd'
									/>
								</svg>
							</div>
							<h3 className='text-xl font-semibold text-gray-900 mb-2'>
								Reservation Confirmed!
							</h3>
							<p className='text-gray-600 mb-2'>
								Your seat has been successfully reserved and payment has been
								processed.
							</p>
							{seatLabel && (
								<p className='text-sm text-gray-700 mb-1'>
									Seat: <strong>{seatLabel}</strong>
								</p>
							)}
							{orderId && (
								<p className='text-sm text-gray-500 mb-1'>
									Order ID: {orderId}
								</p>
							)}
							<button
								onClick={handleBack}
								className='mt-4 px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors'
							>
								Back to Booking
							</button>
						</div>
					) : error ? (
						/* Error state */
						<div className='text-center'>
							<div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4'>
								<svg
									className='w-10 h-10 text-red-500'
									fill='currentColor'
									viewBox='0 0 20 20'
								>
									<path
										fillRule='evenodd'
										d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
										clipRule='evenodd'
									/>
								</svg>
							</div>
							<h3 className='text-xl font-semibold text-gray-900 mb-2'>
								Processing Error
							</h3>
							<p className='text-gray-600 mb-6'>{error}</p>
							<div className='flex space-x-3 justify-center'>
								<button
									onClick={handleRetry}
									className='px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors'
								>
									Retry
								</button>
								<button
									onClick={handleBack}
									className='px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors'
								>
									Cancel
								</button>
							</div>
						</div>
					) : (
						/* Active processing state */
						<div className='text-center'>
							{isPolling && (
								<div className='inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4' />
							)}
							<h3 className='text-xl font-semibold text-gray-900 mb-2'>
								{currentStep.title}
							</h3>
							<p className='text-gray-600 mb-4'>{currentStep.description}</p>
							<div className='inline-flex items-center space-x-2 text-sm text-indigo-600'>
								<span className='w-2 h-2 bg-indigo-500 rounded-full animate-pulse' />
								<span>
									Processing step {currentStepIndex + 1} of {STEPS.length}...
								</span>
							</div>
						</div>
					)}
				</div>

				{/* Footer info */}
				<div className='text-center text-sm text-gray-400'>
					<p>
						Order → Payment → Confirm — status is tracked by polling the backend
						for real order and payment updates.
					</p>
				</div>
			</div>
		</div>
	);
}
