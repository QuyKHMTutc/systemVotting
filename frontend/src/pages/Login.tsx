import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/auth.service';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [needsVerification, setNeedsVerification] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setNeedsVerification(false);
        setLoading(true);

        try {
            const response = await authService.login({ email, password });

            if (response.status === 200 && response.data) {
                const tokenPayload = JSON.parse(atob(response.data.accessToken.split('.')[1]));
                const userData = {
                    id: tokenPayload.id || 0,
                    username: tokenPayload.username || tokenPayload.sub || '',
                    email: email,
                    avatarUrl: tokenPayload.avatarUrl || '',
                    role: tokenPayload.role || 'USER'
                };

                login(response.data.accessToken, response.data.refreshToken, userData);
            } else {
                setError(response.message || 'Login failed');
            }
        } catch (err: any) {
            const msg: string = err.response?.data?.message || '';
            // Spring Security returns "User is disabled" when isEnabled() returns false
            if (msg.toLowerCase().includes('disabled') || msg.toLowerCase().includes('not enabled') || msg.toLowerCase().includes('verified')) {
                setNeedsVerification(true);
                setError('Your email is not verified yet. Please check your email for the OTP code.');
            } else {
                setError(msg || 'Invalid username or password');
            }
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
                        {needsVerification && (
                            <div className="mt-2">
                                <Link
                                    to="/register"
                                    state={{ email, stage: 'verify' }}
                                    className="inline-block mt-1 px-4 py-1.5 bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/50 text-pink-200 rounded-lg text-xs font-semibold transition-colors"
                                >
                                    Verify Email →
                                </Link>
                            </div>
                        )}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-pink-50 mb-2 uppercase tracking-wide">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-5 py-3.5 rounded-xl bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400 transition-all font-medium"
                            placeholder="Enter your email address"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-pink-50 mb-2 uppercase tracking-wide">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-5 py-3.5 rounded-xl bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400 transition-all font-medium pr-12"
                                placeholder="Enter your password"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                            >
                                {showPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                )}
                            </button>
                        </div>
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

                <div className="mt-6 flex items-center justify-center space-x-2">
                    <div className="h-px bg-white/20 w-1/4"></div>
                    <span className="text-sm text-pink-100/60 font-medium uppercase tracking-wider">Or continue with</span>
                    <div className="h-px bg-white/20 w-1/4"></div>
                </div>

                <div className="mt-6 flex justify-center">
                    <GoogleLogin
                        onSuccess={async (credentialResponse) => {
                            if (credentialResponse.credential) {
                                try {
                                    setLoading(true);
                                    setError('');
                                    const res = await authService.loginWithGoogle(credentialResponse.credential);
                                    if (res.status === 200 && res.data) {
                                        const tokenPayload = JSON.parse(atob(res.data.accessToken.split('.')[1]));
                                        const userData = {
                                            id: tokenPayload.id || 0,
                                            username: tokenPayload.username || tokenPayload.sub || '',
                                            email: tokenPayload.email || '',
                                            avatarUrl: tokenPayload.avatarUrl || '',
                                            role: tokenPayload.role || 'USER'
                                        };
                                        login(res.data.accessToken, res.data.refreshToken, userData);
                                        navigate('/');
                                    } else {
                                        setError(res.message || 'Google login failed');
                                    }
                                } catch (err: any) {
                                    setError(err.response?.data?.message || 'Google login failed');
                                } finally {
                                    setLoading(false);
                                }
                            }
                        }}
                        onError={() => {
                            setError('Google login failed');
                        }}
                        useOneTap
                        theme="filled_black"
                        shape="pill"
                    />
                </div>

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
