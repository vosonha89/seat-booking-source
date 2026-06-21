-- Seat Booking System initial schema

-- Seats
CREATE TABLE IF NOT EXISTS seats (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	label VARCHAR(10) NOT NULL,
	status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
	reserved_by VARCHAR(255),
	reserved_at TIMESTAMPTZ,
	created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	user_id VARCHAR(255) NOT NULL,
	seat_id UUID NOT NULL REFERENCES seats(id),
	account_id VARCHAR(255) NOT NULL,
	status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
	idempotency_key VARCHAR(255) UNIQUE NOT NULL,
	created_at TIMESTAMPTZ DEFAULT NOW(),
	updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook logs for idempotency
CREATE TABLE IF NOT EXISTS webhook_logs (
	webhook_id VARCHAR(255) PRIMARY KEY,
	order_id UUID NOT NULL,
	processed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed 3 fixed seats
INSERT INTO seats (label, status)
VALUES
	('A1', 'AVAILABLE'),
	('A2', 'AVAILABLE'),
	('A3', 'AVAILABLE')
ON CONFLICT DO NOTHING;

