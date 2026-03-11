import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { ShieldCheck, Mail, Lock, KeyRound, Eye, EyeOff, AlertCircle, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';

const ResetPassword = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const [email] = useState((location.state as any)?.email || '');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState((location.state as any)?.message || '');
    const [loading, setLoading] = useState(false);
    
    const [countdown, setCountdown] = useState((location.state as any)?.message ? 60 : 0);
    const [resendLoading, setResendLoading] = useState(false);

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        if (countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [countdown]);

    const handleResendOtp = async () => {
        if (!email) return;
        setResendLoading(true);
        setError('');
        setSuccess('');
        try {
            const response = await authService.forgotPassword(email);
            if (response.status === 200) {
                setSuccess('OTP has been re-sent to your email.');
                setCountdown(60);
            } else {
                setError(response.message || 'Failed to resend OTP');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to resend OTP.');
        } finally {
            setResendLoading(false);
        }
    };

    // Auto-focus logic when navigating from forgot-password
    useEffect(() => {
        if (email && !otp) {
            // Give user a tiny bit of time to settle before focus shift
            const timer = setTimeout(() => {
                document.getElementById('otp-input')?.focus();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [email]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            const response = await authService.resetPassword({ email, otp, newPassword });
            if (response.status === 200) {
                setSuccess('Password reset successfully! Redirecting to login...');
                setTimeout(() => navigate('/login'), 2500);
            } else {
                setError(response.message || 'Failed to reset password');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid or expired OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const isFormValid = email.length > 0 && otp.length === 6 && newPassword.length >= 6 && confirmPassword.length >= 6;

    return (
        <div className="flex items-center justify-center min-h-screen py-12 px-4">
            <div className="glass-panel w-full max-w-md p-10 rounded-3xl transition-all duration-500 hover:shadow-pink-500/20 relative overflow-hidden">
                {/* Decorative background element */}
                <div className="absolute top-0 left-0 -ml-16 -mt-16 w-32 h-32 rounded-full bg-purple-500/10 blur-2xl"></div>
                <div className="absolute bottom-0 right-0 -mr-16 -mb-16 w-32 h-32 rounded-full bg-pink-500/10 blur-2xl"></div>

                <div className="relative text-center mb-10">
                    <div className="w-16 h-16 bg-gradient-to-tr from-purple-500/20 to-pink-500/20 border border-purple-500/20 rounded-2xl shadow-inner flex items-center justify-center mx-auto mb-5 transform -rotate-3">
                        <ShieldCheck className="w-8 h-8 text-purple-400" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-white mb-3 tracking-tight">Reset Password</h1>
                    <p className="text-pink-100/70 font-medium text-sm px-2">Enter the OTP sent to your email and create a new password.</p>
                </div>

                {error && (
                    <div className="relative overflow-hidden bg-red-500/10 border border-red-500/20 rounded-xl mb-6 p-4 flex items-start gap-3">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500/50"></div>
                        <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                        <p className="text-red-200 text-sm font-medium leading-relaxed">{error}</p>
                    </div>
                )}

                {success && (
                    <div className="relative overflow-hidden bg-emerald-500/10 border border-emerald-500/20 rounded-xl mb-6 p-4 flex items-center gap-3">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500/50"></div>
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        <p className="text-emerald-200 text-sm font-medium">{success}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5 relative">
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-pink-50 uppercase tracking-widest ml-1 opacity-90">Email Address</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-white/40 group-focus-within:text-pink-400 transition-colors" />
                            </div>
                            <input
                                type="email"
                                value={email}
                                readOnly
                                className="w-full pl-11 pr-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white/50 cursor-not-allowed focus:outline-none transition-all font-medium text-sm"
                                placeholder="name@example.com"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="block text-xs font-bold text-pink-50 uppercase tracking-widest ml-1 opacity-90">6-Digit OTP</label>
                            <button
                                type="button"
                                onClick={handleResendOtp}
                                disabled={countdown > 0 || resendLoading || !email || loading}
                                className="text-xs font-bold text-pink-300 hover:text-pink-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors uppercase"
                            >
                                {resendLoading ? 'Sending...' : countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
                            </button>
                        </div>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <KeyRound className="h-5 w-5 text-white/40 group-focus-within:text-pink-400 transition-colors" />
                            </div>
                            <input
                                id="otp-input"
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                className="w-full pl-11 pr-5 py-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-white placeholder-white/30 focus:outline-none focus:border-pink-500/50 focus:bg-white/10 focus:ring-4 focus:ring-pink-500/10 transition-all font-bold text-center text-xl tracking-[0.5em]"
                                placeholder="------"
                                maxLength={6}
                                required
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-pink-50 uppercase tracking-widest ml-1 opacity-90">New Password</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-white/40 group-focus-within:text-pink-400 transition-colors" />
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full pl-11 pr-12 py-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-white placeholder-white/30 focus:outline-none focus:border-pink-500/50 focus:bg-white/10 focus:ring-4 focus:ring-pink-500/10 transition-all font-medium text-sm"
                                placeholder="Minimum 6 characters"
                                required
                                minLength={6}
                                disabled={loading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                disabled={loading}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-white/40 hover:text-white/80 transition-colors rounded-lg hover:bg-white/10 disabled:opacity-50"
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-pink-50 uppercase tracking-widest ml-1 opacity-90">Confirm Password</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <ShieldCheck className="h-5 w-5 text-white/40 group-focus-within:text-pink-400 transition-colors" />
                            </div>
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full pl-11 pr-12 py-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-white placeholder-white/30 focus:outline-none focus:border-pink-500/50 focus:bg-white/10 focus:ring-4 focus:ring-pink-500/10 transition-all font-medium text-sm"
                                placeholder="Confirm new password"
                                required
                                disabled={loading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                disabled={loading}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-white/40 hover:text-white/80 transition-colors rounded-lg hover:bg-white/10 disabled:opacity-50"
                                tabIndex={-1}
                            >
                                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !isFormValid}
                        className="flex items-center justify-center gap-2 w-full py-3.5 px-4 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(236,72,153,0.2)] hover:shadow-[0_0_25px_rgba(236,72,153,0.3)] transition-all transform hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-70 disabled:hover:translate-y-0 disabled:cursor-not-allowed uppercase tracking-wider text-sm mt-8"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Resetting...</span>
                            </>
                        ) : (
                            'Reset Password'
                        )}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-white/10 text-center flex items-center justify-between">
                    <Link to="/forgot-password" className="inline-flex items-center gap-2 text-pink-100/60 hover:text-white text-sm font-medium transition-colors group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Back to Forgot Password
                    </Link>
                    <Link to="/login" className="text-pink-300 hover:text-pink-200 text-sm font-bold transition-colors">
                        Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
