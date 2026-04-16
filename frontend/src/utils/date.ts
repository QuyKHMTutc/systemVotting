import i18n from '../i18n';

/**
 * Format relative time (e.g. "2h ago", "3d ago")
 */
export function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffSeconds < 60) return i18n.t('pollDetail.justNow');
  if (diffMinutes < 60) return i18n.t('pollDetail.mAgo', { count: diffMinutes });
  if (diffHours < 24) return i18n.t('pollDetail.hAgo', { count: diffHours });
  if (diffDays < 7) return i18n.t('pollDetail.dAgo', { count: diffDays });
  if (diffWeeks < 4) return i18n.t('pollDetail.wAgo', { count: diffWeeks });
  return date.toLocaleDateString();
}

/**
 * Format time until end (e.g. "Ends in 5h", "Ended")
 */
export function endsIn(endTime: string): string {
  const end = new Date(endTime);
  const now = new Date();
  const diffMs = end.getTime() - now.getTime();

  if (diffMs <= 0) return i18n.t('pollDetail.ended');

  const diffMinutes = Math.floor(diffMs / (60 * 1000));
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  if (diffMinutes < 60) return i18n.t('pollDetail.endsInM', { count: diffMinutes });
  if (diffHours < 24) return i18n.t('pollDetail.endsInH', { count: diffHours });
  return i18n.t('pollDetail.endsInD', { count: diffDays });
}
