import { tv } from 'tailwind-variants';
import type { SlotStatus } from '../api/stations.api';

const slot = tv({
  base: 'relative min-w-[4.5rem] rounded-lg border px-3 py-2 text-sm font-semibold tabular-nums transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed',
  variants: {
    status: {
      FREE: 'cursor-pointer border-slate-200 bg-surface text-slate-800 hover:border-brand-500 hover:bg-brand-50 hover:text-brand-800',
      BOOKED: 'border-transparent bg-slate-100 text-slate-400 line-through',
      CHECKED_IN: 'border-transparent bg-slate-100 text-slate-400 line-through',
      EXPIRED: 'border-transparent bg-slate-100 text-slate-400',
      CANCELLED: 'border-transparent bg-slate-100 text-slate-400',
    },
    highlight: {
      true: 'border-brand-600 bg-brand-700 text-white hover:border-brand-700 hover:bg-brand-800 hover:text-white',
    },
  },
});

const STATUS_LABELS: Record<SlotStatus, string> = {
  FREE: 'free',
  BOOKED: 'booked',
  CHECKED_IN: 'in use',
  EXPIRED: 'unavailable',
  CANCELLED: 'unavailable',
};

interface SlotButtonProps {
  status: SlotStatus;
  label: string;
  // Marks the earliest free slot.
  highlight?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export function SlotButton({
  status,
  label,
  highlight,
  disabled,
  onClick,
}: SlotButtonProps) {
  return (
    <button
      type="button"
      className={slot({ status, highlight: highlight && status === 'FREE' })}
      disabled={disabled || status !== 'FREE'}
      onClick={onClick}
      aria-label={`${label}, ${STATUS_LABELS[status]}${highlight ? ', next free' : ''}`}
    >
      {label}
    </button>
  );
}
