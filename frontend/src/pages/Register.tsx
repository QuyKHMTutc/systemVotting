import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/auth.service';

const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const response = await authService.register({ username, email, password });

            if (response.success) {
                setSuccess('Account created successfully! Redirecting to login...');
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            } else {
                setError(response.message || 'Registration failed');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed. Try a different username/email.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen py-12">
            <div className="glass-panel w-full max-w-md p-10 rounded-3xl transition-all duration-500 hover:shadow-pink-500/20">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight">Create Account</h1>
                    <p className="text-pink-100/70 font-medium">Join the voting community</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-3 rounded-lg mb-6 text-sm text-center">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-green-500/10 border border-green-500/50 text-green-200 p-3 rounded-lg mb-6 text-sm text-center">
                        {success}
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
                            placeholder="Choose a username"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-pink-50 mb-2 uppercase tracking-wide">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-5 py-3.5 rounded-xl bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400 transition-all font-medium"
                            placeholder="Enter your email"
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
                            placeholder="Create a strong password"
                            required
                            minLength={6}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !!success}
                        className="w-full py-3.5 px-4 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-pink-500/30 transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-4 uppercase tracking-wider text-sm"
                    >
                        {loading ? 'Creating...' : 'Sign Up'}
                    </button>
                </form>

                <p className="mt-8 text-center text-pink-100/60 text-sm font-medium">
                    Already have an account?{' '}
                    <Link to="/login" className="text-white hover:text-pink-300 font-bold transition-colors">
                        Sign In
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
