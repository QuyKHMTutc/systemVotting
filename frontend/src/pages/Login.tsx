import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/auth.service';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await authService.login({ username, password });

            if (response.status === 200 && response.data) {
                // Decode token to get user info if backend doesnt send user directly.
                // Assuming backend token contains sub (which is id or username).
                // For now, let's just make a mock user object based on username since the payload is just token
                // Wait, the new backend returns {accessToken, refreshToken} in AuthResponseDTO without User.
                // We will decode the token manually here or fetch user profile. Let's just store a basic stub for now.
                const tokenPayload = JSON.parse(atob(response.data.accessToken.split('.')[1]));
                const userData = {
                    id: tokenPayload.id || 0,
                    username: tokenPayload.sub || username,
                    email: '', // Not in token
                    role: tokenPayload.role || 'USER'
                };

                login(response.data.accessToken, response.data.refreshToken, userData);
            } else {
                setError(response.message || 'Login failed');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid username or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="glass-panel w-full max-w-md p-10 rounded-3xl transition-all duration-500 hover:shadow-pink-500/20">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight">Welcome Back</h1>
                    <p className="text-pink-100/70 font-medium">Sign in to your account</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-3 rounded-lg mb-6 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-pink-50 mb-2 uppercase tracking-wide">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-5 py-3.5 rounded-xl bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400 transition-all font-medium"
                            placeholder="Enter your username"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-pink-50 mb-2 uppercase tracking-wide">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-5 py-3.5 rounded-xl bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400 transition-all font-medium"
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <Link to="/forgot-password" className="text-pink-300 hover:text-pink-200 transition-colors font-medium">
                            Forgot password?
                        </Link>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 px-4 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-pink-500/30 transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wider text-sm"
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <p className="mt-8 text-center text-pink-100/60 text-sm font-medium">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-white hover:text-pink-300 font-bold transition-colors">
                        Create account
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
