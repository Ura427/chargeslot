import type { InputHTMLAttributes, ReactNode } from 'react';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: AuthLayoutProps) {
  return (
    <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-surface shadow-sm md:grid-cols-2">
      <div className="relative hidden md:block">
        <img
          src="/stations/highway.jpg"
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-800/90 via-brand-800/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-8 text-white">
          <p className="text-2xl font-bold leading-snug">
            Your charger, waiting when you arrive.
          </p>
          <p className="mt-2 text-sm text-white/85">
            Reserve a 30-minute slot at fast and ultra-fast stations across the
            UK.
          </p>
        </div>
      </div>
      <div className="p-6 sm:p-10">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        <div className="mt-8">{children}</div>
        <p className="mt-6 text-sm text-slate-600">{footer}</p>
      </div>
    </div>
  );
}

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  hint?: string;
}

export function TextField({ id, label, hint, ...props }: TextFieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-semibold text-slate-800"
      >
        {label}
      </label>
      <input
        id={id}
        {...props}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className="mt-1.5 w-full rounded-xl border border-slate-300 bg-surface px-3.5 py-2.5 text-sm transition outline-none focus:border-brand-600 focus:ring-3 focus:ring-brand-100"
      />
      {hint && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-slate-500">
          {hint}
        </p>
      )}
    </div>
  );
}

export function FormError({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
      {children}
    </p>
  );
}
