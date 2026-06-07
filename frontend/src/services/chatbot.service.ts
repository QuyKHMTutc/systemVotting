import { API_BASE_URL } from '../utils/constants';
import { getMemoryToken } from './api';

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
  async sendMessageStream(messages: ChatMessage[], onChunk: (text: string) => void): Promise<void> {
    const token = getMemoryToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/chatbot/chat/stream`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ messages })
    });

    if (!response.ok) {
      const errText = await response.text();
      let errMsg = 'Xin lỗi, đã có lỗi kết nối.';
      try {
        const errObj = JSON.parse(errText);
        if (errObj.message) errMsg = errObj.message;
      } catch (e) { }
      throw new Error(errMsg);
    }

    if (!response.body) throw new Error('ReadableStream not supported in this browser.');

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let done = false;
    let buffer = '';

    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) {
        buffer += decoder.decode(value, { stream: true });
        
        // Split by double newline (SSE event separator), robust to CRLF
        const parts = buffer.split(/\r?\n\r?\n/);
        buffer = parts.pop() || ''; // Keep the last incomplete part in the buffer

        for (const part of parts) {
          if (part.startsWith('event:error')) {
            const dataMatch = part.match(/data:(.*)/s);
            if (dataMatch) throw new Error(dataMatch[1].trim());
          } else if (part.includes('data:')) {
            // Find the data line
            const dataMatch = part.match(/data:(.*)/);
            if (dataMatch) {
              try {
                const jsonObj = JSON.parse(dataMatch[1].trim());
                if (jsonObj.text) {
                  onChunk(jsonObj.text);
                }
              } catch (e) {
                // Ignore parse errors for incomplete JSON or keep appending
              }
            }
          }
        }
      }
    }
  },
};
