import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { setMemoryToken, getMemoryToken } from '../services/api';

interface User {
    id: number;
    username: string;
    email: string;
    avatarUrl?: string;
    role: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (accessToken: string, refreshToken: string | null, userData: User) => void;
    logout: () => void;
    updateUser: (userData: User) => void;
    isAuthenticated: boolean;
    isInitializing: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [isInitializing, setIsInitializing] = useState(true);
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(() => {
        try {
            const storedUser = localStorage.getItem('user');
            return storedUser ? JSON.parse(storedUser) : null;
        } catch (e) {
            console.error('Failed to parse user from local storage:', e);
            localStorage.removeItem('user');
            return null;
        }
    });
    const navigate = useNavigate();

    const login = (accessToken: string, _refreshToken: string | null, userData: User) => {
        setMemoryToken(accessToken);
        setToken(accessToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        if (userData.role === 'ADMIN') {
            navigate('/admin');
        } else {
            navigate('/');
        }
    };

    const handleLogoutState = () => {
        setMemoryToken(null);
        setToken(null);
        localStorage.removeItem('user');
        localStorage.removeItem('votedPolls');
        setUser(null);
        navigate('/login');
    };

    const logout = () => {
        authService.logout()
            .catch(console.error)
            .finally(handleLogoutState);
    };

    const updateUser = (userData: User) => {
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
    };

    useEffect(() => {
        const interceptLogout = () => {
            handleLogoutState();
        };
        window.addEventListener('auth-logout', interceptLogout);
        return () => window.removeEventListener('auth-logout', interceptLogout);
    }, [navigate]);

    useEffect(() => {
        authService.me()
            .then(res => {
                if (res?.code === 200 && res.data) {
                    const currentToken = getMemoryToken();
                    if (currentToken) {
                        setToken(currentToken);
                    }
                    updateUser(res.data);
                }
            })
            .catch(err => {
                console.error('Failed to sync user profile:', err);
                setToken(null);
                setUser(null);
                localStorage.removeItem('user');
            })
            .finally(() => {
                setIsInitializing(false);
            });
    }, []);

    return (
        <AuthContext.Provider value={{ user, token, login, logout, updateUser, isAuthenticated: !!token, isInitializing }}>
            {children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
