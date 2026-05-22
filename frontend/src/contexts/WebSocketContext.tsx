import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Client } from '@stomp/stompjs';
import { useAuth } from './AuthContext';
import { getMemoryToken } from '../services/api';
import { notificationService } from '../services/notification.service';
import type { Notification } from '../services/notification.service';
import type { IMessage } from '@stomp/stompjs';

const WS_URL = import.meta.env.PROD
  ? 'wss://systemvotting.onrender.com/ws'
  : 'ws://localhost:8080/ws';

interface WebSocketContextType {
    client: Client | null;
    notifications: Notification[];
    unreadCount: number;
    setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
    setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider = ({ children }: { children: ReactNode }) => {
    const { isAuthenticated, token } = useAuth();
    const [client, setClient] = useState<Client | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // Keep a stable ref to the client so subscriptions can be set up in onConnect
    const stompClientRef = useRef<Client | null>(null);

    useEffect(() => {
        // Clean up previous client if exists
        if (stompClientRef.current) {
            stompClientRef.current.deactivate();
            stompClientRef.current = null;
            setClient(null);
        }

        // Always connect WebSocket — public topics (e.g. /topic/polls/events) must be
        // accessible even for unauthenticated visitors (e.g. the Explore page).
        // When authenticated we also include the Bearer token so the server can
        // authorise user-specific queues (/user/queue/notifications).
        const newClient = new Client({
            brokerURL: WS_URL,
            reconnectDelay: 5000,
            // Always read the latest token at connection time (including reconnects)
            beforeConnect: async () => {
                const currentToken = getMemoryToken();
                if (currentToken) {
                    newClient.connectHeaders = { Authorization: `Bearer ${currentToken}` };
                } else {
                    // Unauthenticated connection — no auth header needed for public topics
                    newClient.connectHeaders = {};
                }
            },
            onConnect: () => {
                console.log('[WS] Connected successfully');

                // Subscribe to personal notification queue only when authenticated
                if (isAuthenticated) {
                    newClient.subscribe('/user/queue/notifications', (message: IMessage) => {
                        console.log('[WS] Received notification:', message.body);
                        if (message.body) {
                            try {
                                const newNotif: Notification = JSON.parse(message.body);
                                setNotifications(prev => {
                                    if (prev.some(n => n.id === newNotif.id)) return prev;
                                    return [newNotif, ...prev];
                                });
                                setUnreadCount(prev => prev + 1);
                            } catch (e) {
                                console.error('[WS] Failed to parse notification:', e);
                            }
                        }
                    });
                }

                setClient(newClient);
            },
            onDisconnect: () => {
                console.log('[WS] Disconnected');
                setClient(null);
            },
            onStompError: (frame) => {
                console.error('[WS] STOMP Error:', frame.headers['message']);
            },
            onWebSocketError: (evt) => {
                console.error('[WS] WebSocket Error:', evt);
            },
        });

        stompClientRef.current = newClient;
        newClient.activate();

        return () => {
            newClient.deactivate();
            stompClientRef.current = null;
            setClient(null);
        };
    }, [isAuthenticated, token]); // Re-connect when auth state or token changes

    // Fetch notifications from server when authenticated
    useEffect(() => {
        if (isAuthenticated) {
            notificationService.getUnreadCount().then(setUnreadCount).catch(console.error);
            notificationService.getMyNotifications(0, 100)
                .then(page => setNotifications(page.content))
                .catch(console.error);
        } else {
            setNotifications([]);
            setUnreadCount(0);
        }
    }, [isAuthenticated]);

    return (
        <WebSocketContext.Provider value={{ client, notifications, unreadCount, setNotifications, setUnreadCount }}>
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

// eslint-disable-next-line react-refresh/only-export-components
export const useGlobalNotifications = () => {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useGlobalNotifications must be used within a WebSocketProvider');
    }
    return {
        notifications: context.notifications,
        unreadCount: context.unreadCount,
        setNotifications: context.setNotifications,
        setUnreadCount: context.setUnreadCount
    };
};
