import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Client } from '@stomp/stompjs';
import { useAuth } from './AuthContext';
import { getMemoryToken } from '../services/api';

const WS_URL = import.meta.env.PROD
  ? 'wss://systemvotting.onrender.com/ws'
  : 'ws://localhost:8080/ws';

interface WebSocketContextType {
    client: Client | null;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider = ({ children }: { children: ReactNode }) => {
    const { isAuthenticated } = useAuth();
    const [client, setClient] = useState<Client | null>(null);

    useEffect(() => {
        const currentToken = getMemoryToken();
        const connectHeaders: any = {};
        if (currentToken) {
            connectHeaders.Authorization = `Bearer ${currentToken}`;
        }

        const newClient = new Client({
            brokerURL: WS_URL,
            connectHeaders,
            reconnectDelay: 5000,
            onConnect: () => {
                setClient(newClient);
            },
            onDisconnect: () => {
                setClient(null);
            },
            onStompError: (frame) => {
                console.error('[WS] STOMP Error:', frame.headers['message']);
            }
        });

        newClient.activate();

        return () => {
            newClient.deactivate();
        };
    }, [isAuthenticated]); // Re-connect only when auth state drastically changes

    return (
        <WebSocketContext.Provider value={{ client }}>
            {children}
        </WebSocketContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useGlobalWebSocket = () => {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useGlobalWebSocket must be used within a WebSocketProvider');
    }
    return context.client;
};
