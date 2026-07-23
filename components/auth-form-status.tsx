"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/ui";

type FormState = {
  error?: string;
  success?: string;
} | void;

export function ActionForm({
  action,
  children,
  autoComplete,
  submitLabel
}: {
  action: (formData: FormData) => Promise<FormState>;
  children: React.ReactNode;
  autoComplete?: React.FormHTMLAttributes<HTMLFormElement>["autoComplete"];
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(
    async (_previousState: FormState, formData: FormData) => action(formData),
    undefined
  );

  return (
    <form action={formAction} autoComplete={autoComplete} className="grid gap-4">
      {children}
      {state?.error ? (
        <p className="rounded-md border border-paddle/40 bg-paddle/10 p-3 text-sm font-bold text-paddle">
          {state.error}
        </p>
      ) : null}
      {state?.success ? (
        <p className="rounded-md border border-court/40 bg-court/10 p-3 text-sm font-bold text-court">
          {state.success}
        </p>
      ) : null}
      <SubmitButton disabled={pending}>{pending ? "Working..." : submitLabel}</SubmitButton>
    </form>
  );
}
