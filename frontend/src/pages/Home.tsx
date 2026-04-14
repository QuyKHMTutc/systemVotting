import Navbar from '../components/Navbar';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import bannerImg from '../assets/banner.png';
import { ShieldCheck, Activity, Settings, MessageSquare, BarChart3, Lock, PieChart, MousePointerClick, MessageCircle } from 'lucide-react';
import createMockup from '../assets/mockups/create.png';
import voteMockup from '../assets/mockups/vote.png';
import commentMockup from '../assets/mockups/comment.png';

const Home = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen pb-12 flex flex-col">
      <Navbar />

      <main className="flex-grow max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-6">
        {/* Hero Section */}
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

          {/* Graphic Element (Hand slipping ballot) - We simulate the visual with gradients and an icon since we don't have the exact image */}
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

        {/* Statistics Section */}
        <div className="mt-16 text-center">
            <h3 className="text-slate-800 dark:text-white/60 font-bold text-sm tracking-[0.1em] uppercase mb-12 transition-colors">
                {t('home.trustedBy')}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-10">
                <div className="flex flex-col items-center">
                    <div className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-indigo-600 to-purple-700 dark:from-indigo-400 dark:to-purple-500 mb-2">
                        {t('home.stat1Value')}
                    </div>
                    <div className="text-slate-700 dark:text-white/60 font-medium text-lg transition-colors">
                        {t('home.stat1Label')}
                    </div>
                </div>

                <div className="flex flex-col items-center md:border-l md:border-r border-slate-300 dark:border-white/10 px-4 transition-colors">
                    <div className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-purple-600 to-pink-700 dark:from-purple-400 dark:to-pink-500 mb-2">
                        {t('home.stat2Value')}
                    </div>
                    <div className="text-slate-700 dark:text-white/60 font-medium text-lg transition-colors">
                        {t('home.stat2Label')}
                    </div>
                </div>

                <div className="flex flex-col items-center">
                    <div className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-pink-600 to-red-600 dark:from-pink-400 dark:to-red-400 mb-2">
                        {t('home.stat3Value')}
                    </div>
                    <div className="text-slate-700 dark:text-white/60 font-medium text-lg transition-colors">
                        {t('home.stat3Label')}
                    </div>
                </div>
            </div>
        </div>

        {/* Features / Intro Section */}
        <div className="mt-20 mb-20 text-center px-4">
            <h4 className="text-purple-600 dark:text-purple-400 font-bold text-sm tracking-widest uppercase mb-4 transition-colors">
                {t('home.featPreTitle')}
            </h4>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white mb-6 tracking-tight transition-colors">
                {t('home.featTitle')}
            </h2>
            <p className="max-w-3xl mx-auto text-slate-600 dark:text-white/70 text-lg leading-relaxed mb-20 transition-colors">
                {t('home.featDesc')}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
                {/* Feature 1 */}
                <div className="relative bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-8 pt-12 hover:shadow-lg dark:hover:shadow-[0_0_30px_rgba(139,92,246,0.15)] transition-all group">
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                        <ShieldCheck className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{t('home.f1Title')}</h3>
                    <p className="text-slate-600 dark:text-white/70 leading-relaxed text-sm">
                        {t('home.f1Desc')}
                    </p>
                </div>

                {/* Feature 2 */}
                <div className="relative bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-8 pt-12 hover:shadow-lg dark:hover:shadow-[0_0_30px_rgba(139,92,246,0.15)] transition-all group">
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                        <Activity className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{t('home.f2Title')}</h3>
                    <p className="text-slate-600 dark:text-white/70 leading-relaxed text-sm">
                        {t('home.f2Desc')}
                    </p>
                </div>

                {/* Feature 3 */}
                <div className="relative bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-8 pt-12 hover:shadow-lg dark:hover:shadow-[0_0_30px_rgba(139,92,246,0.15)] transition-all group">
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                        <Settings className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{t('home.f3Title')}</h3>
                    <p className="text-slate-600 dark:text-white/70 leading-relaxed text-sm">
                        {t('home.f3Desc')}
                    </p>
                </div>

                {/* Feature 4 */}
                <div className="relative bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-8 pt-12 hover:shadow-lg dark:hover:shadow-[0_0_30px_rgba(139,92,246,0.15)] transition-all group">
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                        <MessageSquare className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{t('home.f4Title')}</h3>
                    <p className="text-slate-600 dark:text-white/70 leading-relaxed text-sm">
                        {t('home.f4Desc')}
                    </p>
                </div>

                {/* Feature 5 */}
                <div className="relative bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-8 pt-12 hover:shadow-lg dark:hover:shadow-[0_0_30px_rgba(139,92,246,0.15)] transition-all group">
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                        <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{t('home.f5Title')}</h3>
                    <p className="text-slate-600 dark:text-white/70 leading-relaxed text-sm">
                        {t('home.f5Desc')}
                    </p>
                </div>

                {/* Feature 6 */}
                <div className="relative bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-8 pt-12 hover:shadow-lg dark:hover:shadow-[0_0_30px_rgba(139,92,246,0.15)] transition-all group">
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                        <Lock className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{t('home.f6Title')}</h3>
                    <p className="text-slate-600 dark:text-white/70 leading-relaxed text-sm">
                        {t('home.f6Desc')}
                    </p>
                </div>
            </div>
        </div>

        {/* --- Showcase Section 1: Create Poll --- */}
        <div className="py-20 border-t border-slate-200 dark:border-white/10 mt-10">
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20 px-4">
                <div className="lg:w-1/2">
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
                </div>
                <div className="lg:w-1/2 w-full">
                    <div className="relative rounded-[2rem] overflow-hidden shadow-2xl border border-slate-200 dark:border-white/10 group transform transition-transform hover:-translate-y-2 duration-500">
                        <img src={createMockup} alt="Create Poll Mockup" className="w-full h-auto object-cover" />
                        <div className="absolute inset-0 ring-1 ring-inset ring-black/10 dark:ring-white/10 rounded-[2rem] pointer-events-none"></div>
                    </div>
                </div>
            </div>
        </div>

        {/* --- Showcase Section 2: Vote Poll (Image Left) --- */}
        <div className="py-20 border-t border-slate-200 dark:border-white/10">
            <div className="flex flex-col-reverse lg:flex-row items-center gap-12 lg:gap-20 px-4">
                <div className="lg:w-1/2 w-full">
                    <div className="relative rounded-[2rem] overflow-hidden shadow-2xl border border-slate-200 dark:border-white/10 group transform transition-transform hover:-translate-y-2 duration-500">
                        <img src={voteMockup} alt="Vote Mockup" className="w-full h-auto object-cover" />
                        <div className="absolute inset-0 ring-1 ring-inset ring-black/10 dark:ring-white/10 rounded-[2rem] pointer-events-none"></div>
                    </div>
                </div>
                <div className="lg:w-1/2">
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
                </div>
            </div>
        </div>

        {/* --- Showcase Section 3: Comments --- */}
        <div className="py-20 border-t border-slate-200 dark:border-white/10">
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20 px-4">
                <div className="lg:w-1/2">
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
                </div>
                <div className="lg:w-1/2 w-full">
                    <div className="relative rounded-[2rem] overflow-hidden shadow-2xl border border-slate-200 dark:border-white/10 group transform transition-transform hover:-translate-y-2 duration-500">
                        <img src={commentMockup} alt="Comment Mockup" className="w-full h-auto object-cover" />
                        <div className="absolute inset-0 ring-1 ring-inset ring-black/10 dark:ring-white/10 rounded-[2rem] pointer-events-none"></div>
                    </div>
                </div>
            </div>
        </div>

      </main>
    </div>
  );
};

export default Home;
