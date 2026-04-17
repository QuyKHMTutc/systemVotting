import api from './api';

export interface PaymentHistory {
  id: number;
  txnRef: string;
  amount: number;
  targetPlan: 'FREE' | 'GO' | 'PLUS';
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  createdAt: string;
}

export const paymentService = {
  getPaymentHistory: async (): Promise<PaymentHistory[]> => {
    const response = await api.get('/payments/history');
    return response.data.data;
  }
};
