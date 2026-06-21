import { DataSource } from 'typeorm';
import { AuditOrder } from './entities/audit-order.entity';
import { AuditPayment } from './entities/audit-payment.entity';

export { AuditOrder, AuditPayment };

/**
 * TypeORM DataSource for MongoDB database connection.
 * Configured for the seat booking audit trail data (audit_orders, audit_payments).
 */
export const AppDataSource = new DataSource({
	type: 'mongodb',
	url: process.env['MONGO_URI'] ?? 'mongodb://localhost:27017/seat_booking_audit',
	useNewUrlParser: true,
	useUnifiedTopology: true,
	synchronize: true,
	logging: false,
	entities: [AuditOrder, AuditPayment],
});

/**
 * Initialize the MongoDB database connection.
 * @throws {Error} If the connection cannot be established.
 */
export async function connectMongo(): Promise<void> {
	await AppDataSource.initialize();
}
