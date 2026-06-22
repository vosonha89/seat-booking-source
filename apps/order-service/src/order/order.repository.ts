import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Order } from '@seat-booking/database';
import { IOrder, OrderStatus } from '@seat-booking/shared-types';
import { IOrderRepository } from './interfaces/order-repository.interface';

/**
 * TypeORM implementation of the order repository interface.
 */
@Injectable()
export class OrderRepository implements IOrderRepository {
	constructor(
		@InjectRepository(Order)
		private readonly orderRepository: Repository<Order>,
	) {}

	/**
	 * Creates a new order.
	 * @param order - Order data to create.
	 * @param manager - Optional TypeORM entity manager for transaction support.
	 * @returns Promise that resolves to the created IOrder object.
	 */
	public async createOrder(
		order: Partial<IOrder>,
		manager?: EntityManager,
	): Promise<IOrder> {
		const repository = manager ? manager.getRepository(Order) : this.orderRepository;
		const newOrder = repository.create(order);
		const savedOrder = await repository.save(newOrder);
		return this.mapEntityToDto(savedOrder);
	}

	/**
	 * Finds an order by its ID.
	 * @param id - Unique identifier of the order.
	 * @param manager - Optional TypeORM entity manager for transaction support.
	 * @returns Promise that resolves to the IOrder object or null if not found.
	 */
	public async findById(id: string, manager?: EntityManager): Promise<IOrder | null> {
		const repository = manager ? manager.getRepository(Order) : this.orderRepository;
		const order = await repository.findOneBy({ id });
		if (!order) {
			return null;
		}
		return this.mapEntityToDto(order);
	}

	/**
	 * Updates the status of an order.
	 * @param id - Unique identifier of the order.
	 * @param status - New status for the order.
	 * @param manager - Optional TypeORM entity manager for transaction support.
	 * @returns Promise that resolves to the updated IOrder object.
	 * @throws Error if order with specified ID is not found.
	 */
	public async updateStatus(
		id: string,
		status: OrderStatus,
		manager?: EntityManager,
	): Promise<IOrder> {
		const repository = manager ? manager.getRepository(Order) : this.orderRepository;
		const order = await repository.findOneBy({ id });

		if (!order) {
			throw new Error(`Order with ID ${id} not found`);
		}

		order.status = status;
		order.updatedAt = new Date();

		const updatedOrder = await repository.save(order);
		return this.mapEntityToDto(updatedOrder);
	}

	/**
	 * Maps TypeORM Order entity to IOrder DTO.
	 * @param entity - Order entity to map.
	 * @returns IOrder DTO.
	 */
	private mapEntityToDto(entity: Order): IOrder {
		return {
			id: entity.id,
			userId: entity.userId,
			seatId: entity.seatId,
			accountId: entity.accountId,
			status: entity.status as OrderStatus,
			idempotencyKey: entity.idempotencyKey,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
		};
	}
}
