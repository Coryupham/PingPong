import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Panel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-line bg-graphite/92 p-5 text-ink shadow-panel",
        className
      )}
      {...props}
    />
  );
}

export function SubmitButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "focus-ring inline-flex items-center justify-center rounded-md bg-court px-4 py-2 font-black text-night shadow-glow hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-mist">
      {label}
      {children}
    </label>
  );
}

export const inputClass =
  "focus-ring w-full rounded-md border border-line bg-night/80 px-3 py-2 text-ink shadow-sm placeholder:text-slate-500 focus:border-court";
