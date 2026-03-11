import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { KeyRound, Mail, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await authService.forgotPassword(email);
            if (response.status === 200) {
                navigate('/reset-password', { 
                    state: { 
                        email, 
                        message: 'OTP has been sent to your email. Check your inbox and use the code to reset your password.' 
                    } 
                });
            } else {
                setError(response.message || 'Failed to send OTP');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to send OTP. Please check the email address.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <div className="glass-panel w-full max-w-md p-10 rounded-3xl transition-all duration-500 hover:shadow-pink-500/20 relative overflow-hidden">
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 rounded-full bg-pink-500/10 blur-2xl"></div>
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 rounded-full bg-purple-500/10 blur-2xl"></div>

                <div className="relative text-center mb-10">
                    <div className="w-16 h-16 bg-gradient-to-tr from-pink-500/20 to-purple-500/20 border border-pink-500/20 rounded-2xl shadow-inner flex items-center justify-center mx-auto mb-5 transform rotate-3">
                        <KeyRound className="w-8 h-8 text-pink-400" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-white mb-3 tracking-tight">Forgot Password?</h1>
                    <p className="text-pink-100/70 font-medium text-sm px-4">Enter your registered email and we'll send you an OTP to reset your password.</p>
                </div>

                {error && (
                    <div className="relative overflow-hidden bg-red-500/10 border border-red-500/20 rounded-xl mb-6 p-4 flex items-start gap-3">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500/50"></div>
                        <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                        <p className="text-red-200 text-sm font-medium leading-relaxed">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-pink-50 uppercase tracking-widest ml-1 opacity-90">Email Address</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-white/40 group-focus-within:text-pink-400 transition-colors" />
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-11 pr-5 py-3.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-white placeholder-white/30 focus:outline-none focus:border-pink-500/50 focus:bg-white/10 focus:ring-4 focus:ring-pink-500/10 transition-all font-medium"
                                placeholder="name@example.com"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !email}
                        className="flex items-center justify-center gap-2 w-full py-3.5 px-4 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(236,72,153,0.2)] hover:shadow-[0_0_25px_rgba(236,72,153,0.3)] transition-all transform hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-70 disabled:hover:translate-y-0 disabled:cursor-not-allowed uppercase tracking-wider text-sm mt-8"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Sending OTP...</span>
                            </>
                        ) : (
                            'Send Reset OTP'
                        )}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-white/10 text-center">
                    <Link to="/login" className="inline-flex items-center gap-2 text-pink-100/60 hover:text-white text-sm font-medium transition-colors group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Back to Sign In
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
