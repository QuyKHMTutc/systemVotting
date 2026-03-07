import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/auth.service';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const response = await authService.forgotPassword(email);
            if (response.status === 200) {
                setSuccess('OTP has been sent to your email. Check your inbox and use the code to reset your password.');
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
        <div className="flex items-center justify-center min-h-screen">
            <div className="glass-panel w-full max-w-md p-10 rounded-3xl transition-all duration-500 hover:shadow-pink-500/20">
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-extrabold text-white mb-3 tracking-tight">Forgot Password?</h1>
                    <p className="text-pink-100/70 font-medium text-sm">Enter your email and we'll send you a reset OTP</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-3 rounded-lg mb-6 text-sm text-center">
                        {error}
                    </div>
                )}

                {success ? (
                    <div className="space-y-4">
                        <div className="bg-green-500/10 border border-green-500/50 text-green-200 p-4 rounded-lg text-sm text-center">
                            {success}
                        </div>
                        <Link
                            to="/reset-password"
                            state={{ email }}
                            className="block w-full py-3.5 px-4 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-pink-500/30 transition-all text-center uppercase tracking-wider text-sm"
                        >
                            Enter OTP to Reset Password →
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-pink-50 mb-2 uppercase tracking-wide">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-5 py-3.5 rounded-xl bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400 transition-all font-medium"
                                placeholder="Enter your registered email"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 px-4 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-pink-500/30 transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wider text-sm"
                        >
                            {loading ? 'Sending OTP...' : 'Send Reset OTP'}
                        </button>
                    </form>
                )}

                <p className="mt-8 text-center text-pink-100/60 text-sm font-medium">
                    Remember your password?{' '}
                    <Link to="/login" className="text-white hover:text-pink-300 font-bold transition-colors">
                        Sign In
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default ForgotPassword;
