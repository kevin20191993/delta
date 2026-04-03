import { ReactNode } from 'react';

interface AuthShellProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export default function AuthShell({ title, description, children }: AuthShellProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-pearl px-4 font-body">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-ember">
            Sistema corporativo
          </p>
          <h1 className="font-display text-3xl text-ink">KP Delta</h1>
          <p className="mt-1 text-sm text-slate-500">Cotizador industrial premium</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white/90 p-7 shadow-panel backdrop-blur">
          <h2 className="mb-2 text-lg font-semibold text-ink">{title}</h2>
          {description && <p className="mb-5 text-sm text-slate-500">{description}</p>}
          {children}
        </div>
      </div>
    </div>
  );
}

