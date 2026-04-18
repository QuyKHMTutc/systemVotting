import { useState, useEffect, useRef } from 'react';
import { X, CheckCircle2, Zap, Crown, Shield, ArrowLeft, Rocket, ExternalLink, Clock, Sparkles, Star } from 'lucide-react';
import { vnPayService } from '../../services/vnpay.service';
import { QRCodeSVG } from 'qrcode.react';
import { authService } from '../../services/auth.service';
import { useAuth } from '../../contexts/AuthContext';
import { createPortal } from 'react-dom';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan?: string;
  onSuccess?: () => void; // callback khi thanh toán thành công (dùng để refresh payment history)
}

const QR_TTL = 15 * 60;

/* ── Countdown riêng để không re-render toàn modal mỗi giây ── */
function QrCountdown() {
  const [sec, setSec] = useState(QR_TTL);
  useEffect(() => {
    setSec(QR_TTL);
    const iv = setInterval(() => setSec(p => Math.max(0, p - 1)), 1000);
    return () => clearInterval(iv);
  }, []);
  const mm = String(Math.floor(sec / 60)).padStart(2, '0');
  const ss = String(sec % 60).padStart(2, '0');
  const pct = (sec / QR_TTL) * 100;
  const urgent = sec < 120;
  const warn = sec < 300;
  const color = urgent ? '#ef4444' : warn ? '#f59e0b' : '#10b981';
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-white/40">
          <Clock className="w-3.5 h-3.5" />
          <span>Mã hết hạn sau</span>
        </div>
        <span className="text-sm font-black tabular-nums" style={{ color }}>{mm}:{ss}</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

const PLANS = [
  {
    key: 'FREE' as const,
    name: 'Starter',
    tagline: 'Dành cho cá nhân',
    price: 'Miễn phí',
    priceDisplay: null as string | null,
    icon: <Shield className="w-5 h-5" />,
    votes: '100',
    features: ['100 lượt vote / phòng', 'Không giới hạn phòng', 'Kết quả thời gian thực'],
    colorFrom: '#64748b', colorTo: '#475569',
    glowColor: 'rgba(100,116,139,0)',
    badgeText: null as string | null,
    highlight: false,
  },
  {
    key: 'GO' as const,
    name: 'Go',
    tagline: 'Sự kiện vừa & nhỏ',
    price: '50.000đ',
    priceDisplay: '50.000',
    icon: <Zap className="w-5 h-5" />,
    votes: '300',
    features: ['300 lượt vote / phòng', 'Không giới hạn phòng', 'Kết quả thời gian thực', 'Ưu tiên hỗ trợ'],
    colorFrom: '#6366f1', colorTo: '#7c3aed',
    glowColor: 'rgba(99,102,241,0.35)',
    badgeText: 'Phổ biến',
    highlight: false,
  },
  {
    key: 'PLUS' as const,
    name: 'Plus',
    tagline: 'Người dùng thường xuyên',
    price: '200.000đ',
    priceDisplay: '200.000',
    icon: <Crown className="w-5 h-5" />,
    votes: '1,000',
    features: ['1,000 lượt vote / phòng', 'Không giới hạn phòng', 'Kết quả thời gian thực', 'Hỗ trợ ưu tiên cao', 'Thống kê nâng cao'],
    colorFrom: '#f59e0b', colorTo: '#f97316',
    glowColor: 'rgba(245,158,11,0.4)',
    badgeText: '⭐ Nổi bật',
    highlight: true,
  },
  {
    key: 'PRO' as const,
    name: 'Pro',
    tagline: 'Sự kiện lớn, tải cao',
    price: '500.000đ',
    priceDisplay: '500.000',
    icon: <Rocket className="w-5 h-5" />,
    votes: '2,000',
    features: ['2,000 lượt vote / phòng', 'Không giới hạn phòng', 'Kết quả thời gian thực', 'Hỗ trợ 24/7', 'Thống kê nâng cao', 'API access'],
    colorFrom: '#d946ef', colorTo: '#4f46e5',
    glowColor: 'rgba(217,70,239,0.35)',
    badgeText: 'Cao cấp',
    highlight: false,
  },
] as const;

type PlanKey = typeof PLANS[number]['key'];
const PLAN_MAP = Object.fromEntries(PLANS.map(p => [p.key, p])) as Record<PlanKey, typeof PLANS[number]>;
const planRank = (p?: string | null) => ({ FREE: 0, GO: 1, PLUS: 2, PRO: 3 }[(p || 'FREE').toUpperCase()] ?? 0);

export default function UpgradeModal({ isOpen, onClose, currentPlan = 'FREE', onSuccess }: UpgradeModalProps) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [targetPlan, setTargetPlan] = useState<PlanKey | null>(null);
  const [snapshotPlan, setSnapshotPlan] = useState<string>('FREE');
  const [syncedPlan, setSyncedPlan] = useState<string>(currentPlan || 'FREE');
  const [syncingPlan, setSyncingPlan] = useState(false);
  const openedAtRef = useRef<number>(0);
  const { updateUser } = useAuth();

  const activePlan = (syncedPlan || currentPlan || 'FREE').toUpperCase();
  const isCurrentPlan = (p: string) => activePlan === p.toUpperCase();
  const isHigherPlan = (p: string) => planRank(activePlan) > planRank(p);
  /* Sync plan thực từ server khi modal mở */
  useEffect(() => {
    if (!isOpen) return;
    setSyncingPlan(true);
    authService.me()
      .then(res => {
        if (res?.code === 200 && res.data) {
          let ud = res.data;
          // Normalize expired plan
          if (ud.plan && ud.plan !== 'FREE' && ud.planExpirationDate) {
            if (Date.now() >= new Date(ud.planExpirationDate).getTime()) {
              ud = { ...ud, plan: 'FREE', planExpirationDate: null };
            }
          }
          const sp = (ud.plan || 'FREE').toUpperCase();
          setSyncedPlan(sp);
          setSnapshotPlan(sp);
          updateUser(ud);
        }
      })
      .catch(() => {})
      .finally(() => setSyncingPlan(false));
  }, [isOpen]);

  /* Polling: phát hiện thanh toán thành công */
  useEffect(() => {
    if (!qrUrl || !targetPlan) return;
    const t = setTimeout(() => {
      const iv = setInterval(async () => {
        try {
          const res = await authService.me();
          if (
            res?.code === 200 && res.data &&
            planRank(res.data.plan) >= planRank(targetPlan) &&
            planRank(res.data.plan) > planRank(snapshotPlan)
          ) {
            updateUser(res.data);
            onSuccess?.(); // báo Profile refresh payment history
            onClose();
          }
        } catch {}
      }, 3000);
      return () => clearInterval(iv);
    }, 5000);
    return () => clearTimeout(t);
  }, [qrUrl, targetPlan, snapshotPlan]);

  /* Body scroll lock */
  useEffect(() => {
    if (isOpen) {
      openedAtRef.current = Date.now();
      const w = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.paddingRight = `${w}px`;
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.paddingRight = '';
      document.body.style.overflow = '';
      setQrUrl(null); setTargetPlan(null); setLoadingPlan(null);
    }
    return () => { document.body.style.paddingRight = ''; document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClose = () => {
    if (Date.now() - openedAtRef.current < 500) return;
    onClose();
  };

  const handleUpgrade = async (plan: 'GO' | 'PLUS' | 'PRO') => {
    if (planRank(activePlan) >= planRank(plan)) {
      alert(`Bạn đang dùng gói ${PLAN_MAP[activePlan as PlanKey]?.name || activePlan}. Hãy làm mới trang nếu vừa thanh toán.`);
      return;
    }
    setLoadingPlan(plan);
    try {
      const url = await vnPayService.createPaymentUrl(plan);
      setSnapshotPlan(activePlan);
      setQrUrl(url);
      setTargetPlan(plan);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message;
      alert(msg ? `Không thể tạo thanh toán: ${msg}` : 'Không thể khởi tạo thanh toán lúc này.');
    } finally { setLoadingPlan(null); }
  };

  const meta = targetPlan ? PLAN_MAP[targetPlan] : null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      onClick={handleBackdropClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-xl pointer-events-none" />

      {/* ── Modal shell ── */}
      <div
        className={[
          'relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl overflow-hidden',
          // Light mode: clean white card
          'bg-white border border-slate-200/80 shadow-[0_32px_80px_rgba(0,0,0,0.18)]',
          // Dark mode: deep dark glass
          'dark:bg-[#0f0c1d] dark:border-white/[0.07] dark:shadow-[0_50px_120px_rgba(0,0,0,0.8)]',
        ].join(' ')}
        onClick={e => e.stopPropagation()}
      >
        {/* Ambient glow — dark only */}
        <div className="hidden dark:block absolute top-0 right-0 w-[350px] h-[250px] bg-violet-600/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="hidden dark:block absolute bottom-0 left-0 w-[250px] h-[200px] bg-indigo-600/8 blur-[80px] rounded-full pointer-events-none" />

        {/* Light mode soft gradient top bar */}
        <div className="dark:hidden absolute inset-x-0 top-0 h-1 rounded-t-3xl bg-gradient-to-r from-violet-500 via-indigo-500 to-purple-500" />

        {/* ── HEADER ── */}
        <div className="relative flex items-center justify-between px-6 pt-6 pb-5 shrink-0 border-b border-slate-100 dark:border-white/[0.06]">
          <div className="flex items-center gap-3">
            {qrUrl && (
              <button
                onClick={() => setQrUrl(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:text-white/40 dark:hover:text-white dark:hover:bg-white/8 transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <Sparkles className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400" />
                <span className="text-[11px] font-black uppercase tracking-[0.15em] text-violet-500 dark:text-violet-400">
                  {qrUrl ? 'Thanh toán' : 'Nâng cấp tài khoản'}
                </span>
              </div>
              <h2 className="text-xl font-black text-slate-800 dark:text-white leading-tight">
                {qrUrl ? `Xác nhận gói ${meta?.name}` : 'Chọn gói phù hợp với bạn'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:text-white/40 dark:hover:text-white dark:hover:bg-white/8 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── CONTENT ── */}
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
          {/* Syncing indicator */}
          {syncingPlan && !qrUrl && (
            <div className="flex items-center justify-center gap-2 py-2.5 text-slate-400 dark:text-white/30 text-xs">
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Đang đồng bộ thông tin gói...
            </div>
          )}

          {qrUrl && meta ? (
            /* ── QR PAYMENT ── */
            <div className="flex flex-col md:flex-row min-h-[420px]">
              {/* LEFT — Tóm tắt */}
              <div className="md:w-60 shrink-0 p-6 flex flex-col gap-4 border-b md:border-b-0 md:border-r border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-transparent">
                {/* Plan mini card */}
                <div className="rounded-2xl p-4 bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
                      style={{ background: `linear-gradient(135deg, ${meta.colorFrom}, ${meta.colorTo})` }}
                    >
                      {meta.icon}
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest font-black text-slate-400 dark:text-white/30">Gói đang mua</p>
                      <p className="text-base font-black" style={{ background: `linear-gradient(135deg, ${meta.colorFrom}, ${meta.colorTo})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{meta.name}</p>
                    </div>
                  </div>
                  <div className="space-y-1.5 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 dark:text-white/40">Giá thuê bao</span>
                      <span className="font-black" style={{ background: `linear-gradient(135deg, ${meta.colorFrom}, ${meta.colorTo})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{meta.price}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 dark:text-white/40">Chu kỳ</span>
                      <span className="font-semibold text-slate-600 dark:text-white/60">1 tháng</span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                      <span className="font-bold text-slate-600 dark:text-white/70">Tổng cộng</span>
                      <span className="font-black" style={{ background: `linear-gradient(135deg, ${meta.colorFrom}, ${meta.colorTo})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{meta.price}</span>
                    </div>
                  </div>
                </div>

                {/* Countdown */}
                <div className="rounded-2xl p-3.5 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.07]">
                  <QrCountdown />
                </div>

                {/* Steps */}
                <div className="flex flex-col gap-2.5">
                  {['Mở App Ngân hàng hoặc VNPAY', 'Chọn "Quét QR" / "Thanh toán QR"', 'Quét mã bên cạnh', 'Xác nhận thanh toán'].map((s, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5 bg-slate-100 dark:bg-white/[0.07] text-slate-500 dark:text-white/40">
                        {i + 1}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-white/40 leading-relaxed">{s}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT — QR */}
              <div className="flex-1 flex flex-col items-center justify-center p-8 gap-5">
                {/* QR with gradient border */}
                <div className="relative rounded-3xl p-1.5" style={{
                  background: `linear-gradient(135deg, ${meta.colorFrom}, ${meta.colorTo})`,
                  boxShadow: `0 0 60px -10px ${meta.glowColor}`,
                }}>
                  <div className="bg-white rounded-[18px] p-3 relative overflow-hidden">
                    <div
                      className="absolute left-0 w-full h-0.5 z-10 animate-scan"
                      style={{
                        background: `linear-gradient(90deg, transparent, ${meta.colorFrom}, transparent)`,
                        opacity: 0.9,
                        boxShadow: `0 0 10px ${meta.colorFrom}`,
                      }}
                    />
                    <QRCodeSVG value={qrUrl} size={196} level="Q" className="rounded-xl relative z-0 block" />
                  </div>
                </div>

                {/* Waiting */}
                <div className="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-emerald-50 dark:bg-emerald-500/8 border border-emerald-200 dark:border-emerald-500/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" style={{ boxShadow: '0 0 8px rgba(16,185,129,0.7)' }} />
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold text-sm">Đang chờ xác nhận từ ngân hàng...</span>
                </div>

                {/* Open link */}
                <a
                  href={qrUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 dark:text-white/50 dark:hover:text-white dark:bg-white/[0.05] dark:hover:bg-white/[0.09] border border-slate-200 dark:border-white/[0.08] transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  Không quét được? Mở link thanh toán
                </a>

                {/* Trust */}
                <div className="flex items-center gap-3 text-[11px] text-slate-400 dark:text-white/25 font-semibold">
                  <span>🔒 Bảo mật SSL</span>
                  <span>·</span>
                  <span className="font-black">VN<span className="text-red-500">PAY</span></span>
                  <span>·</span>
                  <span>⚡ Kích hoạt ngay</span>
                </div>
              </div>
            </div>
          ) : (
            /* ── PLAN SELECTION ── */
            <div className="p-6">
              {/* Current plan banner */}
              {activePlan !== 'FREE' && (
                <div className="mb-5 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.07] text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-slate-500 dark:text-white/50">Gói hiện tại: </span>
                  <span className="font-black text-slate-700 dark:text-white">{PLAN_MAP[activePlan as PlanKey]?.name || activePlan}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {PLANS.map(plan => {
                  const isCurrent = isCurrentPlan(plan.key);
                  const isIncluded = isHigherPlan(plan.key);
                  const canUpgrade = !isCurrent && !isIncluded && plan.key !== 'FREE';
                  const gradientBg = `linear-gradient(135deg, ${plan.colorFrom}, ${plan.colorTo})`;

                  return (
                    <div
                      key={plan.key}
                      className={[
                        'relative flex flex-col rounded-2xl overflow-hidden transition-all duration-200',
                        // Light base
                        'bg-white border',
                        // Dark base
                        plan.highlight
                          ? 'dark:bg-[#160f2a]'
                          : 'dark:bg-white/[0.03]',
                        // Border
                        isCurrent
                          ? 'border-slate-300 dark:border-white/20'
                          : plan.highlight
                            ? 'border-amber-200 dark:border-amber-500/30'
                            : 'border-slate-200 dark:border-white/[0.07]',
                        // Hover
                        canUpgrade ? 'hover:-translate-y-1 hover:shadow-lg cursor-pointer' : '',
                        // Shadow
                        plan.highlight ? 'shadow-[0_8px_32px_rgba(245,158,11,0.12)] dark:shadow-[0_8px_40px_rgba(245,158,11,0.15)]' : '',
                      ].join(' ')}
                    >
                      {/* Active border accent */}
                      {isCurrent && (
                        <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: gradientBg }} />
                      )}
                      {/* Highlight glow line */}
                      {plan.highlight && !isCurrent && (
                        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 opacity-70" />
                      )}

                      {/* Badge */}
                      {plan.badgeText && (
                        <div className="absolute top-3.5 right-3.5">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black text-white" style={{ background: gradientBg }}>
                            {plan.badgeText}
                          </span>
                        </div>
                      )}

                      <div className="p-5 flex flex-col flex-1">
                        {/* Icon + name */}
                        <div className="flex items-center gap-3 mb-4">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
                            style={{ background: gradientBg }}
                          >
                            {plan.icon}
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-slate-800 dark:text-white leading-tight">{plan.name}</h3>
                            <p className="text-[11px] text-slate-400 dark:text-white/35 mt-0.5">{plan.tagline}</p>
                          </div>
                        </div>

                        {/* Price */}
                        <div className="mb-4">
                          {plan.priceDisplay ? (
                            <div className="flex items-baseline gap-0.5">
                              <span className="text-2xl font-black text-slate-800 dark:text-white">{plan.priceDisplay}<span className="text-base">đ</span></span>
                              <span className="text-xs text-slate-400 dark:text-white/35 font-medium ml-1">/tháng</span>
                            </div>
                          ) : (
                            <span className="text-xl font-black text-slate-400 dark:text-white/50">Miễn phí</span>
                          )}
                        </div>

                        {/* Votes */}
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-4 bg-slate-50 dark:bg-white/[0.04] border border-slate-100 dark:border-white/[0.06]">
                          <Star className="w-3.5 h-3.5 text-slate-300 dark:text-white/25 shrink-0" />
                          <span className="text-xs text-slate-400 dark:text-white/40">Tối đa</span>
                          <span className="text-sm font-black" style={{ background: gradientBg, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            {plan.votes}
                          </span>
                          <span className="text-xs text-slate-400 dark:text-white/40">vote/phòng</span>
                        </div>

                        {/* Features */}
                        <ul className="space-y-2 mb-5 flex-1">
                          {plan.features.map((f, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-slate-500 dark:text-white/50">
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: `${plan.colorFrom}99` }} />
                              {f}
                            </li>
                          ))}
                        </ul>

                        {/* CTA */}
                        <div className="mt-auto">
                          {isCurrent ? (
                            <button disabled className="w-full py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/25">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Gói hiện tại của bạn
                            </button>
                          ) : isIncluded ? (
                            <button disabled className="w-full py-2.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-white/[0.04] text-slate-400 dark:text-white/25">
                              Đã bao gồm trong gói của bạn
                            </button>
                          ) : plan.key === 'FREE' ? (
                            <button disabled className="w-full py-2.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-white/[0.04] text-slate-400 dark:text-white/25">
                              Mặc định
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpgrade(plan.key)}
                              disabled={loadingPlan === plan.key}
                              className="w-full py-2.5 rounded-xl text-xs font-black text-white transition-all active:scale-[0.98] disabled:opacity-60 hover:brightness-110"
                              style={{
                                background: gradientBg,
                                boxShadow: `0 4px 20px -5px ${plan.glowColor}`,
                              }}
                            >
                              {loadingPlan === plan.key ? (
                                <span className="flex items-center justify-center gap-1.5">
                                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                  </svg>
                                  Đang tạo mã...
                                </span>
                              ) : `Nâng cấp lên ${plan.name} →`}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── FOOTER ── */}
        <div className="shrink-0 px-6 py-3.5 flex items-center justify-between border-t border-slate-100 dark:border-white/[0.05] bg-slate-50/50 dark:bg-transparent">
          <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-white/25 font-medium">
            <span>Thanh toán bởi</span>
            <span className="font-black text-sm text-[#005ba6] dark:text-[#005ba6]/60">VN<span className="text-[#ed1c24] dark:text-[#ed1c24]/60">PAY</span></span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400 dark:text-white/20 font-medium">
            <span>🔒 SSL bảo mật</span>
            <span className="text-slate-200 dark:text-white/10">·</span>
            <span>⚡ Kích hoạt ngay</span>
            <span className="text-slate-200 dark:text-white/10">·</span>
            <span>✕ Hủy bất cứ lúc nào</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
