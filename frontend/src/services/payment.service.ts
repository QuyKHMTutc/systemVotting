import api from './api';

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
  getPaymentHistory: async (): Promise<PaymentHistory[]> => {
    const response = await api.get('/payments/history');
    return response.data.data;
  }
};
