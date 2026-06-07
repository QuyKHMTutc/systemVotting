import Navbar from '../components/layout/Navbar';
import { ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const sections = ['s1', 's2', 's3', 's4'] as const;

const RefundPolicy = () => {
    const { t } = useTranslation();

    return (
        <div className="min-h-screen pb-12">
            <Navbar />
            <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-10">
                <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-2xl relative overflow-hidden">
                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-emerald-500/10 blur-[80px]"></div>
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 rounded-full bg-teal-500/10 blur-[80px]"></div>
                    
                    <div className="relative z-10">
                        {/* Header */}
                        <div className="flex flex-col md:flex-row md:items-center gap-6 mb-12 border-b border-slate-200 dark:border-white/10 pb-8">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center border border-slate-200 dark:border-white/10 shrink-0">
                                <ShieldCheck className="w-8 h-8 text-emerald-500" />
                            </div>
                            <div>
                                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
                                    {t('refundPage.title')}
                                </h1>
                                <p className="text-slate-500 dark:text-white/50 font-medium">{t('refundPage.lastUpdated')}</p>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="space-y-10 text-slate-700 dark:text-white/80 text-base leading-loose">
                            {sections.map((s, i) => (
                                <section key={s}>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                                        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 text-emerald-600 dark:text-emerald-400 text-sm font-bold border border-slate-200 dark:border-white/5 shrink-0">
                                            {i + 1}
                                        </span>
                                        {t(`refundPage.${s}Title`)}
                                    </h3>
                                    <p className="md:pl-11">{t(`refundPage.${s}Desc`)}</p>
                                </section>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default RefundPolicy;
