import Navbar from '../components/Navbar';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

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
          <div className="hidden lg:block absolute right-0 bottom-0 w-[45%] h-full opacity-80 pointer-events-none">
             <div className="absolute right-[-100px] bottom-[-100px] w-96 h-96 bg-purple-500/20 rounded-full blur-[100px]"></div>
             <div className="absolute right-[100px] top-[50%] -translate-y-1/2">
                <svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-[#6b21a8] drop-shadow-[0_0_50px_rgba(107,33,168,0.5)]">
                    <path d="M4 14a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4z" fill="#6b21a8"/>
                    <path d="M12 4v8" stroke="white" strokeWidth="2"/>
                    <path d="M8 22L12 12l4 10H8z" fill="#a88ff3"/>
                </svg>
             </div>
          </div>
        </div>

        {/* Statistics Section */}
        <div className="mt-16 text-center">
            <h3 className="text-white/60 font-bold text-sm tracking-[0.1em] uppercase mb-12">
                {t('home.trustedBy')}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-10">
                <div className="flex flex-col items-center">
                    <div className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 to-purple-500 mb-2">
                        {t('home.stat1Value')}
                    </div>
                    <div className="text-white/60 font-medium text-lg">
                        {t('home.stat1Label')}
                    </div>
                </div>

                <div className="flex flex-col items-center md:border-l md:border-r border-white/10 px-4">
                    <div className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-purple-400 to-pink-500 mb-2">
                        {t('home.stat2Value')}
                    </div>
                    <div className="text-white/60 font-medium text-lg">
                        {t('home.stat2Label')}
                    </div>
                </div>

                <div className="flex flex-col items-center">
                    <div className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-pink-400 to-red-400 mb-2">
                        {t('home.stat3Value')}
                    </div>
                    <div className="text-white/60 font-medium text-lg">
                        {t('home.stat3Label')}
                    </div>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
