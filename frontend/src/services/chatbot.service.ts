import api from './api';

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
}

export interface ChatResponse {
  content: string;
}

export const chatbotService = {
  async sendMessage(messages: ChatMessage[]): Promise<ChatResponse> {
    const response = await api.post('/chatbot/chat', { messages });
    return response.data.data;
  },
};
