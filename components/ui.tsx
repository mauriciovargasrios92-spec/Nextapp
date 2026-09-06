"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

export function Screen({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen w-full bg-paper flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm flex flex-col items-center text-center gap-10">
        {children}
      </div>
    </main>
  );
}

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export function PrimaryButton({ children, className = "", ...props }: PrimaryButtonProps) {
  return (
    <button
      {...props}
      className={`w-full rounded-full bg-ink text-paper text-[17px] font-medium py-4 px-8 transition-colors hover:bg-accent disabled:opacity-40 disabled:hover:bg-ink ${className}`}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ children, className = "", ...props }: PrimaryButtonProps) {
  return (
    <button
      {...props}
      className={`w-full rounded-full border border-stone-light text-ink text-[15px] font-medium py-3.5 px-8 transition-colors hover:border-stone ${className}`}
    >
      {children}
    </button>
  );
}

export function TextLink({ children, className = "", ...props }: PrimaryButtonProps) {
  return (
    <button
      {...props}
      className={`text-[15px] text-stone hover:text-ink transition-colors underline underline-offset-4 decoration-stone-light ${className}`}
    >
      {children}
    </button>
  );
}

export function Statement({ children }: { children: ReactNode }) {
  return (
    <h1 className="font-display text-[34px] leading-[1.15] text-ink">
      {children}
    </h1>
  );
}

export function Subtext({ children }: { children: ReactNode }) {
  return <p className="text-[16px] leading-relaxed text-stone">{children}</p>;
}

export function SmallLabel({ children }: { children: ReactNode }) {
  return <p className="text-[13px] text-stone">{children}</p>;
}
