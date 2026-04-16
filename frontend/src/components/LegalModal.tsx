import { useEffect } from 'react';
import { FileText, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export type LegalModalType = 'terms' | 'privacy';

interface LegalModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: LegalModalType;
}

const sections = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8'] as const;

const LegalModal = ({ isOpen, onClose, type }: LegalModalProps) => {
    const { t } = useTranslation();
    const isTerms = type === 'terms';
    const ns = isTerms ? 'termsPage' : 'privacyPage';

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex justify-center bg-black/70 backdrop-blur-md p-4 sm:p-6 transition-all duration-300 items-start pt-[8vh] sm:pt-[10vh]"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                className="bg-slate-900 border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(236,72,153,0.2)] w-full max-w-2xl overflow-hidden animate-modal-enter flex flex-col max-h-[85vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 p-6 border-b border-white/10 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                            {isTerms ? (
                                <FileText className="w-5 h-5 text-pink-400" />
                            ) : (
                                <Shield className="w-5 h-5 text-purple-400" />
                            )}
                        </div>
                        <div>
                            <h2 className="text-xl font-extrabold text-white tracking-wide">
                                {t(`${ns}.title`)}
                            </h2>
                            <p className="text-pink-200/60 text-xs mt-0.5">
                                {t(`${ns}.lastUpdated`)}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2.5 bg-white/10 border border-white/20 text-white hover:bg-red-500/80 hover:border-red-500 rounded-full transition-all duration-300 hover:rotate-90 focus:outline-none focus:ring-2 focus:ring-pink-500"
                        aria-label="Close"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Scrollable content */}
                <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-1">
                    <div className="space-y-6 text-pink-100/80 text-sm leading-relaxed">
                        {sections.map((s, i) => (
                            <section key={s}>
                                <h3 className="text-white font-bold text-base mb-2">
                                    {i + 1}. {t(`${ns}.${s}Title`)}
                                </h3>
                                <p>{t(`${ns}.${s}Desc`)}</p>
                            </section>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 sm:p-6 border-t border-white/10 shrink-0">
                    <button
                        onClick={onClose}
                        className="w-full py-3 px-4 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(236,72,153,0.3)] transition-all uppercase tracking-wider text-sm"
                    >
                        {t('legalModal.understood')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LegalModal;
