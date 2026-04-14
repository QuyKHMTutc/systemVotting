import { useTranslation } from 'react-i18next';
import { Facebook, Youtube, Github, Send } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="mt-auto border-t border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-black/20 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8 lg:gap-16">
          
          {/* Column 1: Contact Info */}
          <div className="md:col-span-4 lg:col-span-5 flex flex-col space-y-5 text-sm text-slate-600 dark:text-white/70 transition-colors">
            <h3 className="text-slate-800 dark:text-white font-bold text-lg mb-1">{t('footer.contactInfo')}</h3>
            <p className="leading-relaxed">
              <span className="font-semibold text-slate-800 dark:text-white/90">{t('footer.addressLabel')}</span> {t('footer.addressValue')}
            </p>
            <p>
              <span className="font-semibold text-slate-800 dark:text-white/90">{t('footer.phoneLabel')}</span> {t('footer.phoneValue')}
            </p>
            <p>
              <span className="font-semibold text-slate-800 dark:text-white/90">{t('footer.emailLabel')}</span> {t('footer.emailValue')}
            </p>
          </div>

          {/* Column 2: Policies & Terms */}
          <div className="md:col-span-4 lg:col-span-3 flex flex-col space-y-4 text-sm mt-4 md:mt-0 transition-colors">
            <h3 className="text-slate-800 dark:text-white font-bold text-lg mb-1">{t('footer.policiesTitle')}</h3>
            <ul className="space-y-4">
              <li>
                <Link to="/privacy" className="text-slate-600 dark:text-white/70 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-3 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-white/30"></span>
                  {t('footer.privacyPolicy')}
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-slate-600 dark:text-white/70 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-3 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-white/30"></span>
                  {t('footer.termsOfService')}
                </Link>
              </li>
              <li>
                <Link to="/" className="text-slate-600 dark:text-white/70 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-3 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-white/30"></span>
                  {t('footer.cancellationPolicy')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Social & Action */}
          <div className="md:col-span-4 lg:col-span-4 flex justify-center md:justify-end mt-4 md:mt-0">
            <div className="flex flex-col items-center space-y-5">
              <button className="w-full sm:w-auto px-10 bg-green-500 hover:bg-green-600 text-white font-bold py-3.5 rounded-xl transition-all hover:-translate-y-0.5 active:scale-95 shadow-[0_0_20px_rgba(34,197,94,0.3)] min-w-[200px]">
                {t('footer.connectNow')}
              </button>
              <div className="flex flex-wrap items-center justify-center gap-2 lg:gap-3 w-full">
                <a href="https://www.facebook.com/quykhmtutc/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-10 h-10 lg:w-11 lg:h-11 shrink-0 rounded-full bg-slate-200/50 dark:bg-white/5 flex items-center justify-center hover:bg-slate-300/50 dark:hover:bg-white/10 text-slate-500 hover:text-indigo-500 dark:text-white dark:hover:text-indigo-400 hover:shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all border border-slate-300/50 dark:border-white/10">
                  <Facebook size={18} strokeWidth={1.5} className="lg:w-5 lg:h-5" />
                </a>
                <a href="https://www.youtube.com/@guyguy20" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="w-10 h-10 lg:w-11 lg:h-11 shrink-0 rounded-full bg-slate-200/50 dark:bg-white/5 flex items-center justify-center hover:bg-slate-300/50 dark:hover:bg-white/10 text-slate-500 hover:text-pink-500 dark:text-white dark:hover:text-pink-400 hover:shadow-[0_0_15px_rgba(244,114,182,0.3)] transition-all border border-slate-300/50 dark:border-white/10">
                  <Youtube size={18} strokeWidth={1.5} className="lg:w-5 lg:h-5" />
                </a>
                <a href="https://www.tiktok.com/@muconghe" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="w-10 h-10 lg:w-11 lg:h-11 shrink-0 rounded-full bg-slate-200/50 dark:bg-white/5 flex items-center justify-center hover:bg-slate-300/50 dark:hover:bg-white/10 text-slate-500 hover:text-cyan-500 dark:text-white dark:hover:text-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all border border-slate-300/50 dark:border-white/10">
                  {/* TikTok icon approximation */}
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-[16px] h-[16px] lg:w-[18px] lg:h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                  </svg>
                </a>
                <a href="https://github.com/QuyKHMTutc" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="w-10 h-10 lg:w-11 lg:h-11 shrink-0 rounded-full bg-slate-200/50 dark:bg-white/5 flex items-center justify-center hover:bg-slate-300/50 dark:hover:bg-white/10 text-slate-500 hover:text-gray-900 dark:text-white dark:hover:text-gray-300 hover:shadow-[0_0_15px_rgba(209,213,219,0.3)] transition-all border border-slate-300/50 dark:border-white/10">
                  <Github size={18} strokeWidth={1.5} className="lg:w-5 lg:h-5" />
                </a>
                <a href="https://t.me/guysguy" target="_blank" rel="noopener noreferrer" aria-label="Telegram" className="w-10 h-10 lg:w-11 lg:h-11 shrink-0 rounded-full bg-slate-200/50 dark:bg-white/5 flex items-center justify-center hover:bg-slate-300/50 dark:hover:bg-white/10 text-slate-500 hover:text-blue-500 dark:text-white dark:hover:text-blue-400 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all border border-slate-300/50 dark:border-white/10">
                  <Send size={16} strokeWidth={1.5} className="ml-0.5 lg:w-[18px] lg:h-[18px]" />
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>
      
      {/* Bottom Copyright */}
      <div className="border-t border-slate-200 dark:border-white/10 bg-slate-200/50 dark:bg-black/40 py-5 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-xs sm:text-sm text-slate-500 dark:text-white/50 font-medium tracking-wide">
          {t('footer.copyright')}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
