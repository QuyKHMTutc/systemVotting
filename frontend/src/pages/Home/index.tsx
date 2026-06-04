import Navbar from '../../components/layout/Navbar';
import { useAuth } from '../../contexts/AuthContext';
import FloatingSocial from '../../components/layout/FloatingSocial';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import bannerImg from '../../assets/banner.png';
import {
    ShieldCheck, Activity, Settings, MessageSquare, BarChart3, Lock,
    PieChart, MousePointerClick, MessageCircle,
    CheckCircle2, Zap, Users, ArrowRight,
    Star, Check, Rocket, Crown, Sparkles,
    ClipboardList, Vote, TrendingUp
} from 'lucide-react';
import createMockup from '../../assets/mockups/create.png';
import voteMockup from '../../assets/mockups/vote.png';
import commentMockup from '../../assets/mockups/comment.png';
import { ScrollReveal } from '../../components/layout/ScrollReveal';
import { useEffect, useRef, useState } from 'react';

/* ─── Animated Counter Hook ─────────────────────────────────────────── */
function useCountUp(target: number, duration = 2000, startOnVisible = false) {
    const [count, setCount] = useState(0);
    const [hasStarted, setHasStarted] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!startOnVisible) {
            animateCount();
            return;
        }
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasStarted) {
                    setHasStarted(true);
                    animateCount();
                    if (ref.current) observer.unobserve(ref.current);
                }
            },
            { threshold: 0.3 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => { if (ref.current) observer.unobserve(ref.current); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasStarted]);

    function animateCount() {
        const startTime = performance.now();
        const step = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // easeOutExpo
            const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }

    return { count, ref };
}

