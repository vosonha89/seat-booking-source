import axios from 'axios';
import { ISeat } from '@seat-booking/shared-types';

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
};
