import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

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
    login: (accessToken: string, refreshToken: string, userData: User) => void;
    logout: () => void;
    updateUser: (userData: User) => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Check local storage for existing session
        const storedToken = localStorage.getItem('accessToken');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const login = (accessToken: string, refreshToken: string, userData: User) => {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setToken(accessToken);
        setUser(userData);
        if (userData.role === 'ADMIN') {
            navigate('/admin');
        } else {
            navigate('/');
        }
    };

    const logout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('votedPolls');
        setToken(null);
        setUser(null);
        navigate('/login');
    };

    const updateUser = (userData: User) => {
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, updateUser, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