/* ─── Stat Card ─────────────────────────────────────────────────────── */
interface StatCardProps {
    valueKey: string;
    labelKey: string;
    numericTarget: number;
    suffix: string;
    prefix?: string;
    gradient: string;
    icon: React.ReactNode;
    border?: boolean;
}
function StatCard({ valueKey: _vk, labelKey, numericTarget, suffix, prefix = '', gradient, icon, border }: StatCardProps) {
    const { t } = useTranslation();
    const { count, ref } = useCountUp(numericTarget, 2200, true);

    const displayValue = numericTarget >= 1_000_000
        ? `${prefix}${(count / 1_000_000).toFixed(1)} triệu`
        : numericTarget >= 1_000
            ? `${prefix}${(count / 1_000_000).toFixed(1)}M+`
            : `${prefix}${count}${suffix}`;

    return (
        <div
            ref={ref}
            className={`flex flex-col items-center group ${border ? 'md:border-l md:border-r border-slate-300 dark:border-white/10 px-4' : ''} transition-colors`}
        >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-lg bg-gradient-to-br ${gradient} transition-transform group-hover:scale-110 duration-300`}>
                {icon}
            </div>
            <div className={`text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br ${gradient} mb-2 tabular-nums`}>
                {displayValue}
            </div>
            <div className="text-slate-700 dark:text-white/60 font-medium text-lg transition-colors">
                {t(labelKey)}
            </div>
        </div>
    );
}

/* ─── Home Component ─────────────────────────────────────────────────── */

import HeroSection from './HeroSection';
import HowItWorksSection from './HowItWorksSection';
import FeaturesSection from './FeaturesSection';

const Home = () => {
    const { t } = useTranslation();

    

    

    const testimonials = [
        {
            avatar: 'https://i.pravatar.cc/64?img=11',
            name: 'Nguyễn Minh Anh',
            role: t('home.tRole1'),
            rating: 5,
            quote: t('home.tQuote1'),
            gradient: 'from-purple-500/20 to-indigo-500/20',
        },
        {
            avatar: 'https://i.pravatar.cc/64?img=32',
            name: 'Trần Hữu Phúc',
            role: t('home.tRole2'),
            rating: 5,
            quote: t('home.tQuote2'),
            gradient: 'from-pink-500/20 to-rose-500/20',
        },
        {
            avatar: 'https://i.pravatar.cc/64?img=47',
            name: 'Lê Thị Thu Hà',
            role: t('home.tRole3'),
            rating: 5,
            quote: t('home.tQuote3'),
            gradient: 'from-emerald-500/20 to-teal-500/20',
        },
        {
            avatar: 'https://i.pravatar.cc/64?img=65',
            name: 'Phạm Đức Thắng',
            role: t('home.tRole4'),
            rating: 5,
            quote: t('home.tQuote4'),
            gradient: 'from-blue-500/20 to-cyan-500/20',
        },
    ];

    const { isAuthenticated, user } = useAuth();
    const currentPlan = (user?.plan || 'FREE').toUpperCase();


    const getPlanStyles = (theme: string, popular: boolean) => {
        switch (theme) {
            case 'slate': return {
                bg: 'bg-white dark:bg-[#0f111a]',
                border: 'border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10',
                glow: 'from-slate-500/5',
                btnBg: 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-white/10',
                btnBgSolid: 'bg-slate-800 text-white hover:bg-slate-900',
                iconBg: 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400'
            };
            case 'indigo': return {
                bg: 'bg-white dark:bg-[#0f111a]',
                border: 'border-slate-200 dark:border-white/5 hover:border-indigo-300 dark:hover:border-indigo-500/30',
                glow: 'from-indigo-500/10',
                btnBg: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20',
                btnBgSolid: 'bg-indigo-600 text-white hover:bg-indigo-700',
                iconBg: 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400'
            };
            case 'amber': return {
                bg: 'bg-white dark:bg-[#15110f]', // slight warm tint
                border: 'border-amber-200 dark:border-amber-700/50 ring-1 ring-amber-400/20 shadow-[0_8px_30px_rgba(245,158,11,0.12)]',
                glow: 'from-amber-500/15',
                btnBg: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-100',
                btnBgSolid: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg hover:shadow-amber-500/25',
                iconBg: 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md shadow-amber-500/20'
            };
            case 'fuchsia': return {
                bg: 'bg-white dark:bg-[#0f111a]',
                border: 'border-slate-200 dark:border-white/5 hover:border-fuchsia-300 dark:hover:border-fuchsia-500/30',
                glow: 'from-fuchsia-500/10',
                btnBg: 'bg-fuchsia-50 dark:bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 hover:bg-fuchsia-100 dark:hover:bg-fuchsia-500/20',
                btnBgSolid: 'bg-fuchsia-600 text-white hover:bg-fuchsia-700',
                iconBg: 'bg-fuchsia-100 dark:bg-fuchsia-500/20 text-fuchsia-600 dark:text-fuchsia-400'
            };
            default: return { bg: '', border: '', glow: '', btnBg: '', btnBgSolid: '', iconBg: '' };
        }
    };

    const plans = [
        {
            planId: 'FREE',
            nameKey: 'home.planFreeName',
            price: '0đ',
            periodKey: 'home.planPeriod',
            descKey: 'home.planFreeDesc',
            icon: <Sparkles className="w-5 h-5" />,
            theme: 'slate',
            cta: '/register',
            ctaKey: 'home.planFreeCta',
            features: ['home.planFreeF1', 'home.planFreeF2', 'home.planFreeF3', 'home.planFreeF4'],
            popular: false,
        },
        {
            planId: 'GO',
            nameKey: 'home.planGoName',
            price: '50.000đ',
            periodKey: 'home.planPeriod',
            descKey: 'home.planGoDesc',
            icon: <Rocket className="w-5 h-5" />,
            theme: 'indigo',
            cta: '/register',
            ctaKey: 'home.planGoCta',
            features: ['home.planGoF1', 'home.planGoF2', 'home.planGoF3', 'home.planGoF4', 'home.planGoF5'],
            popular: false,
        },
        {
            planId: 'PLUS',
            nameKey: 'home.planPlusName',
            price: '200.000đ',
            periodKey: 'home.planPeriod',
            descKey: 'home.planPlusDesc',
            icon: <Star className="w-5 h-5" />,
            theme: 'amber',
            cta: '/register',
            ctaKey: 'home.planPlusCta',
            features: ['home.planPlusF1', 'home.planPlusF2', 'home.planPlusF3', 'home.planPlusF4', 'home.planPlusF5'],
            popular: true,
        },
        {
            planId: 'PRO',
            nameKey: 'home.planProName',
            price: '500.000đ',
            periodKey: 'home.planPeriod',
            descKey: 'home.planProDesc',
            icon: <Crown className="w-5 h-5" />,
            theme: 'fuchsia',
            cta: '/register',
            ctaKey: 'home.planProCta',
            features: ['home.planProF1', 'home.planProF2', 'home.planProF3', 'home.planProF4'],
            popular: false,
        },
    ];

    return (
        <div className="min-h-screen pb-12 flex flex-col relative overflow-x-hidden">
            <FloatingSocial />
            <Navbar />

            <main className="flex-grow max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-6">

                <HeroSection />
{/* ── Statistics Section (Animated) ────────────────── */}
                <ScrollReveal direction="up" delay={200}>
                    <div className="mt-16 text-center">
                        <h3 className="text-slate-800 dark:text-white/60 font-bold text-sm tracking-[0.1em] uppercase mb-12 transition-colors">
                            {t('home.trustedBy')}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-10">
                            <StatCard
                                valueKey="home.stat1Value"
                                labelKey="home.stat1Label"
                                numericTarget={2300000}
                                suffix=""
                                prefix="Hơn "
                                gradient="from-indigo-600 to-purple-700 dark:from-indigo-400 dark:to-purple-500"
                                icon={<Users className="w-5 h-5 text-white" />}
                            />
                            <StatCard
                                valueKey="home.stat2Value"
                                labelKey="home.stat2Label"
                                numericTarget={13000000}
                                suffix=""
                                prefix="Hơn "
                                gradient="from-purple-600 to-pink-700 dark:from-purple-400 dark:to-pink-500"
                                icon={<PieChart className="w-5 h-5 text-white" />}
                                border
                            />
                            <StatCard
                                valueKey="home.stat3Value"
                                labelKey="home.stat3Label"
                                numericTarget={290000000}
                                suffix="M+"
                                prefix=""
                                gradient="from-pink-600 to-red-600 dark:from-pink-400 dark:to-red-400"
                                icon={<Zap className="w-5 h-5 text-white" />}
                            />
                        </div>
                    </div>
                </ScrollReveal>

                <HowItWorksSection />
<FeaturesSection />
{/* ── Showcase Section 1: Create Poll ──────────────── */}
                <div className="py-20 border-t border-slate-200 dark:border-white/10 mt-10 overflow-hidden">
                    <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20 px-4">
                        <ScrollReveal direction="right" className="lg:w-1/2">
                            <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/30">
                                <PieChart className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white mb-6 leading-tight transition-colors">
                                {t('home.createSectionTitle')}
                            </h2>
                            <p className="text-slate-600 dark:text-white/70 text-lg leading-relaxed mb-8 transition-colors">
                                {t('home.createSectionDesc')}
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <Link to="/create-poll" className="px-6 py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-500/20 transition-all hover:-translate-y-0.5">
                                    {t('home.btnCreateNow')}
                                </Link>
                                <Link to="/explore" className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-900 dark:text-white font-bold rounded-xl transition-all border border-slate-200 dark:border-white/10 shadow-sm">
                                    {t('home.btnViewExample')}
                                </Link>
                            </div>
                        </ScrollReveal>
                        <ScrollReveal direction="left" delay={200} className="lg:w-1/2 w-full">
                            <div className="relative rounded-[2rem] overflow-hidden shadow-2xl border border-slate-200 dark:border-white/10 group transform transition-transform hover:-translate-y-2 duration-500">
                                <img src={createMockup} alt="Create Poll Mockup" className="w-full h-auto object-cover" />
                                <div className="absolute inset-0 ring-1 ring-inset ring-black/10 dark:ring-white/10 rounded-[2rem] pointer-events-none"></div>
                            </div>
                        </ScrollReveal>
                    </div>
                </div>

                {/* ── Showcase Section 2: Vote Poll ────────────────── */}
                <div className="py-20 border-t border-slate-200 dark:border-white/10 overflow-hidden">
                    <div className="flex flex-col-reverse lg:flex-row items-center gap-12 lg:gap-20 px-4">
                        <ScrollReveal direction="right" delay={200} className="lg:w-1/2 w-full">
                            <div className="relative rounded-[2rem] overflow-hidden shadow-2xl border border-slate-200 dark:border-white/10 group transform transition-transform hover:-translate-y-2 duration-500">
                                <img src={voteMockup} alt="Vote Mockup" className="w-full h-auto object-cover" />
                                <div className="absolute inset-0 ring-1 ring-inset ring-black/10 dark:ring-white/10 rounded-[2rem] pointer-events-none"></div>
                            </div>
                        </ScrollReveal>
                        <ScrollReveal direction="left" className="lg:w-1/2">
                            <div className="w-16 h-16 bg-pink-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-pink-500/30">
                                <MousePointerClick className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white mb-6 leading-tight transition-colors">
                                {t('home.voteSectionTitle')}
                            </h2>
                            <p className="text-slate-600 dark:text-white/70 text-lg leading-relaxed mb-8 transition-colors">
                                {t('home.voteSectionDesc')}
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <Link to="/explore" className="px-6 py-3.5 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl shadow-lg shadow-pink-500/20 transition-all hover:-translate-y-0.5">
                                    {t('home.btnExplorePolls')}
                                </Link>
                            </div>
                        </ScrollReveal>
                    </div>
                </div>

                {/* ── Showcase Section 3: Comments ─────────────────── */}
                <div className="py-20 border-t border-slate-200 dark:border-white/10 overflow-hidden">
                    <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20 px-4">
                        <ScrollReveal direction="right" className="lg:w-1/2">
                            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/30">
                                <MessageCircle className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white mb-6 leading-tight transition-colors">
                                {t('home.commentSectionTitle')}
                            </h2>
                            <p className="text-slate-600 dark:text-white/70 text-lg leading-relaxed mb-8 transition-colors">
                                {t('home.commentSectionDesc')}
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <Link to="/explore" className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5">
                                    {t('home.btnJoinDiscussion')}
                                </Link>
                            </div>
                        </ScrollReveal>
                        <ScrollReveal direction="left" delay={200} className="lg:w-1/2 w-full">
                            <div className="relative rounded-[2rem] overflow-hidden shadow-2xl border border-slate-200 dark:border-white/10 group transform transition-transform hover:-translate-y-2 duration-500">
                                <img src={commentMockup} alt="Comment Mockup" className="w-full h-auto object-cover" />
                                <div className="absolute inset-0 ring-1 ring-inset ring-black/10 dark:ring-white/10 rounded-[2rem] pointer-events-none"></div>
                            </div>
                        </ScrollReveal>
                    </div>
                </div>

                {/* ── Testimonials Section ─────────────────────────── */}
                <div className="py-20 border-t border-slate-200 dark:border-white/10 px-4">
                    <ScrollReveal direction="up">
                        <div className="text-center mb-14">
                            <h4 className="text-purple-600 dark:text-purple-400 font-bold text-sm tracking-widest uppercase mb-4 transition-colors">
                                {t('home.testimonialsPreTitle')}
                            </h4>
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight transition-colors">
                                {t('home.testimonialsTitle')}
                            </h2>
                            <p className="max-w-2xl mx-auto text-slate-600 dark:text-white/70 text-lg leading-relaxed transition-colors">
                                {t('home.testimonialsDesc')}
                            </p>
                        </div>
                    </ScrollReveal>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {testimonials.map((t_item, i) => (
                            <ScrollReveal key={i} direction="up" delay={i * 100}>
                                <div className={`relative bg-gradient-to-br ${t_item.gradient} border border-slate-200 dark:border-white/10 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 backdrop-blur-sm bg-white/60 dark:bg-white/5 h-full`}>
                                    {/* Quote mark */}
                                    <div className="absolute top-4 right-6 text-5xl font-black text-slate-200 dark:text-white/50 leading-none select-none">"</div>
                                    {/* Stars */}
                                    <div className="flex gap-1 mb-4">
                                        {Array.from({ length: t_item.rating }).map((_, si) => (
                                            <Star key={si} className="w-4 h-4 fill-amber-400 text-amber-400" />
                                        ))}
                                    </div>
                                    <p className="text-slate-700 dark:text-white/80 leading-relaxed mb-5 text-sm italic relative z-10">
                                        "{t_item.quote}"
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={t_item.avatar}
                                            alt={t_item.name}
                                            className="w-10 h-10 rounded-full object-cover ring-2 ring-white dark:ring-white/20 shadow-md"
                                        />
                                        <div>
                                            <div className="font-bold text-slate-900 dark:text-white text-sm transition-colors">{t_item.name}</div>
                                            <div className="text-slate-500 dark:text-white/50 text-xs transition-colors">{t_item.role}</div>
                                        </div>
                                        <div className="ml-auto">
                                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                        </div>
                                    </div>
                                </div>
                            </ScrollReveal>
                        ))}
                    </div>
                </div>

                {/* ── Pricing Section ──────────────────────────────── */}
                <div className="py-20 border-t border-slate-200 dark:border-white/10 px-4">
                    <ScrollReveal direction="up">
                        <div className="text-center mb-14">
                            <h4 className="text-purple-600 dark:text-purple-400 font-bold text-sm tracking-widest uppercase mb-4 transition-colors">
                                {t('home.pricingPreTitle')}
                            </h4>
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight transition-colors">
                                {t('home.pricingTitle')}
                            </h2>
                            <p className="max-w-2xl mx-auto text-slate-600 dark:text-white/70 text-lg leading-relaxed transition-colors">
                                {t('home.pricingDesc')}
                            </p>
                        </div>
                    </ScrollReveal>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-stretch">
                        {plans.map((plan, i) => {
                            const isCurrentPlan = isAuthenticated && currentPlan === plan.planId;
                            const isLowerPlan = isAuthenticated && (
                                ['FREE'].includes(currentPlan) && ['FREE'].includes(plan.planId) ||
                                ['GO'].includes(currentPlan) && ['FREE', 'GO'].includes(plan.planId) ||
                                ['PLUS'].includes(currentPlan) && ['FREE', 'GO', 'PLUS'].includes(plan.planId) ||
                                ['PRO'].includes(currentPlan) && ['FREE', 'GO', 'PLUS', 'PRO'].includes(plan.planId)
                            );
                            const styles = getPlanStyles(plan.theme, plan.popular);
                            
                            return (
                                <ScrollReveal key={i} direction="up" delay={i * 100} className="h-full">
                                    <div className={`relative flex flex-col h-full rounded-[2rem] border ${styles.bg} ${styles.border} transition-all duration-300 overflow-hidden ${isCurrentPlan ? 'ring-2 ring-emerald-400 dark:ring-emerald-500' : ''} ${plan.popular ? 'scale-[1.02] z-10' : 'hover:-translate-y-1'}`}>

                                        {/* Subtle Top Glow */}
                                        <div className={`absolute top-0 inset-x-0 h-40 bg-gradient-to-b ${styles.glow} to-transparent opacity-60 pointer-events-none`} />

                                        {/* Popular badge */}
                                        {plan.popular && !isCurrentPlan && (
                                            <div className="absolute top-5 right-5 z-10">
                                                <span className="px-3 py-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-black uppercase tracking-wider rounded-full shadow-md">
                                                    {t('home.planPopular')}
                                                </span>
                                            </div>
                                        )}
                                        {/* Current plan badge */}
                                        {isCurrentPlan && (
                                            <div className="absolute top-5 right-5 z-10">
                                                <span className="px-3 py-1 text-xs font-bold rounded-full border flex items-center gap-1 bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40 shadow-sm">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    {t('home.planCurrent')}
                                                </span>
                                            </div>
                                        )}

                                        <div className="p-8 flex-1 flex flex-col z-10">
                                            {/* Header */}
                                            <div className="flex items-center gap-4 mb-5">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${styles.iconBg}`}>
                                                    {plan.icon}
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white leading-tight">
                                                        {t(plan.nameKey)}
                                                    </h3>
                                                    <p className="text-sm font-medium text-slate-500 dark:text-white/50 mt-0.5">
                                                        {t(plan.descKey)}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Price */}
                                            <div className="mb-8 flex items-baseline">
                                                <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                                                    {plan.price}
                                                </span>
                                                {plan.price !== '0đ' && (
                                                    <span className="text-sm ml-1.5 font-medium text-slate-500 dark:text-white/40">
                                                        /{t(plan.periodKey)}
                                                    </span>
                                                )}
                                            </div>

                                            {/* CTA */}
                                            {isCurrentPlan ? (
                                                <div className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm mb-8 cursor-default bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    {t('home.planCurrentCta')}
                                                </div>
                                            ) : isLowerPlan ? (
                                                <div className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm mb-8 cursor-default opacity-50 bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-white/50">
                                                    {t('home.planDowngrade')}
                                                </div>
                                            ) : (
                                                <Link
                                                    to={isAuthenticated ? '/profile' : plan.cta}
                                                    className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all mb-8 ${plan.popular ? styles.btnBgSolid : styles.btnBg}`}
                                                >
                                                    {isAuthenticated ? t('home.planUpgradeCta') : t(plan.ctaKey)}
                                                    <ArrowRight className="w-4 h-4" />
                                                </Link>
                                            )}

                                            {/* Divider */}
                                            <div className="w-full h-px bg-slate-100 dark:bg-white/5 mb-6" />

                                            {/* Features */}
                                            <ul className="space-y-4 flex-1">
                                                {plan.features.map((fk, fi) => (
                                                    <li key={fi} className="flex items-start gap-3">
                                                        <div className="mt-0.5 w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                                                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                                                        </div>
                                                        <span className="text-sm font-medium text-slate-700 dark:text-white/70">
                                                            {t(fk)}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </ScrollReveal>
                            );
                        })}
                    </div>
                </div>

                {/* ── Final CTA Section ────────────────────────────── */}
                <ScrollReveal direction="up">
                    <div className="mt-10 mb-4 relative rounded-[2rem] overflow-hidden bg-gradient-to-br from-[#1a0b4b] via-[#2d1167] to-[#180A47] px-8 sm:px-16 py-20 text-center border border-white/10 shadow-2xl">
                        {/* BG glows */}
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute top-[-80px] left-1/4 w-72 h-72 bg-purple-600/30 rounded-full blur-[120px]" />
                            <div className="absolute bottom-[-80px] right-1/4 w-72 h-72 bg-indigo-600/30 rounded-full blur-[120px]" />
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-600/10 rounded-full blur-[160px]" />
                        </div>

                        <div className="relative z-10">
                            {isAuthenticated ? (
                                /* ── Logged-in state ── */
                                <>
                                    {/* Avatar + greeting */}
                                    <div className="flex items-center justify-center gap-3 mb-6">
                                        {user?.avatarUrl ? (
                                            <img
                                                src={user.avatarUrl}
                                                alt={user.username}
                                                className="w-12 h-12 rounded-full ring-2 ring-white/30 shadow-xl object-cover"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center ring-2 ring-white/30 shadow-xl">
                                                <span className="text-white font-bold text-lg">{user?.username?.[0]?.toUpperCase()}</span>
                                            </div>
                                        )}
                                        <div className="text-left">
                                            <p className="text-white/60 text-sm">{t('home.ctaLoggedWelcome')}</p>
                                            <p className="text-white font-bold text-lg leading-tight">{user?.username}</p>
                                        </div>
                                        {/* Plan badge */}
                                        <span className={`ml-2 px-3 py-1 rounded-full text-xs font-black border ${currentPlan === 'PRO'
                                                ? 'bg-amber-400/20 text-amber-200 border-amber-400/50'
                                                : currentPlan === 'PLUS'
                                                    ? 'bg-blue-400/20 text-blue-200 border-blue-400/50'
                                                    : currentPlan === 'GO'
                                                        ? 'bg-purple-400/20 text-purple-200 border-purple-400/50'
                                                        : 'bg-white/10 text-white/60 border-white/20'
                                            }`}>
                                            {currentPlan}
                                        </span>
                                    </div>

                                    <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 leading-tight tracking-tight max-w-3xl mx-auto">
                                        {t('home.ctaLoggedTitle')}
                                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300 block mt-1">
                                            {t('home.ctaLoggedTitle2')}
                                        </span>
                                    </h2>
                                    <p className="text-white/70 text-lg sm:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
                                        {t('home.ctaLoggedDesc')}
                                    </p>

                                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                                        <Link
                                            to="/create-poll"
                                            className="group px-10 py-4 bg-white text-purple-700 hover:bg-purple-50 font-extrabold rounded-2xl transition-all shadow-2xl shadow-purple-900/50 hover:-translate-y-1 text-lg flex items-center gap-2"
                                        >
                                            {t('home.ctaLoggedBtn1')}
                                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </Link>
                                        {currentPlan === 'FREE' && (
                                            <Link
                                                to="/profile"
                                                className="group px-10 py-4 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-extrabold rounded-2xl transition-all shadow-lg hover:-translate-y-1 text-lg flex items-center gap-2"
                                            >
                                                <Rocket className="w-5 h-5" />
                                                {t('home.ctaLoggedUpgrade')}
                                            </Link>
                                        )}
                                        {currentPlan !== 'FREE' && (
                                            <Link
                                                to="/explore"
                                                className="px-10 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl border border-white/20 transition-all hover:-translate-y-1 text-lg backdrop-blur-sm"
                                            >
                                                {t('home.ctaBtn2')}
                                            </Link>
                                        )}
                                    </div>

                                    {/* Quick stats for logged-in user */}
                                    <div className="mt-10 grid grid-cols-3 gap-4 max-w-md mx-auto">
                                        {[
                                            { icon: <PieChart className="w-4 h-4" />, labelKey: 'home.ctaStatPolls' },
                                            { icon: <Users className="w-4 h-4" />, labelKey: 'home.ctaStatCommunity' },
                                            { icon: <Zap className="w-4 h-4" />, labelKey: 'home.ctaStatRealtime' },
                                        ].map((s, si) => (
                                            <div key={si} className="flex flex-col items-center gap-1.5 bg-white/5 rounded-xl py-3 px-2 border border-white/10">
                                                <span className="text-purple-300">{s.icon}</span>
                                                <span className="text-white/60 text-xs text-center leading-tight">{t(s.labelKey)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                /* ── Guest state ── */
                                <>
                                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/80 text-sm font-medium mb-6">
                                        <Sparkles className="w-4 h-4 text-amber-400" />
                                        {t('home.ctaBadge')}
                                    </div>
                                    <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white mb-6 leading-tight tracking-tight max-w-3xl mx-auto">
                                        {t('home.ctaTitle')}
                                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300 block mt-1">
                                            {t('home.ctaTitle2')}
                                        </span>
                                    </h2>
                                    <p className="text-white/70 text-lg sm:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
                                        {t('home.ctaDesc')}
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                                        <Link
                                            to="/register"
                                            className="group px-10 py-4 bg-white text-purple-700 hover:bg-purple-50 font-extrabold rounded-2xl transition-all shadow-2xl shadow-purple-900/50 hover:shadow-purple-900/70 hover:-translate-y-1 text-lg flex items-center gap-2"
                                        >
                                            {t('home.ctaBtn1')}
                                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </Link>
                                        <Link
                                            to="/explore"
                                            className="px-10 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl border border-white/20 transition-all hover:-translate-y-1 text-lg backdrop-blur-sm"
                                        >
                                            {t('home.ctaBtn2')}
                                        </Link>
                                    </div>
                                    {/* Trust indicators */}
                                    <div className="mt-10 flex flex-wrap justify-center gap-6 text-white/50 text-sm">
                                        <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-400" />{t('home.ctaTrust1')}</span>
                                        <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-400" />{t('home.ctaTrust2')}</span>
                                        <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-400" />{t('home.ctaTrust3')}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </ScrollReveal>

            </main>
        </div>
    );
};

export default Home;
