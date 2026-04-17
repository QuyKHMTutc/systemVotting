import api from './api';

export const vnPayService = {
  createPaymentUrl: async (planType: 'GO' | 'PLUS' | 'PRO'): Promise<string> => {
    const response = await api.post('/payments/create-url', { planType });
    return response.data.data.paymentUrl;
  }
};
