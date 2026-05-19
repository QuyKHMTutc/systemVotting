import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { useLocation, useNavigationType } from 'react-router-dom';

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();
  const navType = useNavigationType();

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  // Tuỳ chỉnh quan trọng: Khi chuyển trang, tự động kéo cuộn lên trên cùng (ngoại trừ khi nhấn nút quay lại)
  useEffect(() => {
    if (navType !== 'POP') {
      const timer = setTimeout(() => {
        window.scrollTo(0, 0);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, navType]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // Chỉ hiển thị ở trang chủ theo ý người dùng
  if (location.pathname !== '/') {
    return null;
  }

  return (
    <>
      {isVisible && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-10 right-8 z-[999] p-3 rounded-full bg-[#68D391] hover:bg-[#48bb78] shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 flex items-center justify-center animate-fade-in-up"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-5 h-5 text-slate-900" strokeWidth={2.5} />
        </button>
      )}
    </>
  );
}
