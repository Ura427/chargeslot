import { tv } from 'tailwind-variants';
import { speedTier } from '../lib/power';

const badge = tv({
  base: 'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
  variants: {
    tone: {
      slow: 'bg-slate-100 text-tier-slow',
      fast: 'bg-blue-50 text-tier-fast',
      ultra: 'bg-violet-50 text-tier-ultra',
    },
    solid: { true: 'bg-white/95 shadow-sm' },
  },
});

interface SpeedBadgeProps {
  powerKw: number;
  // For placing on top of a photo.
  solid?: boolean;
  showKw?: boolean;
}

export function SpeedBadge({ powerKw, solid, showKw = true }: SpeedBadgeProps) {
  const tier = speedTier(powerKw);
  return (
    <span className={badge({ tone: tier.tone, solid })}>
      <svg viewBox="0 0 16 16" className="size-3" aria-hidden="true">
        <path d="M9 1 3 9h4l-1 6 6-8H8z" fill="currentColor" />
      </svg>
      {tier.label}
      {showKw && <span className="font-medium opacity-75">· {powerKw} kW</span>}
    </span>
  );
}
