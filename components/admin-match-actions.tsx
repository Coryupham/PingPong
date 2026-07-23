"use client";

import { useActionState } from "react";
import { SubmitButton, inputClass } from "@/components/ui";

type FormState = {
  error?: string;
  success?: string;
} | void;

export function AdminEditMatchForm({
  action,
  matchId,
  playerOneScore,
  playerTwoScore
}: {
  action: (formData: FormData) => Promise<FormState>;
  matchId: string;
  playerOneScore: number;
  playerTwoScore: number;
}) {
  const [state, formAction, pending] = useActionState(
    async (_previousState: FormState, formData: FormData) => action(formData),
    undefined
  );

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
      <input type="hidden" name="matchId" value={matchId} />
      <input className={inputClass} name="playerOneScore" type="number" min={0} max={99} defaultValue={playerOneScore} />
      <input className={inputClass} name="playerTwoScore" type="number" min={0} max={99} defaultValue={playerTwoScore} />
      <SubmitButton disabled={pending}>{pending ? "Updating..." : "Update"}</SubmitButton>
      <AdminActionStatus state={state} />
    </form>
  );
}

export function AdminVoidMatchForm({
  action,
  matchId
}: {
  action: (formData: FormData) => Promise<FormState>;
  matchId: string;
}) {
  const [state, formAction, pending] = useActionState(
    async (_previousState: FormState, formData: FormData) => action(formData),
    undefined
  );

  return (
    <form action={formAction} className="grid gap-3">
      <input type="hidden" name="matchId" value={matchId} />
      <button
        disabled={pending}
        className="focus-ring w-fit rounded-md border border-paddle/40 px-4 py-2 font-bold text-paddle hover:bg-paddle/10 disabled:cursor-not-allowed disabled:border-slate-700 disabled:text-slate-500"
      >
        {pending ? "Voiding..." : "Void match"}
      </button>
      <AdminActionStatus state={state} />
    </form>
  );
}

function AdminActionStatus({ state }: { state: FormState }) {
  if (state?.error) {
    return (
      <p className="rounded-md border border-paddle/40 bg-paddle/10 p-3 text-sm font-bold text-paddle sm:col-span-3">
        {state.error}
      </p>
    );
  }

  if (state?.success) {
    return (
      <p className="rounded-md border border-court/40 bg-court/10 p-3 text-sm font-bold text-court sm:col-span-3">
        {state.success}
      </p>
    );
  }

  return null;
}
