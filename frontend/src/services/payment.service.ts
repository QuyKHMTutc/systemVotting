import api from './api';
import type { PageResponse } from '../types/page';

export interface PaymentHistory {
  id: number;
  txnRef: string;
  amount: number;
  targetPlan: 'FREE' | 'GO' | 'PLUS' | 'PRO';
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  createdAt: string;
  expiresAt?: string | null;
}

export const paymentService = {
  getPaymentHistory: async (page = 0, size = 10): Promise<PageResponse<PaymentHistory>> => {
    const response = await api.get('/payments/history', { params: { page, size } });
    return response.data.data;
  }
};
