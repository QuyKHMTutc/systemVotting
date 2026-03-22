type ModerationStatus = 'APPROVED' | 'REVIEW' | 'REJECTED' | undefined;

interface ModerationBadgeProps {
  status?: ModerationStatus;
  label?: string;
  confidence?: number;
  field?: string;
}

const getBadgeStyle = (status: ModerationStatus) => {
  switch (status) {
    case 'REVIEW':
      return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    case 'REJECTED':
      return 'bg-red-500/15 text-red-300 border-red-500/30';
    case 'APPROVED':
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    default:
      return 'bg-white/10 text-white/60 border-white/10';
  }
};

const labelize = (value?: string) => value ? value.replace(/_/g, ' ') : undefined;

export const ModerationBadge = ({ status, label, confidence, field }: ModerationBadgeProps) => {
  if (!status) return null;

  const details: string[] = [];
  if (label) details.push(labelize(label) || '');
  if (field) details.push(field);
  if (confidence !== undefined && confidence !== null) details.push(`${Math.round(confidence * 100)}%`);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border ${getBadgeStyle(status)}`}
      title={details.filter(Boolean).join(' • ')}
    >
      {status === 'REVIEW' ? 'Under review' : status === 'REJECTED' ? 'Rejected' : 'Approved'}
      {label && <span className="opacity-80">· {labelize(label)}</span>}
    </span>
  );
};
