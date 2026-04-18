import { useState, useEffect } from 'react';
import { X, CheckCircle2, Zap, Crown, Shield, ArrowLeft, Scan, Rocket } from 'lucide-react';
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

  const planLabel = (plan: string) => {
    switch (plan.toUpperCase()) {
      case 'FREE':
        return 'Starter';
      case 'GO':
        return 'Go';
      case 'PLUS':
        return 'Plus';
      case 'PRO':
        return 'Pro';
      default:
        return plan;
    }
  };

  const planTagline = (plan: string) => {
    switch (plan.toUpperCase()) {
      case 'FREE':
        return 'Bắt đầu nhanh, đủ dùng.';
      case 'GO':
        return 'Dành cho sự kiện vừa.';
      case 'PLUS':
        return 'Tối ưu cho người dùng thường xuyên.';
      case 'PRO':
        return 'Sự kiện lớn, tải cao.';
      default:
        return '';
    }
  };

  const planRank = (plan?: string | null) => {
    switch ((plan || 'FREE').toUpperCase()) {
      case 'GO':
        return 1;
      case 'PLUS':
        return 2;
      case 'PRO':
        return 3;
      case 'FREE':
      default:
        return 0;
    }
  };

  const isCurrentPlan = (plan: 'FREE' | 'GO' | 'PLUS' | 'PRO') =>
    (currentPlan || 'FREE').toUpperCase() === plan;

  const isIncludedByHigherPlan = (plan: 'FREE' | 'GO' | 'PLUS' | 'PRO') =>
    planRank(currentPlan) > planRank(plan);

  const ActionButton = ({
    variant,
    disabled,
    onClick,
    children,
  }: {
    variant: 'neutral' | 'primary' | 'amber' | 'fuchsia' | 'success';
    disabled?: boolean;
    onClick?: () => void;
    children: React.ReactNode;
  }) => {
    const base =
      'w-full py-4 mt-auto rounded-xl font-black tracking-wide transition-all flex items-center justify-center gap-2';
    const state = disabled ? 'cursor-not-allowed opacity-70' : 'active:scale-[0.98]';
    const styles: Record<typeof variant, string> = {
      neutral:
        'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-white/70',
      success:
        'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20',
      primary:
        'text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-[0_10px_30px_-15px_rgba(99,102,241,0.65)]',
      amber:
        'text-slate-900 bg-gradient-to-r from-amber-300 to-yellow-400 hover:brightness-110',
      fuchsia:
        'text-white bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 shadow-[0_10px_30px_-15px_rgba(217,70,239,0.65)]',
    };

    return (
      <button
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        className={`${base} ${styles[variant]} ${state}`}
      >
        {children}
      </button>
    );
  };
  
  useEffect(() => {
    if (!qrUrl || !targetPlan) return;
    
    const interval = setInterval(async () => {
      try {
        const res = await authService.me();
        if (res?.code === 200 && res.data) {
          if (planRank(res.data.plan) >= planRank(targetPlan)) {
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

  const handleUpgrade = async (plan: 'GO' | 'PLUS' | 'PRO') => {
    setLoadingPlan(plan);
    try {
      const url = await vnPayService.createPaymentUrl(plan);
      setQrUrl(url);
      setTargetPlan(plan);
    } catch (error: any) {
      const serverMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message;
      console.error('Lỗi khi lấy link thanh toán:', error);
      alert(serverMessage ? `Không thể khởi tạo thanh toán: ${serverMessage}` : 'Không thể khởi tạo thanh toán VNPAY lúc này.');
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
      <div className="relative w-full max-w-7xl max-h-[95vh] bg-white/95 dark:bg-[#0b0f19]/95 border border-slate-200 dark:border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col transition-colors transform style-preserve-3d backdrop-blur-3xl overflow-hidden animate-modal-enter">
        
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/20 blur-[120px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/3 mix-blend-screen" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-pink-500/10 blur-[120px] rounded-full pointer-events-none translate-y-1/3 -translate-x-1/3 mix-blend-screen" />
        <div className="absolute inset-0 border-[1px] border-white/20 rounded-[2.5rem] pointer-events-none z-50"></div>

        <div className="relative z-10 p-6 sm:p-10 flex flex-col flex-1 overflow-y-auto custom-scrollbar">
          <div className="flex justify-center items-center mb-6 relative">
            <h2 className="text-4xl font-black text-slate-900 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-white dark:to-white/70 tracking-tight text-center">
              Nâng cấp gói của bạn
            </h2>
            <button 
              onClick={onClose}
              className="absolute right-0 p-4 bg-slate-100/50 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-2xl text-slate-500 dark:text-white/60 hover:text-slate-800 dark:hover:text-white transition-all transform hover:rotate-90 active:scale-95 backdrop-blur-md"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up items-stretch">
              {/* FREE Plan */}
              <div className={`relative p-8 rounded-[2rem] border-2 ${currentPlan === 'FREE' ? 'border-slate-300 dark:border-white/20 bg-white/70 dark:bg-white/5' : 'border-slate-200 dark:border-white/5 bg-white/70 dark:bg-white/5'} backdrop-blur-xl transition-all hover:border-slate-400 dark:hover:border-white/30 flex flex-col overflow-hidden`}>
                <div className="absolute inset-0 bg-gradient-to-br from-slate-500/5 via-transparent to-indigo-500/5 pointer-events-none"></div>

                <div className="flex items-center justify-between gap-3 mb-6 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="p-3.5 bg-slate-200 dark:bg-white/10 rounded-2xl shadow-inner">
                    <Shield className="w-6 h-6 text-slate-600 dark:text-white/70" />
                    </div>
                    <div className="leading-tight">
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white">{planLabel('FREE')}</h3>
                      <p className="text-sm font-semibold text-slate-500 dark:text-white/50 mt-1">{planTagline('FREE')}</p>
                    </div>
                  </div>
                  <div className="px-3 py-1.5 rounded-full text-[11px] font-black tracking-wider uppercase bg-slate-900/5 dark:bg-white/10 text-slate-700 dark:text-white/70 border border-slate-200/60 dark:border-white/10">
                    Miễn phí
                  </div>
                </div>
                <div className="mb-8">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-slate-900 dark:text-white">0đ</span>
                  </div>
                  <p className="text-sm font-medium text-slate-500 dark:text-white/40 mt-1">Không cần thanh toán</p>
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                  <li className="flex items-start gap-3 text-slate-600 dark:text-white/70 font-semibold text-[15px]">
                    <CheckCircle2 className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                    <span>
                      Tối đa <span className="text-slate-900 dark:text-white font-black">100</span> lượt vote / phòng
                    </span>
                  </li>
                </ul>
                {isCurrentPlan('FREE') ? (
                  <ActionButton variant="success" disabled>
                    <CheckCircle2 className="w-5 h-5" />
                    Gói hiện tại của bạn
                  </ActionButton>
                ) : (
                  <ActionButton variant="neutral" disabled>
                    Mặc định
                  </ActionButton>
                )}
              </div>

              {/* GO Plan */}
              <div className={`relative p-8 rounded-[2rem] border-2 ${currentPlan === 'GO' ? 'border-indigo-500 bg-white/80 dark:bg-[#111827]/80' : 'border-indigo-300/70 bg-white/80 dark:bg-[#111827]/80'} shadow-[0_20px_50px_-20px_rgba(99,102,241,0.35)] transition-all z-10 flex flex-col backdrop-blur-xl card-hover-effect overflow-hidden`}>
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-purple-500/10 pointer-events-none"></div>

                {!currentPlan || currentPlan === 'FREE' ? (
                  <div className="absolute top-6 right-6 px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[10px] font-black uppercase tracking-wider rounded-full shadow-lg shadow-indigo-500/25">
                    Phổ biến
                  </div>
                ) : null}

                <div className="flex items-center gap-3 mb-6 relative z-10">
                  <div className="p-3.5 bg-indigo-500/15 rounded-2xl shadow-inner border border-indigo-500/20">
                    <Zap className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="leading-tight">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">{planLabel('GO')}</h3>
                    <p className="text-sm font-semibold text-slate-500 dark:text-white/50 mt-1">{planTagline('GO')}</p>
                  </div>
                </div>
                <div className="mb-8">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">50.000đ</span>
                    <span className="text-slate-500 font-medium">/tháng</span>
                  </div>
                  <p className="text-sm font-medium text-slate-500 dark:text-white/40 mt-1">Thanh toán theo tháng</p>
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                  <li className="flex items-start gap-3 text-slate-800 dark:text-white/90 font-bold text-[15px]">
                    <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                    <span>
                      Tối đa <span className="text-indigo-600 dark:text-indigo-400 mx-1">300</span> lượt vote / phòng
                    </span>
                  </li>
                </ul>
                {isCurrentPlan('GO') ? (
                  <ActionButton variant="success" disabled>
                    <CheckCircle2 className="w-5 h-5" />
                    Gói hiện tại của bạn
                  </ActionButton>
                ) : isIncludedByHigherPlan('GO') ? (
                  <ActionButton variant="neutral" disabled>
                    <CheckCircle2 className="w-5 h-5" />
                    Đã bao gồm trong gói {planLabel(currentPlan)}
                  </ActionButton>
                ) : (
                  <ActionButton
                    variant="primary"
                    onClick={() => handleUpgrade('GO')}
                    disabled={loadingPlan === 'GO'}
                  >
                    {loadingPlan === 'GO' ? 'Đang tạo mã...' : 'Nâng cấp lên Go'}
                  </ActionButton>
                )}
              </div>

              {/* PLUS Plan */}
              <div className={`relative p-8 rounded-[2rem] border-2 bg-slate-950 transition-transform duration-300 transform hover:-translate-y-2 flex flex-col overflow-hidden shadow-2xl
                 ${currentPlan === 'PLUS' ? 'border-amber-400 shadow-amber-500/20' : 'border-amber-500/35 hover:border-amber-400 shadow-amber-500/10'}`}>
                
                {/* Holographic background for VIP - optimized */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400/15 via-slate-950/60 to-purple-500/15 pointer-events-none"></div>
                <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-50"></div>

                <div className="flex items-center gap-3 mb-6 relative z-10">
                  <div className="p-3.5 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <div className="leading-tight">
                    <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-400">{planLabel('PLUS')}</h3>
                    <p className="text-sm font-semibold text-amber-200/70 mt-1">{planTagline('PLUS')}</p>
                  </div>
                </div>
                <div className="mb-8 relative z-10">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white tracking-tight">200.000đ</span>
                    <span className="text-amber-200/60 font-medium">/tháng</span>
                  </div>
                  <p className="text-sm font-medium text-amber-200/60 mt-1">Thanh toán theo tháng</p>
                </div>
                <ul className="space-y-4 mb-8 flex-1 relative z-10">
                  <li className="flex items-start gap-3 text-white font-bold text-[15px]">
                    <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 shadow-sm" />
                    <span>
                      Tối đa <span className="text-amber-400 mx-1">1,000</span> lượt vote / phòng
                    </span>
                  </li>
                </ul>
                
                {isCurrentPlan('PLUS') ? (
                  <ActionButton variant="success" disabled>
                    <CheckCircle2 className="w-5 h-5" />
                    Gói hiện tại của bạn
                  </ActionButton>
                ) : isIncludedByHigherPlan('PLUS') ? (
                  <ActionButton variant="neutral" disabled>
                    <CheckCircle2 className="w-5 h-5" />
                    Đã bao gồm trong gói {planLabel(currentPlan)}
                  </ActionButton>
                ) : (
                  <div className="relative mt-auto w-full group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400 rounded-xl blur-md opacity-30 group-hover:opacity-70 transition duration-300 pointer-events-none"></div>
                    <ActionButton
                      variant="amber"
                      onClick={() => handleUpgrade('PLUS')}
                      disabled={loadingPlan === 'PLUS'}
                    >
                      {loadingPlan === 'PLUS' ? 'Đang tạo mã...' : 'Nâng cấp lên Plus'}
                    </ActionButton>
                  </div>
                )}
              </div>

              {/* PRO Plan */}
              <div className={`relative p-8 rounded-[2rem] border-2 ${
                currentPlan === 'PRO'
                  ? 'border-fuchsia-500 bg-white/70 dark:bg-white/5'
                  : 'border-fuchsia-300/70 bg-white/70 dark:bg-white/5 hover:border-fuchsia-400'
              } backdrop-blur-xl transition-all hover:-translate-y-2 flex flex-col shadow-[0_20px_50px_-20px_rgba(217,70,239,0.35)] overflow-hidden`}>
                <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/10 via-transparent to-indigo-500/10 pointer-events-none"></div>
                <div className="absolute top-6 right-6 px-3.5 py-1.5 bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-wider rounded-full shadow-lg shadow-fuchsia-500/20">
                  Nâng cao
                </div>

                <div className="flex items-center gap-3 mb-6 relative z-10">
                  <div className="p-3.5 bg-fuchsia-500/15 rounded-2xl shadow-inner border border-fuchsia-500/20">
                    <Rocket className="w-6 h-6 text-fuchsia-600 dark:text-fuchsia-400" />
                  </div>
                  <div className="leading-tight">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">{planLabel('PRO')}</h3>
                    <p className="text-sm font-semibold text-slate-500 dark:text-white/50 mt-1">{planTagline('PRO')}</p>
                  </div>
                </div>

                <div className="mb-8 relative z-10">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">500.000đ</span>
                    <span className="text-slate-500 font-medium">/tháng</span>
                  </div>
                  <p className="text-sm font-medium text-slate-500 dark:text-white/40 mt-1">Thanh toán theo tháng</p>
                </div>

                <ul className="space-y-4 mb-8 flex-1 relative z-10">
                  <li className="flex items-start gap-3 text-slate-800 dark:text-white/90 font-bold text-[15px]">
                    <CheckCircle2 className="w-5 h-5 text-fuchsia-500 shrink-0 mt-0.5" />
                    <span>
                      Tối đa <span className="text-fuchsia-600 dark:text-fuchsia-400 mx-1">2,000</span> lượt vote / phòng
                    </span>
                  </li>
                </ul>

                {isCurrentPlan('PRO') ? (
                  <ActionButton variant="success" disabled>
                    <CheckCircle2 className="w-5 h-5" />
                    Gói hiện tại của bạn
                  </ActionButton>
                ) : (
                  <ActionButton
                    variant="fuchsia"
                    onClick={() => handleUpgrade('PRO')}
                    disabled={loadingPlan === 'PRO'}
                  >
                    {loadingPlan === 'PRO' ? 'Đang tạo mã...' : 'Nâng cấp lên Pro'}
                  </ActionButton>
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
