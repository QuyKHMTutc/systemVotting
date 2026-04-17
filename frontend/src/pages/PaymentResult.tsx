import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, User, ArrowRight, Loader2, Sparkles, ShieldCheck } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/auth.service';


export default function PaymentResult() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [planType, setPlanType] = useState<string>('');
  const location = useLocation();
  const navigate = useNavigate();
  const { updateUser } = useAuth();

  useEffect(() => {
    const verifyPayment = async () => {
      const searchParams = new URLSearchParams(location.search);
      const vnp_ResponseCode = searchParams.get('vnp_ResponseCode');

      if (!vnp_ResponseCode) {
        setStatus('error');
        setMessage('Không tìm thấy dữ liệu giao dịch hợp lệ.');
        return;
      }

      if (vnp_ResponseCode !== '00') {
        setStatus('error');
        setMessage('Giao dịch đã bị hủy hoặc thanh toán không thành công.');
        return;
      }

      try {
        const response = await api.get(`/payments/vnpay-return${location.search}`);
        if (response.data.success) {
          setStatus('success');
          setMessage('Thanh toán thành công! Giao dịch của bạn đã được xác nhận.');
          
          // Refresh user state globally!
          const userRes = await authService.me();
          if (userRes?.code === 200 && userRes.data) {
            updateUser(userRes.data);
            setPlanType(userRes.data.plan || 'PLUS');
          }
          
        } else {
          setStatus('error');
          setMessage(response.data.message || 'Xác thực chữ ký thất bại.');
        }
      } catch (error: any) {
        console.error('Error verifying payment:', error);
        setStatus('error');
        setMessage('Lỗi kết nối máy chủ khi xác thực thanh toán.');
      }
    };

    verifyPayment();
  }, [location.search, updateUser]);

  return (
    <div className="h-screen w-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-50 dark:bg-[#0b0f19]">
      {/* Background Orbs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/20 blur-[120px] rounded-full pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-pink-500/20 blur-[120px] rounded-full pointer-events-none mix-blend-screen" />

      <div className="relative z-10 w-full max-w-lg mb-20 animate-fade-in-up">
        <div className={`glass-panel p-8 sm:p-12 rounded-[2.5rem] text-center shadow-2xl transition-all duration-700
            ${status === 'success' ? 'border-emerald-500/30' : ''}
            ${status === 'error' ? 'border-red-500/30' : ''}
          `}>
          
          {status === 'loading' && (
            <div className="flex flex-col items-center">
              <div className="relative w-24 h-24 flex items-center justify-center mb-8">
                <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 dark:border-indigo-400/10"></div>
                <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
                <Loader2 className="w-8 h-8 text-indigo-500 animate-pulse" />
              </div>
              <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-3">Đang xác thực...</h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Hệ thống đang kết nối an toàn với VNPay.<br/>Vui lòng không tắt giao diện này!</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-emerald-500 blur-2xl opacity-20 animate-pulse-glow" />
                <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.4)] relative z-10 scale-110">
                  <CheckCircle2 className="w-12 h-12 text-white" />
                </div>
              </div>
              
              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300 mb-2">Thanh toán Thành Công!</h2>
              <p className="text-slate-600 dark:text-slate-300 font-medium mb-8 leading-relaxed max-w-sm">{message}</p>
              
              {/* Premium VIP Pass */}
              <div className="w-full bg-gradient-to-r from-slate-900 to-slate-800 p-1 rounded-2xl mb-8 animate-border-glow shadow-xl transform hover:scale-[1.02] transition-transform duration-300 hologram-effect">
                 <div className="bg-slate-900 px-6 py-5 rounded-2xl h-full w-full flex flex-col items-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                       <ShieldCheck className="w-24 h-24 text-white" />
                    </div>
                    <span className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-1 z-10"><Sparkles className="w-3 h-3 text-amber-400"/> Gói hiện tại của bạn</span>
                    <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 z-10">{planType || 'VIP MEMBER'}</h3>
                 </div>
              </div>
              
              <button
                onClick={() => navigate('/profile')}
                className="w-full flex items-center justify-center gap-2 py-4 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl font-black tracking-wide shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] transition-all transform hover:-translate-y-1"
              >
                <User className="w-5 h-5" />
                Vào Trình Quản Lý Tài Khoản
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-red-500 blur-2xl opacity-20 animate-pulse-glow" />
                <div className="w-24 h-24 bg-gradient-to-br from-red-400 to-rose-600 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(225,29,72,0.4)] relative z-10">
                  <XCircle className="w-12 h-12 text-white" />
                </div>
              </div>
              <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-2 text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-rose-500 dark:from-red-400 dark:to-rose-400">Giao dịch Thất Bại</h2>
              <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-4 rounded-xl mb-8 w-full">
                <p className="text-red-600 dark:text-red-400 font-semibold">{message}</p>
              </div>
              
              <button
                onClick={() => navigate('/')}
                className="w-full flex items-center justify-center gap-2 py-4 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-800 dark:text-white rounded-2xl font-bold transition-all hover:scale-[1.02]"
              >
                Trở về Ngoại trang
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
