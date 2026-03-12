import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/auth.service';
import OtpInput from '../components/OtpInput';
import PasswordStrength from '../components/PasswordStrength';
import { User, Mail, Lock, Eye, EyeOff, ShieldCheck, MailCheck, Check, Fingerprint, Activity, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';

type Stage = 'register' | 'verify';

const Register = () => {
    const [stage, setStage] = useState<Stage>('register');

    // Register form state
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Form logic state
    const [emailError, setEmailError] = useState('');

    // OTP form state
    const [otp, setOtp] = useState('');

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const navigate = useNavigate();

    // Shake animation state
    const [isShaking, setIsShaking] = useState(false);

    const triggerShake = () => {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 400); // matches 0.4s animation
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

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!validateEmail(email)) {
            triggerShake();
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            triggerShake();
            return;
        }

        if (!agreeTerms) {
            setError('You must agree to the Terms of Service and Privacy Policy.');
            triggerShake();
            return;
        }

        setLoading(true);

        try {
            const response = await authService.register({ username, email, password });

            if (response.status === 200 || response.status === 201) {
                setSuccess('Account created! Please check your email for the OTP verification code.');
                setStage('verify');
                startResendCooldown();
            } else {
                setError(response.message || 'Registration failed');
                triggerShake();
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed. Try a different username/email.');
            triggerShake();
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await authService.verifyRegistration(email, otp);

            if (response.status === 200) {
                setSuccess('Email verified! Redirecting to dashboard...');
                
                // Fire confetti on success
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#ec4899', '#a855f7', '#3b82f6'] // Tailwind pink-500, purple-500, blue-500
                });

                // Normally we would log the user in here directly (receive token from verify API)
                // But for now, we'll redirect to login as per current backend flow
                setTimeout(() => navigate('/login'), 3000);
            } else {
                setError(response.message || 'Verification failed');
                triggerShake();
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid or expired OTP. Please try again.');
            triggerShake();
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendCooldown > 0) return;
        setError('');
        setLoading(true);

        try {
            await authService.resendRegistrationOtp(email);
            setSuccess('A new OTP has been sent to your email.');
            startResendCooldown();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to resend OTP.');
        } finally {
            setLoading(false);
        }
    };

    const startResendCooldown = () => {
        setResendCooldown(60);
        const interval = setInterval(() => {
            setResendCooldown(prev => {
                if (prev <= 1) { clearInterval(interval); return 0; }
                return prev - 1;
            });
        }, 1000);
    };

    // V2 Split-screen layout
    return (
        <div className="min-h-screen flex w-full">
            
            {/* Left/Top Content: The Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 lg:p-12 z-10">
                <div className={`glass-panel w-full max-w-md p-6 sm:p-10 rounded-2xl sm:rounded-3xl transition-all duration-300 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
                    {stage === 'register' ? (
                        <div className={`transition-all ${isShaking ? 'animate-shake' : ''}`}>
                            <div className="mb-8">
                                <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2 tracking-tight">Create Account</h1>
                                <p className="text-pink-100/80 font-medium">Join the voting community today.</p>
                            </div>

                            <div className={`transition-all duration-300 overflow-hidden ${error ? 'max-h-24 opacity-100 mb-6' : 'max-h-0 opacity-0'}`}>
                                <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-3 rounded-xl text-sm text-center font-medium">
                                    {error}
                                </div>
                            </div>

                            <form onSubmit={handleRegister} className="space-y-6">
                                <div className="space-y-1.5">
                                    <label htmlFor="username" className="block text-xs font-bold text-pink-100 uppercase tracking-widest ml-1">Username</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <User className="h-5 w-5 text-white/50 group-focus-within:text-pink-400 transition-colors" />
                                        </div>
                                        <input
                                            id="username"
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="w-full pl-11 pr-5 py-3.5 rounded-xl bg-white/5 border border-white/20 hover:border-white/30 text-white placeholder-white/40 focus:outline-none focus:border-pink-500 focus:bg-white/10 focus:shadow-[0_0_15px_rgba(236,72,153,0.4)] transition-all font-medium"
                                            placeholder="Choose a username"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
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

                                <div className="space-y-1.5">
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
                                            placeholder="Create a strong password"
                                            required
                                            minLength={6}
                                        />
                                        <button
                                            type="button"
                                            aria-label="Toggle password visibility"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-white/50 hover:text-white transition-all transform active:scale-90 rounded-lg hover:bg-white/10"
                                            tabIndex={-1}
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                                        </button>
                                    </div>
                                    <PasswordStrength password={password} />
                                </div>
                                
                                <div className="space-y-1.5">
                                    <label htmlFor="confirmPassword" className="block text-xs font-bold text-pink-100 uppercase tracking-widest ml-1">Confirm Password</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <ShieldCheck className="h-5 w-5 text-white/50 group-focus-within:text-pink-400 transition-colors" />
                                        </div>
                                        <input
                                            id="confirmPassword"
                                            type={showConfirmPassword ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full pl-11 pr-12 py-3.5 rounded-xl bg-white/5 border border-white/20 hover:border-white/30 text-white placeholder-white/40 focus:outline-none focus:border-pink-500 focus:bg-white/10 focus:shadow-[0_0_15px_rgba(236,72,153,0.4)] transition-all font-medium"
                                            placeholder="Confirm your password"
                                            required
                                            minLength={6}
                                        />
                                        <button
                                            type="button"
                                            aria-label="Toggle confirm password visibility"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-white/50 hover:text-white transition-all transform active:scale-90 rounded-lg hover:bg-white/10"
                                            tabIndex={-1}
                                        >
                                            {showConfirmPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 pt-2">
                                    <div className="flex items-center h-5 mt-1">
                                        <button
                                            type="button"
                                            role="checkbox"
                                            aria-checked={agreeTerms}
                                            onClick={() => setAgreeTerms(!agreeTerms)}
                                            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                                                agreeTerms 
                                                ? 'bg-pink-500 border-pink-500 text-white shadow-[0_0_10px_rgba(236,72,153,0.5)]' 
                                                : 'bg-white/5 border-white/20 hover:border-pink-500/50'
                                            }`}
                                        >
                                            {agreeTerms && <Check className="w-3.5 h-3.5" />}
                                        </button>
                                    </div>
                                    <div className="text-sm">
                                        <span className="text-pink-100/70 font-medium select-none cursor-pointer" onClick={() => setAgreeTerms(!agreeTerms)}>
                                            I agree to the{' '}
                                        </span>
                                        <Link to="/terms" className="text-pink-300 hover:text-pink-200 font-bold hover:underline transition-all">Terms of Service</Link>
                                        <span className="text-pink-100/70 font-medium"> and </span>
                                        <Link to="/privacy" className="text-pink-300 hover:text-pink-200 font-bold hover:underline transition-all">Privacy Policy</Link>
                                        <span className="text-pink-100/70 font-medium">.</span>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-4 px-4 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(236,72,153,0.3)] hover:shadow-[0_0_25px_rgba(236,72,153,0.5)] transition-all transform hover:-translate-y-0.5 active:scale-[0.98] uppercase tracking-wider text-sm mt-4"
                                >
                                    {loading ? 'Creating...' : 'Create Account'}
                                </button>
                            </form>

                            <p className="mt-8 text-center text-pink-100/80 text-sm font-medium">
                                Already have an account?{' '}
                                <Link to="/login" className="text-white hover:text-pink-300 hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.5)] font-bold transition-all">
                                    Sign In here
                                </Link>
                            </p>
                        </div>
                    ) : (
                        <div className={`transition-all ${isShaking ? 'animate-shake' : ''}`}>
                            <div className="relative text-center mb-8 sm:mb-10">
                                <div className="w-16 h-16 bg-gradient-to-tr from-pink-500/20 to-purple-500/20 border border-pink-500/20 rounded-2xl shadow-inner flex items-center justify-center mx-auto mb-5 transform rotate-3">
                                    <MailCheck className="w-8 h-8 text-pink-400" />
                                </div>
                                <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2 tracking-tight">Check Your Email</h1>
                                <p className="text-pink-100 font-medium text-sm">
                                    We sent a 6-digit code to<br />
                                    <span className="text-pink-300 font-bold">{email}</span>
                                </p>
                            </div>

                            <div className={`transition-all duration-300 overflow-hidden ${error ? 'max-h-24 opacity-100 mb-6' : 'max-h-0 opacity-0'}`}>
                                <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-3 rounded-xl text-sm text-center font-medium">
                                    {error}
                                </div>
                            </div>

                            <div className={`transition-all duration-300 overflow-hidden ${success ? 'max-h-24 opacity-100 mb-6' : 'max-h-0 opacity-0'}`}>
                                <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-200 p-3 rounded-xl text-sm text-center font-medium">
                                    {success}
                                </div>
                            </div>

                            <form onSubmit={handleVerify} className="space-y-7 relative">
                                <div className="space-y-4">
                                    <label className="block text-xs font-bold text-pink-100 text-center uppercase tracking-widest ml-1">Verification Code</label>
                                    <div className="flex justify-center">
                                        <OtpInput value={otp} onChange={setOtp} length={6} />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={otp.length < 6}
                                    className="w-full py-4 px-4 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(236,72,153,0.3)] hover:shadow-[0_0_25px_rgba(236,72,153,0.5)] transition-all transform hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-70 disabled:hover:translate-y-0 disabled:cursor-not-allowed uppercase tracking-wider text-sm"
                                >
                                    Verify Email
                                </button>
                            </form>

                            <div className="mt-8 text-center">
                                <p className="text-pink-100/80 text-sm font-medium">
                                    Didn't receive the code?{' '}
                                    <button
                                        onClick={handleResend}
                                        disabled={resendCooldown > 0}
                                        className="text-pink-300 hover:text-pink-200 hover:drop-shadow-[0_0_5px_rgba(244,114,182,0.5)] font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                                    </button>
                                </p>
                            </div>

                            <div className="mt-6 text-center">
                                <button
                                    onClick={() => { setStage('register'); setError(''); setSuccess(''); }}
                                    className="text-white/60 hover:text-white hover:drop-shadow-[0_0_3px_rgba(255,255,255,0.3)] text-sm font-medium transition-all"
                                >
                                    ← Back to registration (Preserves Form)
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Side: Branding Hero (Hidden on Mobile) */}
            <div className="hidden lg:flex w-1/2 relative bg-black/20 backdrop-blur-sm border-l border-white/5 flex-col justify-center items-center p-12 overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-600/30 rounded-full blur-[100px] mix-blend-screen" />
                    <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-600/20 rounded-full blur-[120px] mix-blend-screen" />
                </div>
                
                <div className="z-10 max-w-lg">
                    <div className="glass-panel p-6 rounded-2xl inline-block mb-8 rotate-3 hover:rotate-0 transition-transform duration-500 shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
                        <Fingerprint className="w-16 h-16 text-pink-400" />
                    </div>
                    <h2 className="text-5xl font-black text-white mb-6 leading-tight">Secure & Seamless<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">Voting Platform</span></h2>
                    <p className="text-lg text-pink-100/70 mb-10 leading-relaxed font-medium">
                        Join millions of users who rely on our enterprise-grade security to manage and participate in critical consensus events globally.
                    </p>
                    
                    <div className="grid grid-cols-2 gap-6">
                        <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md">
                            <Activity className="w-8 h-8 text-purple-400 mb-3" />
                            <h3 className="text-white font-bold mb-1">Real-time Data</h3>
                            <p className="text-sm text-pink-100/60 font-medium">Watch results update instantly.</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md">
                            <Zap className="w-8 h-8 text-pink-400 mb-3" />
                            <h3 className="text-white font-bold mb-1">High Speed</h3>
                            <p className="text-sm text-pink-100/60 font-medium">Optimized for vast user loads.</p>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default Register;
