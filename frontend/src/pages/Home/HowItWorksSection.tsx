import { useTranslation } from 'react-i18next';
import { ScrollReveal } from '../../components/layout/ScrollReveal';
import { ClipboardList, Vote, TrendingUp } from 'lucide-react';

export default function HowItWorksSection() {
    const { t } = useTranslation();
    const steps = [
        {
            num: '01',
            icon: <ClipboardList className="w-8 h-8" />,
            color: 'from-purple-500 to-indigo-600',
            bg: 'bg-purple-50 dark:bg-purple-900/20',
            border: 'border-purple-200 dark:border-purple-700/40',
            titleKey: 'home.step1Title',
            descKey: 'home.step1Desc',
        },
        {
            num: '02',
            icon: <Vote className="w-8 h-8" />,
            color: 'from-pink-500 to-rose-600',
            bg: 'bg-pink-50 dark:bg-pink-900/20',
            border: 'border-pink-200 dark:border-pink-700/40',
            titleKey: 'home.step2Title',
            descKey: 'home.step2Desc',
        },
        {
            num: '03',
            icon: <TrendingUp className="w-8 h-8" />,
            color: 'from-emerald-500 to-teal-600',
            bg: 'bg-emerald-50 dark:bg-emerald-900/20',
            border: 'border-emerald-200 dark:border-emerald-700/40',
            titleKey: 'home.step3Title',
            descKey: 'home.step3Desc',
        },
    ];
    return (
        <>
        {/* ── How It Works Section ──────────────────────────── */}
                <div className="mt-24 mb-4">
                    <ScrollReveal direction="up">
                        <div className="text-center mb-16 px-4">
                            <h4 className="text-purple-600 dark:text-purple-400 font-bold text-sm tracking-widest uppercase mb-4 transition-colors">
                                {t('home.howPreTitle')}
                            </h4>
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight transition-colors">
                                {t('home.howTitle')}
                            </h2>
                            <p className="max-w-2xl mx-auto text-slate-600 dark:text-white/70 text-lg leading-relaxed transition-colors">
                                {t('home.howDesc')}
                            </p>
                        </div>
                    </ScrollReveal>

                    <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 px-4 items-stretch">
                        {/* Connector line (desktop) */}
                        <div className="hidden md:block absolute top-12 left-1/3 right-1/3 h-0.5 bg-gradient-to-r from-purple-300 via-pink-300 to-emerald-300 dark:from-purple-700/50 dark:via-pink-700/50 dark:to-emerald-700/50 z-0" />

                        {steps.map((step, i) => (
                            <ScrollReveal key={i} direction="up" delay={i * 150} className="h-full">
                                <div className={`relative h-full ${step.bg} border ${step.border} rounded-2xl p-8 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1 z-10`}>
                                    {/* Step number badge */}
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-white/20 flex items-center justify-center shadow-md">
                                        <span className="text-xs font-black text-slate-600 dark:text-white/70">{step.num}</span>
                                    </div>
                                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white mx-auto mb-5 shadow-lg mt-2`}>
                                        {step.icon}
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 transition-colors">
                                        {t(step.titleKey)}
                                    </h3>
                                    <p className="text-slate-600 dark:text-white/70 leading-relaxed text-sm transition-colors">
                                        {t(step.descKey)}
                                    </p>
                                </div>
                            </ScrollReveal>
                        ))}
                    </div>
                </div>

                
        </>
    );
}