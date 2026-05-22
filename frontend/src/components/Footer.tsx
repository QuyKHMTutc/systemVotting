import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Footer = () => {
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="mt-auto w-full flex flex-col">
      {/* Pre-Footer CTA Banner — chỉ hiện khi chưa đăng nhập */}
      {!isAuthenticated && (
      <div className="w-full bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 dark:from-indigo-900 dark:via-violet-900 dark:to-purple-900 py-10 px-6 relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="text-center md:text-left flex flex-col">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-1 tracking-tight">
              {t('footer.ctaTitle')}
            </h2>
            <p className="text-2xl md:text-3xl font-bold text-indigo-200 tracking-tight">
              {t('footer.ctaSubtitle')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link 
              to="/login" 
              className="px-6 py-2.5 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-bold rounded-lg hover:bg-white/20 transition-all duration-200 shadow-sm"
            >
              {t('footer.ctaLogin')}
            </Link>
            <Link 
              to="/register" 
              className="px-6 py-2.5 bg-white text-indigo-600 text-sm font-bold rounded-lg hover:bg-indigo-50 transition-all duration-200 shadow-md hover:shadow-indigo-500/25"
            >
              {t('footer.ctaRegister')}
            </Link>
          </div>
        </div>
      </div>
      )}

      <footer className="border-t border-purple-200/50 dark:border-white/10 bg-gradient-to-br from-indigo-100/60 via-purple-100/50 to-pink-100/60 dark:bg-none dark:bg-black/20 backdrop-blur-xl transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8 lg:gap-16">
          
          {/* Column 1: Location / Map */}
          <div className="md:col-span-4 lg:col-span-4 flex flex-col transition-colors">
            <div className="-mt-[21px] w-full h-44 sm:h-52 rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-lg dark:shadow-[0_0_15px_rgba(255,255,255,0.05)] bg-slate-100 dark:bg-white/5 relative group">
              <div className="absolute inset-0 bg-slate-200 dark:bg-slate-800 animate-pulse -z-10"></div>
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3724.096814183571!2d105.80262101533203!3d21.028811893153835!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135ab424a50fff9%3A0xbe3a7f3670c0a45f!2sUniversity%20of%20Transport%20and%20Communications!5e0!3m2!1sen!2s!4v1683884841124!5m2!1sen!2s" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen={true} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full object-cover transition-all duration-500 opacity-90 group-hover:opacity-100 dark:brightness-90 dark:contrast-[1.1] dark:saturate-[0.8]"
              ></iframe>
            </div>
          </div>

          {/* Column 2: Policies & Terms */}
          <div className="md:col-span-4 lg:col-span-4 flex flex-col items-start lg:items-center space-y-4 text-sm mt-4 md:mt-0 transition-colors">
            <div className="flex flex-col">
              <h3 className="text-slate-800 dark:text-white font-bold text-lg mb-5">{t('footer.policiesTitle')}</h3>
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
          </div>

          {/* Column 3: Contact Info */}
          <div className="md:col-span-4 lg:col-span-4 flex flex-col space-y-5 text-sm text-slate-600 dark:text-white/70 mt-4 md:mt-0 transition-colors lg:items-end">
            <div className="flex flex-col">
              <h3 className="text-slate-800 dark:text-white font-bold text-lg mb-4">{t('footer.contactInfo')}</h3>
              <div className="flex flex-col space-y-4">
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
            </div>
          </div>

        </div>
      </div>
      
      {/* Bottom Copyright */}
      <div className="border-t border-purple-200/50 dark:border-white/10 bg-white/30 dark:bg-black/40 py-5 transition-colors backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-xs sm:text-sm text-slate-500 dark:text-white/50 font-medium tracking-wide">
          {t('footer.copyright')}
        </div>
      </div>
    </footer>
    </div>
  );
};

export default Footer;
