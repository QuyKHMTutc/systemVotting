import { useState, useEffect } from 'react';
import { X, CheckCircle2, Zap, Crown, Shield, ArrowLeft, Scan } from 'lucide-react';
import { vnPayService } from '../../services/vnpay.service';
import { QRCodeSVG } from 'qrcode.react';
import { authService } from '../../services/auth.service';
import { useAuth } from '../../contexts/AuthContext';
import { createPortal } from 'react-dom';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan?: string;
}

export default function UpgradeModal({ isOpen, onClose, currentPlan = 'FREE' }: UpgradeModalProps) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [targetPlan, setTargetPlan] = useState<string | null>(null);
  const { updateUser } = useAuth();
  
  useEffect(() => {
    if (!qrUrl || !targetPlan) return;
    
    const interval = setInterval(async () => {
      try {
        const res = await authService.me();
        if (res?.code === 200 && res.data) {
          if (res.data.plan === targetPlan || res.data.plan === 'PLUS') {
            updateUser(res.data);
            onClose();
          }
        }
      } catch (e) {
        console.error("Polling error", e);
      }
    }, 3000);
    
    return () => clearInterval(interval);
  }, [qrUrl, targetPlan, onClose, updateUser]);

  useEffect(() => {
    if (isOpen) {
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.paddingRight = `${scrollBarWidth}px`;
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.paddingRight = '';
      document.body.style.overflow = '';
      setQrUrl(null);
      setTargetPlan(null);
      setLoadingPlan(null);
    }
    return () => {
      document.body.style.paddingRight = '';
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUpgrade = async (plan: 'GO' | 'PLUS') => {
    setLoadingPlan(plan);
    try {
      const url = await vnPayService.createPaymentUrl(plan);
      setQrUrl(url);
      setTargetPlan(plan);
    } catch (error) {
      console.error('Lỗi khi lấy link thanh toán:', error);
      alert('Không thể khởi tạo thanh toán VNPAY lúc này.');
    } finally {
      setLoadingPlan(null);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-fade-in perspective-[1000px]">
      <div 
        className="absolute inset-0 bg-slate-900/60 dark:bg-[#030712]/90 backdrop-blur-xl transition-opacity duration-500"
        onClick={onClose}
      />
      <div className="relative w-full max-w-5xl max-h-[95vh] bg-white/95 dark:bg-[#0b0f19]/95 border border-slate-200 dark:border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col transition-colors transform style-preserve-3d backdrop-blur-3xl overflow-hidden animate-modal-enter">
        
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/20 blur-[120px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/3 mix-blend-screen" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-pink-500/10 blur-[120px] rounded-full pointer-events-none translate-y-1/3 -translate-x-1/3 mix-blend-screen" />
        <div className="absolute inset-0 border-[1px] border-white/20 rounded-[2.5rem] pointer-events-none z-50"></div>

        <div className="relative z-10 p-6 sm:p-10 flex flex-col flex-1 overflow-y-auto custom-scrollbar">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-4xl font-black text-slate-900 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-white dark:to-white/70 tracking-tight">
                Gói Quyền Năng
              </h2>
              <p className="text-slate-500 dark:text-white/60 mt-3 font-medium text-lg">
                Mở khóa trải nghiệm tối đa. Thống trị phòng vote của bạn.
              </p>
            </div>
            <button 
              onClick={onClose}
              className="p-4 bg-slate-100/50 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-2xl text-slate-500 dark:text-white/60 hover:text-slate-800 dark:hover:text-white transition-all transform hover:rotate-90 active:scale-95 shrink-0 backdrop-blur-md"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {qrUrl ? (
            <div className="flex flex-col items-center justify-center py-6 animate-fade-in-up">
              <div className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-xl p-8 sm:p-10 rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] border border-slate-200/50 dark:border-white/10 flex flex-col items-center gap-8 relative w-full max-w-md transform transition-all hover:-translate-y-2">
                
                <div className="text-center space-y-2 flex flex-col items-center">
                  <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-4 text-indigo-600 dark:text-indigo-400">
                     <Scan className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Quét mã QR</h3>
                  <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Dùng App Ngân hàng hoặc VNPAY để quét</p>
                </div>
                
                <div className="relative p-5 rounded-3xl bg-white border-2 border-indigo-100 shadow-inner group overflow-hidden">
                   {/* Scanning Laser Animation */}
                   <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent animate-scan z-20 opacity-80 shadow-[0_0_8px_rgba(99,102,241,0.8)] filter blur-[1px]"></div>
                   
                   <QRCodeSVG 
                      value={qrUrl} 
                      size={240} 
                      level="Q"
                      className="rounded-xl shadow-sm z-10 relative" 
                   />
                </div>
                
                <div className="text-center w-full mt-2 space-y-4">
                   <div className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
                     <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                     <p className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">Hệ thống đang chờ lệnh thanh toán...</p>
                   </div>
                   
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                     <a 
                       href={qrUrl}
                       target="_blank"
                       rel="noreferrer"
                       className="flex items-center justify-center py-3.5 text-sm rounded-xl font-bold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/20 dark:hover:bg-indigo-500/30 text-indigo-600 dark:text-indigo-400 transition-colors border border-indigo-200 dark:border-indigo-500/30 shadow-sm"
                     >
                       Test VNPAY web
                     </a>

                     <button 
                       onClick={() => setQrUrl(null)} 
                       className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-white/80 transition-colors shadow-sm"
                     >
                       <ArrowLeft className="w-4 h-4" /> Đổi gói
                     </button>
                   </div>
                </div>

              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up">
              {/* FREE Plan */}
              <div className={`relative p-8 rounded-[2rem] border-2 ${currentPlan === 'FREE' ? 'border-slate-300 dark:border-white/20 bg-white/50 dark:bg-white/5' : 'border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/5'} backdrop-blur-md transition-all hover:border-slate-400 dark:hover:border-white/30 flex flex-col`}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3.5 bg-slate-200 dark:bg-white/10 rounded-2xl shadow-inner">
                    <Shield className="w-6 h-6 text-slate-600 dark:text-white/70" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">FREE</h3>
                </div>
                <div className="mb-8">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-slate-900 dark:text-white">0đ</span>
                  </div>
                  <p className="text-sm font-medium text-slate-500 dark:text-white/40 mt-1">Gói cơ bản trải nghiệm</p>
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                  <li className="flex items-start gap-3 text-slate-600 dark:text-white/70 font-semibold text-[15px]">
                    <CheckCircle2 className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                    Tối đa 200 lượt vote / phòng
                  </li>
                  <li className="flex items-start gap-3 text-slate-600 dark:text-white/70 font-semibold text-[15px]">
                    <CheckCircle2 className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                    Bảo mật chống spam cơ bản
                  </li>
                </ul>
                <button disabled className="w-full py-4 mt-auto rounded-xl font-bold bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-white/40 cursor-not-allowed">
                  {currentPlan === 'FREE' ? 'Gói hiện tại' : 'Mặc định'}
                </button>
              </div>

              {/* GO Plan */}
              <div className={`relative p-8 rounded-[2rem] border-2 ${currentPlan === 'GO' ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-900/20' : 'border-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10'} shadow-[0_20px_40px_-15px_rgba(99,102,241,0.2)] transition-all scale-100 md:scale-105 z-10 flex flex-col bg-white/80 dark:bg-[#111827]/80 backdrop-blur-xl card-hover-effect`}>
                {!currentPlan || currentPlan === 'FREE' ? (
                  <div className="absolute -top-4 right-6 px-4 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] font-black uppercase tracking-wider rounded-full shadow-lg shadow-indigo-500/30 animate-pulse-glow">
                    Phổ Biến
                  </div>
                ) : null}
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3.5 bg-indigo-500/20 rounded-2xl shadow-inner border border-indigo-500/20">
                    <Zap className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">GO</h3>
                </div>
                <div className="mb-8">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">50.000đ</span>
                    <span className="text-slate-500 font-medium">/phòng</span>
                  </div>
                  <p className="text-sm font-medium text-slate-500 dark:text-white/40 mt-1">Cho sự kiện cỡ trung bình</p>
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                  <li className="flex items-start gap-3 text-slate-800 dark:text-white/90 font-bold text-[15px]">
                    <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                    Tối đa <span className="text-indigo-600 dark:text-indigo-400 mx-1">1,000 lượt vote</span>
                  </li>
                  <li className="flex items-start gap-3 text-slate-700 dark:text-white/80 font-semibold text-[15px]">
                    <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                    Biểu đồ thời gian thực ưu tiên
                  </li>
                </ul>
                {currentPlan === 'GO' ? (
                  <button disabled className="w-full py-4 mt-auto rounded-xl font-bold bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-white/40 cursor-not-allowed">
                    Đang sử dụng
                  </button>
                ) : currentPlan === 'PLUS' ? (
                  <button disabled className="w-full py-4 mt-auto rounded-xl font-bold bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 cursor-not-allowed flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Đã bao gồm trong PLUS
                  </button>
                ) : (
                  <button 
                    onClick={() => handleUpgrade('GO')}
                    disabled={loadingPlan === 'GO'}
                    className="w-full py-4 mt-auto rounded-xl font-black tracking-wide text-white bg-indigo-600 hover:bg-indigo-700 shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] active:scale-[0.98] transition-all flex items-center justify-center"
                  >
                    {loadingPlan === 'GO' ? 'Đang tạo mã...' : 'Mua Gói GO'}
                  </button>
                )}
              </div>

              {/* PLUS Plan */}
              <div className={`relative p-8 rounded-[2rem] border-2 bg-slate-900 transition-transform duration-300 transform hover:-translate-y-2 flex flex-col overflow-hidden shadow-2xl
                 ${currentPlan === 'PLUS' ? 'border-emerald-500 shadow-emerald-500/20' : 'border-amber-500/40 hover:border-amber-400 shadow-amber-500/10'}`}>
                
                {/* Holographic background for VIP - optimized */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-slate-900/50 to-purple-500/10 pointer-events-none"></div>
                <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-50"></div>

                <div className="flex items-center gap-3 mb-6 relative z-10">
                  <div className="p-3.5 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500">PLUS</h3>
                </div>
                <div className="mb-8 relative z-10">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white tracking-tight">200.000đ</span>
                    <span className="text-amber-200/50 font-medium">/user</span>
                  </div>
                  <p className="text-sm font-medium text-amber-200/60 mt-1">Unlimited Power. Vĩnh Viễn.</p>
                </div>
                <ul className="space-y-4 mb-8 flex-1 relative z-10">
                  <li className="flex items-start gap-3 text-white font-bold text-[15px]">
                    <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 shadow-sm" />
                    <span className="text-amber-400">KHÔNG GIỚI HẠN</span> lượt vote
                  </li>
                  <li className="flex items-start gap-3 text-slate-300 font-semibold text-[15px]">
                    <CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    Xử lý concurrent traffic cực đại
                  </li>
                  <li className="flex items-start gap-3 text-slate-300 font-semibold text-[15px]">
                    <CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    Huy hiệu Crown Pro
                  </li>
                </ul>
                
                {currentPlan === 'PLUS' ? (
                  <button disabled className="w-full py-4 mt-auto rounded-xl font-bold bg-white/10 text-white/40 cursor-not-allowed">
                    Mở Khóa Tối Đa
                  </button>
                ) : (
                  <div className="relative mt-auto w-full group">
                     {/* The glowing border animation behind the button - optimized */}
                     <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 rounded-xl blur-md opacity-30 group-hover:opacity-70 transition duration-300"></div>
                     <button 
                       onClick={() => handleUpgrade('PLUS')}
                       disabled={loadingPlan === 'PLUS'}
                       className="relative w-full py-4 rounded-xl font-black tracking-wide text-amber-900 bg-gradient-to-r from-amber-300 to-yellow-500 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center transform-gpu"
                     >
                       {loadingPlan === 'PLUS' ? 'Đang tạo mã...' : 'Mua Gói PLUS'}
                     </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-10 text-center w-full flex items-center justify-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-md">
               <span className="text-sm font-semibold text-slate-500 dark:text-white/50">Thanh toán bảo mật bởi</span>
               <div className="h-4 w-px bg-slate-300 dark:bg-white/20"></div>
               <span className="font-black tracking-tight text-[#005ba6] dark:text-[#38bdf8] text-lg leading-none">VN<span className="text-[#ed1c24] dark:text-[#f43f5e]">PAY</span></span>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
