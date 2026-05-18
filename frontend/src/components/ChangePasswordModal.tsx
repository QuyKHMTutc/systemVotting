import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { userService } from '../services/user.service';
import { KeyRound, Eye, EyeOff } from 'lucide-react';

interface ChangePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ChangePasswordModal = ({ isOpen, onClose }: ChangePasswordModalProps) => {
    const { t } = useTranslation();

    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword !== confirmPassword) {
            setError(t('changePassword.errorMismatch'));
            return;
        }

        if (newPassword.length < 6) {
            setError(t('changePassword.errorMinLength'));
            return;
        }

        setLoading(true);

        try {
            await userService.changePassword({ oldPassword, newPassword });
            setSuccess(t('changePassword.success'));
            setTimeout(() => {
                handleClose();
            }, 1500);
        } catch (err: any) {
            setError(err.response?.data?.message || t('changePassword.errorFailed'));
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setError('');
        setSuccess('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex justify-center bg-black/70 backdrop-blur-md p-4 sm:p-6 transition-all duration-300 items-start pt-[15vh]">
            <div className="bg-[#1a1b26] border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(99,102,241,0.15)] w-full max-w-md overflow-hidden animate-fade-in-up flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="bg-gradient-to-r from-rose-500/20 to-pink-500/20 p-6 border-b border-white/10 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-rose-500/20 rounded-xl text-rose-400">
                            <KeyRound className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-rose-200 tracking-wide">{t('changePassword.title')}</h2>
                            <p className="text-rose-200/60 text-xs mt-1">{t('changePassword.subtitle')}</p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="p-2 sm:p-2 bg-white/10 border border-white/20 text-white hover:bg-red-500 hover:border-red-500 hover:shadow-[0_0_15px_rgba(239,68,68,0.5)] rounded-full transition-all duration-300 hover:rotate-90 focus:outline-none focus:ring-2 focus:ring-red-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form Content */}
                <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/40 text-red-300 p-4 rounded-xl mb-6 text-sm flex items-center gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="bg-green-500/10 border border-green-500/40 text-green-300 p-4 rounded-xl mb-6 text-sm flex items-center gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5 flex flex-col">

                        {/* Old Password */}
                        <div className="space-y-2 relative">
                            <label className="block text-sm font-medium text-slate-300" htmlFor="oldPassword">{t('changePassword.currentPassword')}</label>
                            <input
                                id="oldPassword"
                                type={showOld ? 'text' : 'password'}
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-transparent focus:ring-2 focus:ring-rose-500 transition-all pr-12"
                                placeholder={t('changePassword.currentPasswordPlaceholder')}
                                required
                            />
                            <button type="button" onClick={() => setShowOld(!showOld)} className="absolute right-3 top-[34px] p-1.5 text-slate-400 hover:text-white transition-colors">
                                {showOld ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>

                        {/* New Password */}
                        <div className="space-y-2 relative">
                            <label className="block text-sm font-medium text-slate-300" htmlFor="newPassword">{t('changePassword.newPassword')}</label>
                            <input
                                id="newPassword"
                                type={showNew ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-transparent focus:ring-2 focus:ring-rose-500 transition-all pr-12"
                                placeholder={t('changePassword.newPasswordPlaceholder')}
                                required
                            />
                            <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-[34px] p-1.5 text-slate-400 hover:text-white transition-colors">
                                {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-2 relative">
                            <label className="block text-sm font-medium text-slate-300" htmlFor="confirmPassword">{t('changePassword.confirmPassword')}</label>
                            <input
                                id="confirmPassword"
                                type={showConfirm ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-transparent focus:ring-2 focus:ring-rose-500 transition-all pr-12"
                                placeholder={t('changePassword.confirmPasswordPlaceholder')}
                                required
                            />
                            <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-[34px] p-1.5 text-slate-400 hover:text-white transition-colors">
                                {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>

                    </form>
                </div>
                
                {/* Footer Actions */}
                <div className="bg-black/20 p-5 sm:px-6 border-t border-white/5 flex justify-end gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="px-5 py-2.5 text-sm font-medium text-slate-300 hover:text-white bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl transition-all"
                    >
                        {t('changePassword.cancel')}
                    </button>
                    <button
                        onClick={handleSubmit}
                        type="button"
                        disabled={loading}
                        className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 rounded-xl shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? t('changePassword.submitting') : t('changePassword.submit')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChangePasswordModal;
