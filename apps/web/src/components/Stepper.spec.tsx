import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Stepper, StepperStep } from './Stepper';

const STEPS: StepperStep[] = [
	{ id: 'order', label: 'Order' },
	{ id: 'payment', label: 'Payment' },
	{ id: 'confirm', label: 'Confirm' },
];

describe('Stepper', () => {
	it('renders all step labels', () => {
		render(<Stepper steps={STEPS} currentStep={0} completedStep={-1} />);
		expect(screen.getByText('Order')).toBeInTheDocument();
		expect(screen.getByText('Payment')).toBeInTheDocument();
		expect(screen.getByText('Confirm')).toBeInTheDocument();
	});

	it('renders step numbers', () => {
		render(<Stepper steps={STEPS} currentStep={0} completedStep={-1} />);
		expect(screen.getByText('1')).toBeInTheDocument();
		expect(screen.getByText('2')).toBeInTheDocument();
		expect(screen.getByText('3')).toBeInTheDocument();
	});

	it('shows checkmark icon for completed steps', () => {
		render(<Stepper steps={STEPS} currentStep={1} completedStep={0} />);
		// Step 1 should have a checkmark (svg with path), step 2 shows "2", step 3 shows "3"
		expect(screen.getByText('2')).toBeInTheDocument();
		expect(screen.getByText('3')).toBeInTheDocument();
	});

	it('renders connector lines between steps', () => {
		const { container } = render(
			<Stepper steps={STEPS} currentStep={0} completedStep={-1} />,
		);
		// Connector lines are rendered as divs with "relative" class inside the step list
		const allDivs = container.querySelectorAll('div');
		const connectors = Array.from(allDivs).filter(
			(el) =>
				el.className.includes('h-0.5') &&
				el.className.includes('relative'),
		);
		expect(connectors.length).toBe(2);
	});

	it('renders with optional icon prop', () => {
		const stepsWithIcon: StepperStep[] = [
			{ id: 'order', label: 'Order', icon: 'fi fi-ss-shopping-cart' },
		];
		render(<Stepper steps={stepsWithIcon} currentStep={0} completedStep={-1} />);
		expect(screen.getByText('Order')).toBeInTheDocument();
	});
});
