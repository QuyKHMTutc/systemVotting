import { Facebook, Youtube, Github, Send } from 'lucide-react';

const socialLinks = [
  {
    name: 'Facebook',
    url: 'https://www.facebook.com/quykhmtutc/',
    icon: <Facebook size={18} strokeWidth={2} className="text-white" />,
    gradient: 'from-[#1877F2] to-[#3b82f6]',
    ringColor: 'border-blue-400'
  },
  {
    name: 'Youtube',
    url: 'https://www.youtube.com/@guyguy20',
    icon: <Youtube size={18} strokeWidth={2} className="text-white" />,
    gradient: 'from-[#FF0000] to-[#ef4444]',
    ringColor: 'border-red-400'
  },
  {
    name: 'TikTok',
    url: 'https://www.tiktok.com/@muconghe',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
      </svg>
    ),
    gradient: 'from-[#000000] to-[#333333] dark:from-slate-800 dark:to-slate-600',
    ringColor: 'border-slate-500'
  },
  {
    name: 'GitHub',
    url: 'https://github.com/QuyKHMTutc',
    icon: <Github size={18} strokeWidth={2} className="text-white" />,
    gradient: 'from-[#24292e] to-[#4b5563]',
    ringColor: 'border-gray-400'
  },
  {
    name: 'Telegram',
    url: 'https://t.me/guysguy',
    icon: <Send size={16} strokeWidth={2} className="ml-0.5 text-white" />,
    gradient: 'from-[#0088cc] to-[#38bdf8]',
    ringColor: 'border-sky-400'
  }
];

const FloatingSocial = () => {
  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 mt-24 z-50 flex flex-col gap-4">
      {socialLinks.map((link, idx) => (
        <a
          key={idx}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={link.name}
          className="relative group flex items-center justify-center w-10 h-10 rounded-full text-white shadow-lg transition-all duration-300 hover:scale-110"
        >
          {/* Tooltip on hover */}
          <span className="absolute right-14 bg-white dark:bg-slate-800 text-slate-800 dark:text-white px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shadow-xl opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 pointer-events-none border border-slate-100 dark:border-white/10">
            {link.name}
            {/* Tooltip Arrow */}
            <span className="absolute top-1/2 -translate-y-1/2 -right-1 w-2 h-2 bg-white dark:bg-slate-800 rotate-45 border-r border-t border-slate-100 dark:border-white/10 hidden md:block"></span>
          </span>

          {/* Pulsing rings effect matching brand color */}
          <div className={`absolute inset-0 rounded-full border ${link.ringColor} animate-[ping_2.5s_cubic-bezier(0,0,0.2,1)_infinite] opacity-50`}></div>
          <div className={`absolute -inset-1.5 rounded-full border ${link.ringColor} opacity-30`}></div>

          {/* Icon Container */}
          <div className={`relative z-10 w-full h-full rounded-full flex items-center justify-center bg-gradient-to-br ${link.gradient} shadow-inner`}>
            {link.icon}
          </div>
        </a>
      ))}
    </div>
  );
};

export default FloatingSocial;
