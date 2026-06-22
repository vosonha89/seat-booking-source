import {
	Controller,
	Post,
	Body,
	HttpCode,
	HttpStatus,
	Inject,
	Get,
	Param,
} from '@nestjs/common';
import { IOrderService } from './interfaces/order-service.interface';
import { IOrderServiceSymbol } from './tokens';
import { ICreateOrderDto, IOrder } from '@seat-booking/shared-types';

/**
 * Controller for order-related endpoints.
 */
@Controller('orders')
export class OrderController {
	constructor(
		@Inject(IOrderServiceSymbol)
		private readonly orderService: IOrderService,
	) {}

	/**
	 * Creates a new order and reserves the seat.
	 * @param request - Request body containing seatId, userId, and accountId.
	 * @returns Promise that resolves to the created IOrder object.
	 */
	@Post()
	@HttpCode(HttpStatus.CREATED)
	public async createOrder(
		@Body() request: ICreateOrderDto,
	): Promise<IOrder> {
		const { seatId, accountId } = request;
		// TODO: Get userId from auth context (Clerk)
		const userId = '1'; // Temporary placeholder
		return this.orderService.createOrder(seatId, userId, accountId);
	}

	/**
	 * Gets an order by id.
	 * @param id - Order id.
	 * @returns Promise that resolves to the found IOrder object or null.
	 */
	@Get(':id')
	public async getOrder(@Param('id') id: string): Promise<IOrder | null> {
		return this.orderService.findById(id);
	}
}
