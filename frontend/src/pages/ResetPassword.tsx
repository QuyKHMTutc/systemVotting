import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { authService } from '../services/auth.service';
import OtpInput from '../components/OtpInput';
import PasswordStrength from '../components/PasswordStrength';
import { ShieldCheck, Lock, Eye, EyeOff, Loader2, ArrowLeft, Activity, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ResetPassword = () => {
    const { t } = useTranslation();
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
    const [isShaking, setIsShaking] = useState(false);
    
    const [countdown, setCountdown] = useState((location.state as any)?.message ? 60 : 0);
    const [resendLoading, setResendLoading] = useState(false);

    const triggerShake = () => {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 400); // match animation duration
    };

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
            if (response.code === 200) {
                setSuccess(t('resetPassword.otpResent'));
                setCountdown(60);
            } else {
                setError(response.message || t('resetPassword.failedResend'));
            }
        } catch (err: any) {
            setError(err.response?.data?.message || t('resetPassword.failedResend'));
        } finally {
            setResendLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword !== confirmPassword) {
            setError(t('resetPassword.passwordsNotMatch'));
            triggerShake();
            return;
        }
        if (newPassword.length < 6) {
            setError(t('resetPassword.passwordMinLength'));
            triggerShake();
            return;
        }

        setLoading(true);
        try {
            const response = await authService.resetPassword({ email, otp, newPassword });
            if (response.code === 200) {
                setSuccess(t('resetPassword.resetSuccess'));
                setTimeout(() => navigate('/login'), 2500);
            } else {
                setError(response.message || t('resetPassword.failedReset'));
                triggerShake();
            }
        } catch (err: any) {
            setError(err.response?.data?.message || t('resetPassword.invalidOtp'));
            triggerShake();
        } finally {
            setLoading(false);
        }
    };

    const isFormValid = email.length > 0 && otp.length === 6 && newPassword.length >= 6 && confirmPassword.length >= 6;

    return (
        <div className="min-h-screen flex w-full">
            {/* Left/Top Content: The Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 lg:p-12 z-10">
                <div className={`glass-panel w-full max-w-md p-6 sm:p-10 rounded-2xl sm:rounded-3xl transition-all duration-500 hover:shadow-[0_0_30px_rgba(236,72,153,0.15)] relative overflow-hidden ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="absolute top-0 left-0 -ml-16 -mt-16 w-32 h-32 rounded-full bg-purple-500/10 blur-2xl"></div>
                    <div className="absolute bottom-0 right-0 -mr-16 -mb-16 w-32 h-32 rounded-full bg-pink-500/10 blur-2xl"></div>

                    <div className={`transition-all ${isShaking ? 'animate-shake' : ''}`}>
                        <div className="relative text-center mb-8 sm:mb-10">
                            <div className="w-16 h-16 bg-gradient-to-tr from-purple-500/20 to-pink-500/20 border border-purple-500/20 rounded-2xl shadow-inner flex items-center justify-center mx-auto mb-5 transform -rotate-3">
                                <ShieldCheck className="w-8 h-8 text-purple-400" />
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-2 sm:mb-3 tracking-tight">{t('resetPassword.title')}</h1>
                            <p className="text-slate-600 dark:text-pink-100/80 font-medium text-sm px-2">{t('resetPassword.subtitle')}</p>
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

                        <form onSubmit={handleSubmit} className="space-y-6 relative">
                            {/* Hidden email to auto-fill natively if needed, though readonly */}
                            <input type="email" value={email} readOnly className="hidden" aria-hidden="true" />

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="block text-xs font-bold text-slate-700 dark:text-pink-100 mb-2 uppercase tracking-widest ml-1">{t('resetPassword.otpLabel')}</label>
                                    <button
                                        type="button"
                                        onClick={handleResendOtp}
                                        disabled={countdown > 0 || resendLoading || !email || loading}
                                        className="text-xs font-bold text-pink-300 hover:text-pink-200 hover:drop-shadow-[0_0_5px_rgba(244,114,182,0.5)] disabled:opacity-50 disabled:cursor-not-allowed transition-all uppercase mb-2"
                                    >
                                        {resendLoading ? t('resetPassword.sendingStatus') : countdown > 0 ? t('resetPassword.resendIn', { countdown }) : t('resetPassword.resendOtp')}
                                    </button>
                                </div>
                                <div className="flex justify-center">
                                    <OtpInput value={otp} onChange={setOtp} disabled={loading} length={6} />
                                </div>
                            </div>

                            <div className="space-y-1.5 pt-2">
                                <label htmlFor="newPassword" className="block text-xs font-bold text-slate-700 dark:text-pink-100 uppercase tracking-widest ml-1">{t('resetPassword.newPasswordLabel')}</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-slate-400 dark:text-white/50 group-focus-within:text-pink-500 transition-colors" />
                                    </div>
                                    <input
                                        id="newPassword"
                                        type={showPassword ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full pl-11 pr-12 py-3.5 rounded-xl bg-white dark:bg-white/5 border border-slate-300 dark:border-white/20 hover:border-slate-400 dark:hover:border-white/30 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/40 focus:outline-none focus:border-pink-500 focus:bg-white dark:focus:bg-white/10 focus:shadow-[0_0_15px_rgba(236,72,153,0.4)] transition-all font-medium shadow-sm"
                                        placeholder={t('resetPassword.passwordPlaceholder')}
                                        required
                                        minLength={6}
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        aria-label="Toggle password visibility"
                                        onClick={() => setShowPassword(!showPassword)}
                                        disabled={loading}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-700 dark:text-white/50 dark:hover:text-white transition-all transform active:scale-90 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-50"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                <PasswordStrength password={newPassword} />
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="confirmPassword" className="block text-xs font-bold text-slate-700 dark:text-pink-100 uppercase tracking-widest ml-1">{t('resetPassword.confirmPasswordLabel')}</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <ShieldCheck className="h-5 w-5 text-slate-400 dark:text-white/50 group-focus-within:text-pink-500 transition-colors" />
                                    </div>
                                    <input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full pl-11 pr-12 py-3.5 rounded-xl bg-white dark:bg-white/5 border border-slate-300 dark:border-white/20 hover:border-slate-400 dark:hover:border-white/30 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/40 focus:outline-none focus:border-pink-500 focus:bg-white dark:focus:bg-white/10 focus:shadow-[0_0_15px_rgba(236,72,153,0.4)] transition-all font-medium shadow-sm"
                                        placeholder={t('resetPassword.confirmPasswordPlaceholder')}
                                        required
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        aria-label="Toggle confirm password visibility"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        disabled={loading}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-700 dark:text-white/50 dark:hover:text-white transition-all transform active:scale-90 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-50"
                                        tabIndex={-1}
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !isFormValid}
                                className="flex items-center justify-center gap-2 w-full py-4 px-4 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(236,72,153,0.3)] hover:shadow-[0_0_25px_rgba(236,72,153,0.5)] transition-all transform hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-70 disabled:hover:translate-y-0 disabled:cursor-not-allowed uppercase tracking-wider text-sm mt-8"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>{t('resetPassword.resettingStatus')}</span>
                                    </>
                                ) : (
                                    t('resetPassword.submitBtn')
                                )}
                            </button>
                        </form>

                        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-white/10 text-center flex items-center justify-between">
                            <Link to="/forgot-password" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:text-white/60 dark:hover:text-white dark:hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.5)] text-sm font-bold transition-all group">
                                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                {t('resetPassword.backBtn')}
                            </Link>
                            <Link to="/login" className="text-pink-500 hover:text-pink-600 dark:text-pink-300 dark:hover:text-pink-200 dark:hover:drop-shadow-[0_0_5px_rgba(244,114,182,0.5)] text-sm font-bold transition-all">
                                {t('resetPassword.loginBtn')}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side: Branding Hero (Hidden on Mobile) */}
            <div className="hidden lg:flex w-1/2 relative bg-slate-900 dark:bg-black/20 backdrop-blur-sm flex-col justify-center items-center p-12 overflow-hidden">
                {/* Beautiful Gradient Separator */}
                <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-purple-500/50 to-transparent shadow-[0_0_10px_rgba(168,85,247,0.5)] z-20" />

                <div className="absolute inset-0 z-0 opacity-80 dark:opacity-100">
                    <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-600/40 rounded-full blur-[100px] mix-blend-screen" />
                    <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-600/30 rounded-full blur-[120px] mix-blend-screen" />
                </div>
                
                <div className="z-10 max-w-lg">
                    <div className="bg-white/5 border border-white/10 backdrop-blur-lg p-6 rounded-2xl inline-block mb-8 rotate-3 hover:rotate-0 transition-transform duration-500 shadow-[0_20px_40px_rgba(0,0,0,0.3)]">
                        <ShieldCheck className="w-16 h-16 text-purple-400" />
                    </div>
                    <h2 className="text-5xl font-black text-white mb-6 leading-tight">{t('login.rightTitle1')}<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">{t('login.rightTitle2')}</span></h2>
                    <p className="text-lg text-pink-100/70 mb-10 leading-relaxed font-medium">
                        {t('login.rightDesc')}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-6">
                        <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md hover:bg-white/10 transition-colors">
                            <Activity className="w-8 h-8 text-purple-400 mb-3" />
                            <h3 className="text-white font-bold mb-1">{t('login.feat2Title')}</h3>
                            <p className="text-sm text-pink-100/60 font-medium">{t('login.feat2Desc')}</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md hover:bg-white/10 transition-colors">
                            <Zap className="w-8 h-8 text-pink-400 mb-3" />
                            <h3 className="text-white font-bold mb-1">{t('login.feat3Title')}</h3>
                            <p className="text-sm text-pink-100/60 font-medium">{t('login.feat3Desc')}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
