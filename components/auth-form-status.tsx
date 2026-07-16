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
  submitLabel
}: {
  action: (formData: FormData) => Promise<FormState>;
  children: React.ReactNode;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(
    async (_previousState: FormState, formData: FormData) => action(formData),
    undefined
  );

  return (
    <form action={formAction} className="grid gap-4">
      {children}
      {state?.error ? <p className="rounded-md bg-red-50 p-3 text-sm font-semibold text-red-700">{state.error}</p> : null}
      {state?.success ? (
        <p className="rounded-md bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{state.success}</p>
      ) : null}
      <SubmitButton disabled={pending}>{pending ? "Working..." : submitLabel}</SubmitButton>
    </form>
  );
}
