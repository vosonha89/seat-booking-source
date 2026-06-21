/**
 * Base application error class extending the native Error.
 */
export class AppError extends Error {
	/**
	 * Create an application error.
	 * @param message - Human-readable error message.
	 * @param code - Machine-readable error code.
	 * @param options - Optional native Error options.
	 */
	public constructor(
		message: string,
		public readonly code: string,
		options?: ErrorOptions,
	) {
		super(message, options);
		this.name = this.constructor.name;
	}
}

/**
 * Error thrown when a requested resource is not found.
 */
export class NotFoundError extends AppError {
	/**
	 * Create a not found error.
	 * @param resource - The type of resource that was not found.
	 * @param id - The identifier of the missing resource.
	 */
	public constructor(resource: string, id: string) {
		super(`${resource} with id "${id}" not found`, 'NOT_FOUND');
	}
}

/**
 * Error thrown when a conflict occurs (e.g., duplicate or concurrent modification).
 */
export class ConflictError extends AppError {
	/**
	 * Create a conflict error.
	 * @param message - Description of the conflict.
	 */
	public constructor(message: string) {
		super(message, 'CONFLICT');
	}
}

/**
 * Error thrown when a request with a given idempotency key has already been processed.
 */
export class IdempotencyError extends AppError {
	/**
	 * Create an idempotency error.
	 * @param key - The idempotency key that was already processed.
	 */
	public constructor(key: string) {
		super(`Request with key "${key}" already processed`, 'ALREADY_PROCESSED');
	}
}

