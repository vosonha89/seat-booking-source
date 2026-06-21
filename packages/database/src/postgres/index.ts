import { DataSource } from 'typeorm';
import { Seat } from './entities/seat.entity';
import { Order } from './entities/order.entity';
import { WebhookLog } from './entities/webhook-log.entity';

export { Seat, Order, WebhookLog };

/**
 * TypeORM DataSource for PostgreSQL database connection.
 * Configured for the seat booking transactional data (seats, orders, webhook_logs).
 */
export const PostgresDataSource = new DataSource({
	type: 'postgres',
	host: process.env['POSTGRES_HOST'] ?? 'localhost',
	port: Number(process.env['POSTGRES_PORT'] ?? 5432),
	database: process.env['POSTGRES_DB'] ?? 'seat_booking',
	username: process.env['POSTGRES_USER'] ?? 'postgres',
	password: process.env['POSTGRES_PASSWORD'] ?? 'postgres',
	synchronize: true,
	logging: false,
	entities: [Seat, Order, WebhookLog],
});

/**
 * Initialize the PostgreSQL database connection.
 * @throws {Error} If the connection cannot be established.
 */
export async function connectPostgres(): Promise<void> {
	await PostgresDataSource.initialize();
}
