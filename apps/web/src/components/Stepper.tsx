import React from 'react';

/** Represents a single step in the stepper */
export interface StepperStep {
	/** Unique identifier for the step */
	id: string;
	/** Display label for the step */
	label: string;
	/** Icon class name (e.g. from flaticon) */
	icon?: string;
}

interface StepperProps {
	/** All steps in the stepper */
	steps: StepperStep[];
	/** Index of the currently active step (0-based) */
	currentStep: number;
	/** Index of the last completed step (-1 if none) */
	completedStep: number;
}

/**
 * A horizontal stepper/progress component that visually shows
 * the progression through a series of steps, styled like the
 * example in the reference image.
 *
 * @param steps - The steps to display
 * @param currentStep - The index of the currently active step
 * @param completedStep - The index of the last completed step
 */
export function Stepper({ steps, currentStep, completedStep }: StepperProps) {
	return (
		<div className='flex items-center justify-between w-full max-w-2xl mx-auto px-4'>
			{steps.map((step, index) => {
				const isCompleted = index <= completedStep;
				const isActive = index === currentStep;

				return (
					<React.Fragment key={step.id}>
						{/* Step circle + label */}
						<div className='flex flex-col items-center relative'>
							{/* Active marker above */}
							{isActive && (
								<div className='w-0 h-0 border-l-[6px] border-r-[6px] border-b-[8px] border-l-transparent border-r-transparent border-b-indigo-500 mb-1' />
							)}
							{!isActive && <div className='h-[9px] mb-1' />}

							{/* Circle */}
							<div
								className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
									isCompleted || isActive
										? 'bg-indigo-500 text-white shadow-md'
										: 'bg-gray-200 text-gray-500'
								}`}
							>
								{isCompleted && !isActive ? (
									<svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
										<path
											fillRule='evenodd'
											d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
											clipRule='evenodd'
										/>
									</svg>
								) : (
									index + 1
								)}
							</div>

							{/* Label */}
							<span
								className={`mt-2 text-xs font-medium whitespace-nowrap ${
									isCompleted || isActive ? 'text-indigo-600' : 'text-gray-400'
								}`}
							>
								{step.icon && <i className={`${step.icon} mr-1`} />}
								{step.label}
							</span>
						</div>

						{/* Connector line */}
						{index < steps.length - 1 && (
							<div className='flex-1 h-0.5 mx-2 mb-6 relative'>
								<div className='absolute inset-0 bg-gray-200 rounded' />
								<div
									className='absolute inset-0 bg-indigo-500 rounded transition-all duration-500'
									style={{
										width: isCompleted ? '100%' : isActive ? '50%' : '0%',
									}}
								/>
							</div>
						)}
					</React.Fragment>
				);
			})}
		</div>
	);
}
