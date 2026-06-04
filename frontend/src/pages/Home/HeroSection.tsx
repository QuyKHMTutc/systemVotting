import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ScrollReveal } from '../../components/layout/ScrollReveal';
import bannerImg from '../../assets/banner.png';

export default function HeroSection() {
    const { t } = useTranslation();
    return (
        <>
        {/* ── Hero Section ─────────────────────────────────── */}
                <ScrollReveal direction="down" delay={100}>
                    <div className="relative rounded-[2rem] overflow-hidden bg-[#180A47] pb-16 pt-20 px-8 sm:px-16 shadow-2xl flex flex-col md:flex-row items-center border border-white/5">
                        {/* Content */}
                        <div className="relative z-10 max-w-2xl lg:w-[60%]">
                            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white mb-6 leading-tight tracking-tight">
                                {t('home.heroTitle1')}{' '}
                                <span className="text-[#a88ff3] block mt-1">{t('home.heroTitle2')}</span>
                            </h1>
                            <p className="text-white/80 text-lg sm:text-xl mb-10 leading-relaxed font-medium">
                                {t('home.heroDesc')}
                            </p>
                            <div className="flex flex-col sm:flex-row flex-wrap gap-4 items-start sm:items-center">
                                <Link
                                    to="/create-poll"
                                    className="px-8 py-3.5 bg-white text-[#4A148C] hover:bg-gray-100 font-bold rounded-xl transition-colors shadow-lg hover:shadow-xl text-center min-w-[200px]"
                                >
                                    {t('home.createPollBtn')}
                                </Link>
                                <Link
                                    to="/explore"
                                    className="px-8 py-3.5 bg-[#6b21a8] text-white hover:bg-[#581c87] font-bold rounded-xl transition-colors shadow-lg shadow-purple-900/50 text-center min-w-[200px]"
                                >
                                    {t('home.livePresentationBtn')}
                                </Link>
                            </div>
                        </div>

                        {/* Graphic Element */}
                        <div className="hidden lg:block absolute right-0 bottom-0 top-0 w-[50%] pointer-events-none overflow-hidden">
                            <div className="absolute right-[-100px] bottom-[-100px] w-96 h-96 bg-purple-500/30 rounded-full blur-[100px]"></div>
                            <img
                                src={bannerImg}
                                alt="Ban bình chọn"
                                className="absolute right-0 top-0 w-full h-full object-cover object-left pointer-events-none [mask-image:linear-gradient(to_right,transparent_0%,black_25%)] mix-blend-lighten opacity-90"
                            />
                        </div>
                    </div>
                </ScrollReveal>

                
        </>
    );
}