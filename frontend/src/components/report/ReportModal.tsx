import { useState } from 'react';
import { createPortal } from 'react-dom';
import { reportService, ReportReasonType, ReportTargetType } from '../../services/report.service';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: number;
}

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, targetType, targetId }) => {
  const { t } = useTranslation();
  const [reason, setReason] = useState<ReportReasonType | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const closeModal = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setMessage(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) {
      setMessage({ type: 'error', text: t('reportModal.errorNoReason') });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);
    try {
      await reportService.createReport({
        targetType,
        targetId,
        reasonType: reason,
        description: description.trim() || undefined
      });
      setMessage({ type: 'success', text: t('reportModal.success') });
      setReason(null);
      setDescription('');
      setTimeout(closeModal, 900);
    } catch (error: any) {
      const errorData = error.response?.data;
      if (errorData?.message?.includes('Duplicate') || errorData?.code === 409) {
        setMessage({ type: 'error', text: t('reportModal.errorDuplicate') });
      } else {
        setMessage({ type: 'error', text: t('reportModal.errorGeneric') });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999]">
      <button
        type="button"
        aria-label={t('reportModal.close')}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={closeModal}
      />

      <div className="relative flex min-h-full items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
        <div className="w-full max-w-md rounded-2xl bg-white p-6 text-left shadow-2xl dark:bg-slate-800 border border-slate-100 dark:border-white/10 animate-fade-in-up">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-lg font-bold leading-6 text-slate-900 dark:text-white">
              {t('reportModal.title')}
            </h3>
            <button
              type="button"
              onClick={closeModal}
              className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
                
          <form onSubmit={handleSubmit} className="mt-4">
            <div className="space-y-3">
              <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
                {t('reportModal.desc')}
              </p>
                    
              <div className="space-y-2">
                {[
                  { key: ReportReasonType.SPAM, label: t('reportModal.reasonSpam') },
                  { key: ReportReasonType.HARASSMENT, label: t('reportModal.reasonHarassment') },
                  { key: ReportReasonType.HATE_SPEECH, label: t('reportModal.reasonHateSpeech') },
                  { key: ReportReasonType.FALSE_INFORMATION, label: t('reportModal.reasonFalseInfo') },
                  { key: ReportReasonType.INAPPROPRIATE_CONTENT, label: t('reportModal.reasonInappropriate') },
                  { key: ReportReasonType.OTHER, label: t('reportModal.reasonOther') }
                ].map(({ key, label }) => (
                  <label key={key} className={`group flex cursor-pointer items-center space-x-3 rounded-xl p-3 transition-all border ${
                    reason === key 
                      ? 'border-red-500 bg-red-50 dark:bg-red-500/10' 
                      : 'border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:border-slate-300 dark:hover:border-white/20'
                  }`}>
                    <input
                      type="radio"
                      name="reasonType"
                      value={key}
                      checked={reason === key}
                      onChange={() => setReason(key as ReportReasonType)}
                      className="h-4 w-4 cursor-pointer text-red-500 border-slate-300 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-700"
                    />
                    <span className={`text-sm font-medium transition-colors ${
                      reason === key ? 'text-red-700 dark:text-red-400' : 'text-slate-700 dark:text-slate-300'
                    }`}>
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('reportModal.detailsLabel')}
              </label>
              <textarea
                rows={3}
                maxLength={500}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('reportModal.detailsPlaceholder')}
                className="block w-full rounded-xl border border-slate-300 p-3 shadow-sm focus:border-red-500 focus:ring-red-500 focus:ring-2 focus:ring-opacity-20 transition-all sm:text-sm dark:border-slate-600 dark:bg-slate-900/50 dark:text-white"
              />
            </div>

            {message && (
              <p className={`mt-4 rounded-xl px-4 py-3 text-sm font-medium ${
                message.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                  : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-500/20'
              }`}>
                {message.text}
              </p>
            )}

            <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                className="inline-flex justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-colors dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                onClick={closeModal}
              >
                {t('reportModal.cancelBtn')}
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !reason}
                className="inline-flex justify-center rounded-xl border border-transparent bg-red-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-red-500 shadow-sm hover:shadow-md"
              >
                {isSubmitting ? t('reportModal.submittingBtn') : t('reportModal.submitBtn')}
              </button>
            </div>
          </form>
          </div>
      </div>
    </div>,
    document.body
  );
};
