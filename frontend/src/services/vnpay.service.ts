import api from './api';

export const vnPayService = {
  createPaymentUrl: async (planType: string, bankCode?: string): Promise<string> => {
    const response = await api.post('/payments/create-url', { planType, bankCode });
    return response.data.data.paymentUrl;
  }
};
