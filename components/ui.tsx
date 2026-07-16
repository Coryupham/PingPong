import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Panel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-lg bg-white p-5 shadow-panel", className)} {...props} />;
}

export function SubmitButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "focus-ring inline-flex items-center justify-center rounded-md bg-court px-4 py-2 font-bold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300",
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
    <label className="grid gap-2 text-sm font-semibold text-slate-700">
      {label}
      {children}
    </label>
  );
}

export const inputClass =
  "focus-ring w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-ink shadow-sm focus:border-court";
