import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { IOrder, OrderStatus, SeatStatusEnum } from '@seat-booking/shared-types';
import { IOrderService } from './interfaces/order-service.interface';
import { IOrderRepository } from './interfaces/order-repository.interface';
import { ISeatRepository } from '../seat/interfaces/seat-repository.interface';
import { IOrderRepositorySymbol } from './tokens';
import { ISeatRepositorySymbol } from '../seat/tokens';
import { DataSource } from 'typeorm';

/**
 * Implementation of the order service interface.
 * Uses TypeORM repository to interact with the PostgreSQL database.
 */
@Injectable()
export class OrderService implements IOrderService {
	constructor(
		@Inject(IOrderRepositorySymbol)
		private readonly orderRepository: IOrderRepository,
		@Inject(ISeatRepositorySymbol)
		private readonly seatRepository: ISeatRepository,
		private readonly dataSource: DataSource,
	) {}

	/**
	 * Creates a new order and reserves the seat.
	 * @param seatId - ID of the seat to reserve.
	 * @param userId - ID of the user creating the order.
	 * @param accountId - ID of the account for the order.
	 * @returns Promise that resolves to the created IOrder object.
	 * @throws ConflictException if the seat is already reserved.
	 * @throws Error if the seat is not found.
	 */
	public async createOrder(
		seatId: string,
		userId: string,
		accountId: string,
	): Promise<IOrder> {
		// Start transaction with SERIALIZABLE isolation level for maximum safety
		return await this.dataSource.transaction(
			'SERIALIZABLE' as any,
			async (manager) => {
				// Find seat with pessimistic write lock to prevent double booking
				const seat = await this.seatRepository.findByIdForUpdate(seatId, manager);

				if (!seat) {
					throw new Error(`Seat with ID ${seatId} not found`);
				}

				// Check if seat is already reserved or booked
				if (seat.status !== SeatStatusEnum.AVAILABLE) {
					throw new ConflictException('Seat is already reserved');
				}

				// Generate idempotency key using UUID (simplified for now)
				const idempotencyKey = `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

				// Create order
				const order = await this.orderRepository.createOrder(
					{
						userId,
						seatId,
						accountId,
						status: OrderStatus.PENDING,
						idempotencyKey,
					},
					manager,
				);

				return order;
			},
		);
	}

	/**
	 * Finds an order by its ID.
	 * @param id - Unique identifier of the order.
	 * @returns Promise that resolves to the IOrder object or null if not found.
	 */
	public async findById(id: string): Promise<IOrder | null> {
		return this.orderRepository.findById(id);
	}
}
