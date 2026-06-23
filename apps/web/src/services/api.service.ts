import axios from 'axios';
import { ISeat, IOrder, OrderStatus } from '@seat-booking/shared-types';

const API_BASE_URL = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:3001';

const apiClient = axios.create({
	baseURL: API_BASE_URL,
	headers: {
		'Content-Type': 'application/json',
	},
});

export const apiService = {
	seats: {
		getAll: async (token?: string): Promise<ISeat[]> => {
			const headers: any = {};
			if (token) {
				headers.Authorization = `Bearer ${token}`;
			}
			const response = await apiClient.get('/api/seats', { headers });
			return response.data;
		},
	},
	orders: {
		create: async (seatId: string, token?: string): Promise<IOrder> => {
			const headers: any = {};
			if (token) {
				headers.Authorization = `Bearer ${token}`;
			}
			console.log('Calling /api/orders with:', { seatId, accountId: '1' });
			const response = await apiClient.post(
				'/api/orders',
				{ seatId, accountId: '1' }, // Temporary accountId for demo
				{ headers },
			);
			console.log('Order API response:', response);
			return response.data;
		},
		getStatus: async (orderId: string, token?: string): Promise<IOrder> => {
			const headers: any = {};
			if (token) {
				headers.Authorization = `Bearer ${token}`;
			}
			const response = await apiClient.get(`/api/orders/${orderId}`, { headers });
			return response.data;
		},
	},
};
