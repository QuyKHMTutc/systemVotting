import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';


const Footer = () => {
  const { t } = useTranslation();

  return (
    <div className="mt-auto w-full flex flex-col">


      <footer className="border-t border-purple-200/50 dark:border-white/10 bg-gradient-to-br from-indigo-100/60 via-purple-100/50 to-pink-100/60 dark:bg-none dark:bg-black/20 backdrop-blur-xl transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8 lg:gap-16">
          
          {/* Column 1: Location / Map */}
          <div className="md:col-span-4 lg:col-span-4 flex flex-col transition-colors">
            <div className="-mt-[21px] w-full h-44 sm:h-52 rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-lg dark:shadow-[0_0_15px_rgba(255,255,255,0.05)] bg-slate-100 dark:bg-white/5 relative group">
              <div className="absolute inset-0 bg-slate-200 dark:bg-slate-800 animate-pulse -z-10"></div>
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3725.268!2d105.8075731!3d21.0176142!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135ab6724737fe3%3A0x8dd2bf50c254d201!2s99%20%C4%90.%20Nguy%E1%BB%85n%20Ch%C3%AD%20Thanh%2C%20L%C3%A1ng%2C%20H%C3%A0%20N%E1%BB%99i%20100000%2C%20Vi%E1%BB%87t%20Nam!5e0!3m2!1svi!2svn!4v1717310000000!5m2!1svi!2svn" 
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
                  <Link to="/refund" className="text-slate-600 dark:text-white/70 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-3 font-medium">
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
