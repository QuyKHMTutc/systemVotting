import { useTranslation } from 'react-i18next';
import { ScrollReveal } from '../../components/layout/ScrollReveal';
import { ShieldCheck, Activity, Settings, MessageSquare, BarChart3, Lock } from 'lucide-react';

export default function FeaturesSection() {
    const { t } = useTranslation();
    const features = [
        { icon: <ShieldCheck className="w-6 h-6 text-white" />, color: 'bg-purple-600', titleKey: 'home.f1Title', descKey: 'home.f1Desc' },
        { icon: <Activity className="w-6 h-6 text-white" />, color: 'bg-blue-600', titleKey: 'home.f2Title', descKey: 'home.f2Desc' },
        { icon: <Settings className="w-6 h-6 text-white" />, color: 'bg-indigo-600', titleKey: 'home.f3Title', descKey: 'home.f3Desc' },
        { icon: <MessageSquare className="w-6 h-6 text-white" />, color: 'bg-pink-600', titleKey: 'home.f4Title', descKey: 'home.f4Desc' },
        { icon: <BarChart3 className="w-6 h-6 text-white" />, color: 'bg-emerald-600', titleKey: 'home.f5Title', descKey: 'home.f5Desc' },
        { icon: <Lock className="w-6 h-6 text-white" />, color: 'bg-rose-600', titleKey: 'home.f6Title', descKey: 'home.f6Desc' },
    ];
    return (
        <>
        {/* ── Features / Intro Section ─────────────────────── */}
                <div className="mt-24 mb-20 text-center px-4">
                    <ScrollReveal direction="up">
                        <h4 className="text-purple-600 dark:text-purple-400 font-bold text-sm tracking-widest uppercase mb-4 transition-colors">
                            {t('home.featPreTitle')}
                        </h4>
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white mb-6 tracking-tight transition-colors">
                            {t('home.featTitle')}
                        </h2>
                        <p className="max-w-3xl mx-auto text-slate-600 dark:text-white/70 text-lg leading-relaxed mb-20 transition-colors">
                            {t('home.featDesc')}
                        </p>
                    </ScrollReveal>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
                        {features.map((feat, i) => (
                            <ScrollReveal key={i} direction="up" delay={(i % 3) * 100}>
                                <div className="relative bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-8 pt-12 hover:shadow-lg dark:hover:shadow-[0_0_30px_rgba(139,92,246,0.15)] transition-all group h-full">
                                    <div className={`absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 ${feat.color} rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                                        {feat.icon}
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 transition-colors">{t(feat.titleKey)}</h3>
                                    <p className="text-slate-600 dark:text-white/70 leading-relaxed text-sm transition-colors">
                                        {t(feat.descKey)}
                                    </p>
                                </div>
                            </ScrollReveal>
                        ))}
                    </div>
                </div>

                
        </>
    );
}