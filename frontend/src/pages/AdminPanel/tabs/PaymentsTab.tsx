import React from 'react';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Pagination } from '../../../components/common/Pagination';
import type { AdminPaymentHistory } from '../../../services/payment.service';

interface PaymentsTabProps {
  payments: AdminPaymentHistory[];
  pagePayments: number;
  setPagePayments: (p: number) => void;
  totalPagesPayments: number;
  fetchPayments: (p: number) => void;
}

const PaymentsTab: React.FC<PaymentsTabProps> = ({
  payments, pagePayments, setPagePayments, totalPagesPayments, fetchPayments
}) => {
  return (
    <div className="rounded-2xl border border-white/10 overflow-hidden animate-fade-in-up shadow-xl" style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(12px)' }}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.01] text-white/40 text-xs uppercase tracking-wider">
              {['#', 'Txn Ref', 'User', 'Plan', 'Amount', 'Status', 'Date'].map((h) => (
                <th key={h} className={`px-6 py-4 font-semibold text-left`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {payments.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-16 text-center text-white/30">No transactions found.</td></tr>
            ) : payments.map((p, i) => (
              <tr key={p.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 text-white/30 text-xs">{pagePayments * 20 + i + 1}</td>
                <td className="px-6 py-4">
                  <span className="font-mono text-xs text-violet-300 bg-violet-500/10 px-2.5 py-1 rounded-md border border-violet-500/20">
                    {p.txnRef}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white shadow-inner"
                      style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)' }}>
                      {p.username[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{p.username}</p>
                      <p className="text-white/40 text-xs">{p.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                    p.targetPlan === 'PRO' ? 'text-yellow-400 bg-yellow-400/10'
                    : p.targetPlan === 'PLUS' ? 'text-blue-400 bg-blue-400/10'
                    : p.targetPlan === 'GO' ? 'text-emerald-400 bg-emerald-400/10'
                    : 'text-white/40 bg-white/10'
                  }`}>{p.targetPlan}</span>
                </td>
                <td className="px-6 py-4"><span className="text-white font-semibold">{p.amount.toLocaleString('vi-VN')}đ</span></td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${
                    p.status === 'SUCCESS' ? 'text-emerald-400 bg-emerald-400/10'
                    : p.status === 'FAILED' ? 'text-red-400 bg-red-400/10'
                    : 'text-yellow-400 bg-yellow-400/10'
                  }`}>
                    {p.status === 'SUCCESS' ? <CheckCircle2 size={12} />
                    : p.status === 'FAILED' ? <XCircle size={12} />
                    : <Clock size={12} />}
                    {p.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-white/50 text-xs">
                  {new Date(p.createdAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={pagePayments} totalPages={totalPagesPayments} onPageChange={(p) => { setPagePayments(p); fetchPayments(p); }} />
    </div>
  );
};

export default PaymentsTab;
