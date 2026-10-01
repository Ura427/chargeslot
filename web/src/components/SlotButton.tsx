import { tv } from 'tailwind-variants';
import type { SlotStatus } from '../api/stations.api';

const slot = tv({
  base: 'rounded-md border px-2 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed',
  variants: {
    status: {
      FREE: 'cursor-pointer border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100',
      BOOKED: 'border-amber-300 bg-amber-50 text-amber-800',
      CHECKED_IN: 'border-sky-300 bg-sky-50 text-sky-800',
      EXPIRED: 'border-slate-200 bg-slate-100 text-slate-400',
      CANCELLED: 'border-slate-200 bg-slate-50 text-slate-400 line-through',
    },
  },
});

interface SlotButtonProps {
  status: SlotStatus;
  label: string;
  disabled?: boolean;
  onClick?: () => void;
}

export function SlotButton({
  status,
  label,
  disabled,
  onClick,
}: SlotButtonProps) {
  return (
    <button
      type="button"
      className={slot({ status })}
      disabled={disabled || status !== 'FREE'}
      onClick={onClick}
      title={status}
    >
      {label}
    </button>
  );
}
