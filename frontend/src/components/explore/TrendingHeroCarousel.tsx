import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Flame, MessageCircle, Users, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Poll } from '../../services/poll.service';
import { endsIn } from '../../utils/date';

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(n);
}

// Generate a vivid gradient based on poll ID
function getHeroGradient(pollId: number): string {
  const gradients = [
    'from-[#1a0533] via-[#2d1b69] to-[#0d1b4b]',
    'from-[#0d2137] via-[#1a3a5c] to-[#0a1628]',
    'from-[#1a0a2e] via-[#2d0b5e] to-[#0e0a28]',
    'from-[#0a1f2e] via-[#0e3d50] to-[#071520]',
    'from-[#1a0020] via-[#3d0b4b] to-[#0d001a]',
  ];
  return gradients[pollId % gradients.length];
}

function getAccentColor(pollId: number): string {
  const accents = [
    'from-violet-500 to-fuchsia-500',
    'from-cyan-500 to-blue-600',
    'from-purple-500 to-pink-600',
    'from-teal-500 to-cyan-600',
    'from-rose-500 to-pink-600',
  ];
  return accents[pollId % accents.length];
}

export interface TrendingHeroCarouselProps {
  polls: Poll[];
  loading: boolean;
}

export function TrendingHeroCarousel({ polls, loading }: TrendingHeroCarouselProps) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);

  const safeIndex = polls.length ? Math.min(index, polls.length - 1) : 0;
  const featured = polls[safeIndex];

  useEffect(() => {
    setIndex((i) => (polls.length ? Math.min(i, polls.length - 1) : 0));
  }, [polls.length]);

  const next = useCallback(() => {
    if (!polls.length) return;
    setIndex((i) => (i + 1) % polls.length);
  }, [polls.length]);

  const prev = useCallback(() => {
    if (!polls.length) return;
    setIndex((i) => (i - 1 + polls.length) % polls.length);
  }, [polls.length]);

  useEffect(() => {
    if (polls.length <= 1) return;
    const id = window.setInterval(next, 6000);
    return () => window.clearInterval(id);
  }, [polls.length, next]);

  const totalVotes = useMemo(() => {
    if (!featured) return 0;
    return featured.options.reduce((s, o) => s + (o.voteCount ?? 0), 0);
  }, [featured]);

  if (loading) {
    return (
      <div
        id="explore-trending"
        className="relative overflow-hidden rounded-2xl bg-[#12101e] min-h-[280px] flex items-center justify-center"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
          <p className="text-white/40 text-sm">{t('dashboard.trendingToday')}</p>
        </div>
      </div>
    );
  }

  if (!featured) {
    return (
      <div
        id="explore-trending"
        className="relative overflow-hidden rounded-2xl bg-[#12101e] border border-dashed border-white/10 p-10 text-center"
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-violet-500/10 flex items-center justify-center">
          <Flame className="w-8 h-8 text-violet-400" />
        </div>
        <p className="text-white/60 mb-4 text-lg font-semibold">{t('dashboard.trendingEmpty')}</p>
        <Link
          to="/create-poll"
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-[#7B2FF7] to-[#F107A3] shadow-lg shadow-fuchsia-500/25 hover:opacity-95 transition-opacity"
        >
          {t('dashboard.createPoll')}
        </Link>
      </div>
    );
  }

  const comments = featured.commentCount ?? 0;
  const gradient = getHeroGradient(featured.id);
  const accent = getAccentColor(featured.id);
  const tags = featured.tags?.slice(0, 2) ?? [];

  return (
    <div
      id="explore-trending"
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} shadow-[0_0_80px_-20px_rgba(123,47,247,0.5)] border border-white/5 lg:h-[340px]`}
      style={{ minHeight: 280 }}
    >
      {/* Atmospheric glows */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_80%_20%,rgba(241,7,163,0.22),transparent)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_60%_at_10%_70%,rgba(123,47,247,0.25),transparent)] pointer-events-none" />

      {/* Abstract AI/Tech visual on right */}
      <div className="absolute right-0 top-0 bottom-0 w-[42%] pointer-events-none hidden lg:flex items-center justify-center overflow-hidden">
        {/* Background glow layers */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-gradient-to-br ${accent} opacity-25 blur-3xl`} />
        <div className="absolute top-6 right-6 w-28 h-28 rounded-full bg-fuchsia-500/20 blur-2xl animate-pulse" style={{ animationDuration: '3s' }} />
        <div className="absolute bottom-6 left-6 w-20 h-20 rounded-full bg-violet-500/25 blur-xl" />
        {/* Concentric rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 rounded-full border border-white/10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-52 h-52 rounded-full border border-white/[0.06]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full border border-white/[0.03]" />
        {/* Grid dots */}
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        {/* SVG central icon */}
        <div className="relative z-10 flex items-center justify-center">
          <div className={`w-28 h-28 rounded-3xl bg-gradient-to-br ${accent} opacity-80 flex items-center justify-center shadow-2xl`} style={{ boxShadow: '0 0 60px rgba(123,47,247,0.5)' }}>
            <svg viewBox="0 0 80 80" className="w-16 h-16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="40" cy="28" r="14" stroke="white" strokeWidth="2" strokeOpacity="0.9" />
              <circle cx="40" cy="28" r="7" fill="white" fillOpacity="0.3" />
              <circle cx="40" cy="28" r="3" fill="white" fillOpacity="0.9" />
              <path d="M20 55 Q40 42 60 55" stroke="white" strokeWidth="2" strokeOpacity="0.8" strokeLinecap="round" />
              <path d="M14 62 Q40 46 66 62" stroke="white" strokeWidth="1.5" strokeOpacity="0.5" strokeLinecap="round" />
              <line x1="40" y1="14" x2="40" y2="8" stroke="white" strokeWidth="2" strokeOpacity="0.7" strokeLinecap="round" />
              <circle cx="40" cy="6" r="2.5" fill="white" fillOpacity="0.9" />
              <line x1="30" y1="17" x2="24" y2="12" stroke="white" strokeWidth="1.5" strokeOpacity="0.5" strokeLinecap="round" />
              <line x1="50" y1="17" x2="56" y2="12" stroke="white" strokeWidth="1.5" strokeOpacity="0.5" strokeLinecap="round" />
            </svg>
          </div>
          {/* Orbiting dots */}
          <div className="absolute top-1/2 left-1/2" style={{ width: 120, height: 120, marginLeft: -60, marginTop: -60 }}>
            <div className="absolute w-3 h-3 rounded-full bg-fuchsia-400 shadow-lg shadow-fuchsia-500/60" style={{ top: 0, left: '50%', transform: 'translateX(-50%)', animation: 'orbit 4s linear infinite' }} />
            <div className="absolute w-2 h-2 rounded-full bg-violet-400 shadow-lg shadow-violet-500/60" style={{ bottom: 0, left: '50%', transform: 'translateX(-50%)', animation: 'orbit 4s linear infinite reverse' }} />
          </div>
        </div>
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row h-full min-h-[280px]">
        {/* Left content */}
        <div className="flex-1 p-6 sm:p-8 lg:p-10 flex flex-col h-full">
          {/* Badge */}
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-500/15 border border-orange-500/30 text-orange-300">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              {t('dashboard.trendingToday')}
            </span>
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/8 border border-white/10 text-white/70"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Title */}
          <div className="flex-1 flex flex-col justify-center py-2">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight mb-3 line-clamp-2 font-heading">
              {featured.title}
            </h2>
            <p className="text-white/55 text-sm sm:text-base line-clamp-2 max-w-lg">
              {featured.description?.trim() ? featured.description : t('dashboard.trendingFallbackDesc')}
            </p>
          </div>

          {/* CTA */}
          <div className="flex flex-wrap items-center gap-4 mb-5 lg:mb-6 mt-4">
            <Link
              to={`/poll/${featured.id}`}
              className={`inline-flex items-center justify-center px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r ${accent} shadow-lg hover:opacity-95 active:scale-[0.98] transition-all text-sm`}
            >
              {t('dashboard.trendingJoinNow')}
            </Link>
            {/* Avatars */}
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2.5">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded-full border-2 border-[#12101e] overflow-hidden bg-gradient-to-br ${getAccentColor(featured.id + i)}`}
                  >
                    <img
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${featured.id}-${i}`}
                      alt=""
                      className="w-full h-full object-cover opacity-90"
                    />
                  </div>
                ))}
              </div>
              <span className="text-white/50 text-xs">
                +{formatCompact(Math.max(totalVotes, 1))} {t('dashboard.trendingParticipants')}
              </span>
            </div>
          </div>

          {/* Dot indicators */}
          {polls.length > 1 && (
            <div className="flex items-center gap-1.5">
              {polls.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Slide ${i + 1}`}
                  onClick={() => setIndex(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === safeIndex ? 'w-8 bg-gradient-to-r from-violet-500 to-fuchsia-500' : 'w-1.5 bg-white/20 hover:bg-white/35'}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right stats panel */}
        <div className="lg:w-[280px] flex flex-row lg:flex-col items-stretch p-6 sm:p-8 lg:py-10 lg:pr-10 lg:pl-0 gap-4 border-t lg:border-t-0 lg:border-l border-white/[0.07] h-full">
          {/* Votes stat */}
          <div className="flex-1 rounded-2xl bg-black/20 border border-white/8 p-5 lg:p-6 flex flex-col justify-center gap-1.5 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-white/40 text-xs font-medium mb-1">
              <Users className="w-3.5 h-3.5" />
              {t('dashboard.trendingVotes')}
            </div>
            <div className="text-3xl lg:text-4xl font-black text-white font-heading tracking-tight">
              {formatCompact(totalVotes)}
            </div>
            <div className="text-white/30 text-xs">{t('dashboard.trendingVotes')}</div>
          </div>

          {/* Comments stat */}
          <div className="flex-1 rounded-2xl bg-black/20 border border-white/8 p-5 lg:p-6 flex flex-col justify-center gap-1.5 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-white/40 text-xs font-medium mb-1">
              <MessageCircle className="w-3.5 h-3.5" />
              {t('dashboard.trendingComments')}
            </div>
            <div className="text-3xl lg:text-4xl font-black text-white font-heading tracking-tight">
              {formatCompact(comments)}
            </div>
            <div className="text-white/30 text-xs">{t('dashboard.trendingComments')}</div>
          </div>

          {/* Time remaining */}
          <div className="hidden lg:flex shrink-0 rounded-xl bg-white/5 border border-white/8 px-4 py-3 items-center justify-center gap-2 text-sm text-white/60">
            <Clock className="w-4 h-4 text-violet-400 shrink-0" />
            <span className="truncate">{endsIn(featured.endTime)}</span>
          </div>
        </div>
      </div>

      {/* Prev/Next controls */}
      {polls.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/40 border border-white/10 text-white/70 hover:bg-black/60 hover:text-white transition-colors hidden sm:flex items-center justify-center"
            aria-label="Previous"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/40 border border-white/10 text-white/70 hover:bg-black/60 hover:text-white transition-colors hidden sm:flex items-center justify-center"
            aria-label="Next"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}
