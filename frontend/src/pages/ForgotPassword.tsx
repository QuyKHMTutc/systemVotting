import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { KeyRound, Mail, ArrowLeft, Loader2, Fingerprint, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ForgotPassword = () => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isShaking, setIsShaking] = useState(false);
    const navigate = useNavigate();

    const triggerShake = () => {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 400); // match animation duration
    };

    const validateEmail = (emailStr: string) => {
        const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr);
        if (!isValid && emailStr.length > 0) {
            setEmailError(t('forgotPassword.invalidEmail'));
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
        
        if (!validateEmail(email)) {
            triggerShake();
            return;
        }

        setLoading(true);

        try {
            const response = await authService.forgotPassword(email);
            if (response.code === 200) {
                navigate('/reset-password', { 
                    state: { 
                        email, 
                        message: t('forgotPassword.otpSent') 
                    } 
                });
            } else {
                setError(response.message || t('forgotPassword.failedToSend'));
                triggerShake();
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || '';
            if (msg.toLowerCase().includes('verified') || msg.toLowerCase().includes('disabled')) {
                navigate('/register', { state: { email, stage: 'verify' } });
                return;
            }
            setError(msg || t('forgotPassword.failedToSendCheckEmail'));
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
                    <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 rounded-full bg-purple-500/10 blur-2xl"></div>

                    <div className={`transition-all ${isShaking ? 'animate-shake' : ''}`}>
                        <div className="relative text-center mb-8 sm:mb-10">
                            <div className="w-16 h-16 bg-gradient-to-tr from-pink-500/20 to-purple-500/20 border border-pink-500/20 rounded-2xl shadow-inner flex items-center justify-center mx-auto mb-5 transform rotate-3">
                                <KeyRound className="w-8 h-8 text-pink-400" />
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-2 sm:mb-3 tracking-tight">{t('forgotPassword.title')}</h1>
                            <p className="text-slate-600 dark:text-pink-100/80 font-medium text-sm px-4">{t('forgotPassword.subtitle')}</p>
                        </div>

                        <div className={`transition-all duration-300 overflow-hidden ${error ? 'max-h-24 opacity-100 mb-6' : 'max-h-0 opacity-0'}`}>
                            <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-3 rounded-xl text-sm text-center font-medium">
                                {error}
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-7 relative">
                            <div className="space-y-2">
                                <label htmlFor="email" className="block text-xs font-bold text-slate-700 dark:text-pink-100 mb-2 uppercase tracking-widest ml-1">{t('forgotPassword.emailLabel')}</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail className={`h-5 w-5 transition-colors ${emailError ? 'text-red-500 dark:text-red-400' : 'text-slate-400 dark:text-white/50 group-focus-within:text-pink-500 dark:group-focus-within:text-pink-400'}`} />
                                    </div>
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={handleEmailChange}
                                        onBlur={handleEmailBlur}
                                        className={`w-full pl-11 pr-5 py-3.5 rounded-xl bg-white dark:bg-white/5 border text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/40 focus:outline-none focus:bg-white dark:focus:bg-white/10 transition-all font-medium shadow-sm ${
                                            emailError 
                                            ? 'border-red-500/50 focus:border-red-500 focus:shadow-[0_0_15px_rgba(239,68,68,0.3)]' 
                                            : 'border-slate-300 dark:border-white/20 hover:border-slate-400 dark:hover:border-white/30 focus:border-pink-500 focus:shadow-[0_0_15px_rgba(236,72,153,0.4)]'
                                        }`}
                                        placeholder="name@example.com"
                                        required
                                    />
                                </div>
                                <div className={`transition-all duration-300 overflow-hidden ${emailError ? 'max-h-10 opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <p className="text-red-400 text-xs font-medium ml-1 mt-1">{emailError}</p>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !email}
                                className="flex items-center justify-center gap-2 w-full py-4 px-4 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(236,72,153,0.3)] hover:shadow-[0_0_25px_rgba(236,72,153,0.5)] transition-all transform hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-70 disabled:hover:translate-y-0 disabled:cursor-not-allowed uppercase tracking-wider text-sm mt-8"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>{t('forgotPassword.sendingStatus')}</span>
                                    </>
                                ) : (
                                    t('forgotPassword.sendOtp')
                                )}
                            </button>
                        </form>

                        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-white/10 text-center">
                            <Link to="/login" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:text-white/60 dark:hover:text-white dark:hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.5)] text-sm font-bold transition-all group">
                                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                {t('forgotPassword.backToSignIn')}
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
                    <div className="bg-white/5 border border-white/10 backdrop-blur-lg p-6 rounded-2xl inline-block mb-8 rotate-6 hover:rotate-0 transition-transform duration-500 shadow-[0_20px_40px_rgba(0,0,0,0.3)]">
                        <KeyRound className="w-16 h-16 text-pink-400" />
                    </div>
                    <h2 className="text-5xl font-black text-white mb-6 leading-tight">{t('forgotPassword.rightTitle1')}<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">{t('forgotPassword.rightTitle2')}</span></h2>
                    <p className="text-lg text-pink-100/70 mb-10 leading-relaxed font-medium">
                        {t('forgotPassword.rightDesc')}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-6">
                        <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md hover:bg-white/10 transition-colors">
                            <Fingerprint className="w-8 h-8 text-pink-400 mb-3" />
                            <h3 className="text-white font-bold mb-1">{t('forgotPassword.rightFeat1Title')}</h3>
                            <p className="text-sm text-pink-100/60 font-medium">{t('forgotPassword.rightFeat1Desc')}</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md hover:bg-white/10 transition-colors">
                            <Zap className="w-8 h-8 text-purple-400 mb-3" />
                            <h3 className="text-white font-bold mb-1">{t('forgotPassword.rightFeat2Title')}</h3>
                            <p className="text-sm text-pink-100/60 font-medium">{t('forgotPassword.rightFeat2Desc')}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
