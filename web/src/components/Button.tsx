import type { ButtonHTMLAttributes } from 'react';
import { tv, type VariantProps } from 'tailwind-variants';

const button = tv({
  base: 'inline-flex items-center justify-center rounded-md text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50',
  variants: {
    variant: {
      primary: 'bg-slate-900 text-white hover:bg-slate-700',
      secondary:
        'border border-slate-300 bg-white text-slate-900 hover:bg-slate-50',
      danger: 'bg-red-600 text-white hover:bg-red-500',
      ghost: 'text-slate-600 hover:bg-slate-100',
    },
    size: {
      sm: 'px-2.5 py-1.5',
      md: 'px-4 py-2',
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
});

interface ButtonProps
  extends
    ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={button({ variant, size, className })} {...props} />;
}
