/**
 * Dependency injection tokens for the order module.
 */

/**
 * Token for injecting the order repository.
 */
export const IOrderRepositorySymbol = Symbol('IOrderRepository');

/**
 * Token for injecting the payment repository.
 */
export const IPaymentRepositorySymbol = Symbol('IPaymentRepository');

/**
 * Token for injecting the order service.
 */
export const IOrderServiceSymbol = Symbol('IOrderService');
