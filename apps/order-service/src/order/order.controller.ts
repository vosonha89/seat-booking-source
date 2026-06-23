import {
	Controller,
	Post,
	Body,
	HttpCode,
	HttpStatus,
	Inject,
	Get,
	Param,
	Req,
} from '@nestjs/common';
import { IOrderService } from './interfaces/order-service.interface';
import { IOrderServiceSymbol } from './tokens';
import { ICreateOrderDto, IOrder, IPayment } from '@seat-booking/shared-types';
/**
 * Minimal request interface used to read forwarded auth headers.
 * Avoids coupling to Node.js IncomingMessage for testability.
 */
interface IncomingRequest {
	headers: Record<string, string | string[] | undefined>;
}

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
	 * Reads the authenticated userId and accountId from headers injected by
	 * the api-gateway's Clerk auth middleware (x-user-id, x-user-account-id).
	 * @param request - Request body containing seatId.
	 * @param req - Request object with forwarded auth headers.
	 * @returns Promise that resolves to the created IOrder object.
	 */
	@Post()
	@HttpCode(HttpStatus.CREATED)
	public async createOrder(
		@Body() request: ICreateOrderDto,
		@Req() req: IncomingRequest,
	): Promise<IOrder> {
		const { seatId } = request;
		// userId and accountId are injected by the api-gateway Clerk middleware.
		// Fallback to 'anonymous' only for backwards-compatibility in local dev
		// when running order-service directly without the gateway.
		const userId = (req.headers['x-user-id'] as string) ?? 'anonymous';
		const accountId =
			(req.headers['x-user-account-id'] as string) ?? userId;
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

	/**
	 * Gets an order with its associated payment by id.
	 * Used by the frontend payment progress view to poll status.
	 * @param id - Order id.
	 * @returns Promise that resolves to an object containing order and payment, or null.
	 */
	@Get(':id/status')
	public async getOrderStatus(
		@Param('id') id: string,
	): Promise<{ order: IOrder; payment: IPayment | null } | null> {
		return this.orderService.findWithPayment(id);
	}
}
