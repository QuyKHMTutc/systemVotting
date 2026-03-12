import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/auth.service';
import { Eye, EyeOff, Mail, Lock, LogIn, Activity, Fingerprint, Zap } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [needsVerification, setNeedsVerification] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const [emailError, setEmailError] = useState('');
    const [isShaking, setIsShaking] = useState(false);

    const triggerShake = () => {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 400); // match animation duration
    };

    const validateEmail = (emailStr: string) => {
        const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr);
        if (!isValid && emailStr.length > 0) {
            setEmailError('Vui lòng nhập email hợp lệ (vd: name@example.com)');
        } else {
            setEmailError('');
        }
        return isValid;
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
        if (emailError) validateEmail(e.target.value);
    };

    const handleEmailBlur = () => {
        validateEmail(email);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setNeedsVerification(false);
        
        if (!validateEmail(email)) {
            triggerShake();
            return;
        }

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
                navigate('/');
            } else {
                setError(response.message || 'Login failed');
                triggerShake();
            }
        } catch (err: any) {
            const msg: string = err.response?.data?.message || '';
            if (msg.toLowerCase().includes('disabled') || msg.toLowerCase().includes('not enabled') || msg.toLowerCase().includes('verified')) {
                setNeedsVerification(true);
                setError('Your email is not verified yet. Please check your email for the OTP code.');
            } else {
                setError(msg || 'Invalid username or password');
            }
            triggerShake();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex w-full">
            
            {/* Left/Top Content: The Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 lg:p-12 z-10">
                <div className={`glass-panel w-full max-w-md p-6 sm:p-10 rounded-2xl sm:rounded-3xl transition-all duration-500 hover:shadow-[0_0_30px_rgba(236,72,153,0.15)] relative overflow-hidden ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 rounded-full bg-pink-500/10 blur-2xl"></div>
                    
                    <div className={`transition-all ${isShaking ? 'animate-shake' : ''}`}>
                        <div className="relative text-center mb-8 sm:mb-10">
                            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2 sm:mb-3 tracking-tight">Welcome Back</h1>
                            <p className="text-pink-100 font-medium">Sign in to your account</p>
                        </div>

                        <div className={`transition-all duration-300 overflow-hidden ${error ? 'max-h-32 opacity-100 mb-6' : 'max-h-0 opacity-0'}`}>
                            <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-3 rounded-xl text-sm text-center font-medium">
                                {error}
                                {needsVerification && (
                                    <div className="mt-2 text-center">
                                        <Link
                                            to="/register"
                                            state={{ email, stage: 'verify' }}
                                            className="inline-block mt-1 px-4 py-2 bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/50 text-pink-100 rounded-lg text-xs font-bold transition-all hover:shadow-[0_0_10px_rgba(236,72,153,0.3)]"
                                        >
                                            Verify Email →
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-7 relative">
                            <div className="space-y-2">
                                <label htmlFor="email" className="block text-xs font-bold text-pink-100 uppercase tracking-widest ml-1">Email Address</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail className={`h-5 w-5 transition-colors ${emailError ? 'text-red-400' : 'text-white/50 group-focus-within:text-pink-400'}`} />
                                    </div>
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={handleEmailChange}
                                        onBlur={handleEmailBlur}
                                        className={`w-full pl-11 pr-5 py-3.5 rounded-xl bg-white/5 border text-white placeholder-white/40 focus:outline-none focus:bg-white/10 transition-all font-medium ${
                                            emailError 
                                            ? 'border-red-500/50 focus:border-red-500 focus:shadow-[0_0_15px_rgba(239,68,68,0.3)]' 
                                            : 'border-white/20 hover:border-white/30 focus:border-pink-500 focus:shadow-[0_0_15px_rgba(236,72,153,0.4)]'
                                        }`}
                                        placeholder="name@example.com"
                                        required
                                    />
                                </div>
                                <div className={`transition-all duration-300 overflow-hidden ${emailError ? 'max-h-10 opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <p className="text-red-400 text-xs font-medium ml-1 mt-1">{emailError}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="password" className="block text-xs font-bold text-pink-100 uppercase tracking-widest ml-1">Password</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-white/50 group-focus-within:text-pink-400 transition-colors" />
                                    </div>
                                    <input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-11 pr-12 py-3.5 rounded-xl bg-white/5 border border-white/20 hover:border-white/30 text-white placeholder-white/40 focus:outline-none focus:border-pink-500 focus:bg-white/10 focus:shadow-[0_0_15px_rgba(236,72,153,0.4)] transition-all font-medium"
                                        placeholder="Enter your password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        aria-label="Toggle password visibility"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-white/50 hover:text-white transition-all transform active:scale-90 rounded-lg hover:bg-white/10"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-end text-sm">
                                <Link to="/forgot-password" className="text-white/60 hover:text-white transition-all font-semibold">
                                    Forgot password?
                                </Link>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 px-4 flex justify-center items-center gap-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(236,72,153,0.3)] hover:shadow-[0_0_25px_rgba(236,72,153,0.5)] transition-all transform hover:-translate-y-0.5 active:scale-[0.98] uppercase tracking-wider text-sm mt-2"
                            >
                                <LogIn className="w-5 h-5" />
                                {loading ? 'Signing in...' : 'Sign In'}
                            </button>
                        </form>

                        <div className="mt-8 flex items-center justify-center space-x-3">
                            <div className="h-px bg-white/10 w-1/4"></div>
                            <span className="text-xs text-white/30 font-bold uppercase tracking-widest">Or continue with</span>
                            <div className="h-px bg-white/10 w-1/4"></div>
                        </div>

                        <div className="mt-6 flex justify-center w-full">
                            <div className="w-full sm:w-[80%] hover:scale-[1.02] transition-transform duration-300">
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
                                                    triggerShake();
                                                }
                                            } catch (err: any) {
                                                setError(err.response?.data?.message || 'Google login failed');
                                                triggerShake();
                                            } finally {
                                                setLoading(false);
                                            }
                                        }
                                    }}
                                    onError={() => {
                                        setError('Google login failed');
                                        triggerShake();
                                    }}
                                    useOneTap
                                    theme="filled_black"
                                    shape="pill"
                                    width="100%"
                                />
                            </div>
                        </div>

                        <p className="mt-8 text-center text-white/60 text-sm font-medium">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-white hover:text-pink-300 font-bold transition-all">
                                Create account
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Side: Branding Hero (Hidden on Mobile) */}
            <div className="hidden lg:flex w-1/2 relative bg-black/20 backdrop-blur-sm border-l border-white/5 flex-col justify-center items-center p-12 overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-600/30 rounded-full blur-[100px] mix-blend-screen" />
                    <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-600/20 rounded-full blur-[120px] mix-blend-screen" />
                </div>
                
                <div className="z-10 max-w-lg">
                    <div className="glass-panel p-6 rounded-2xl inline-block mb-8 -rotate-3 hover:rotate-0 transition-transform duration-500 shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
                        <Activity className="w-16 h-16 text-purple-400" />
                    </div>
                    <h2 className="text-5xl font-black text-white mb-6 leading-tight">Secure & Seamless<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">Voting Platform</span></h2>
                    <p className="text-lg text-pink-100/70 mb-10 leading-relaxed font-medium">
                        Join millions of users who rely on our enterprise-grade security to manage and participate in critical consensus events globally.
                    </p>
                    
                    <div className="grid grid-cols-2 gap-6">
                        <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md">
                            <Fingerprint className="w-8 h-8 text-pink-400 mb-3" />
                            <h3 className="text-white font-bold mb-1">Identity Verified</h3>
                            <p className="text-sm text-pink-100/60 font-medium">Bulletproof authentication logic.</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md">
                            <Zap className="w-8 h-8 text-purple-400 mb-3" />
                            <h3 className="text-white font-bold mb-1">High Speed</h3>
                            <p className="text-sm text-pink-100/60 font-medium">Optimized for vast user loads.</p>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default Login;
