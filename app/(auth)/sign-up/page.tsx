import { playerSignupAction } from "@/app/actions/player-signup";
import { ActionForm } from "@/components/auth-form-status";
import { Field, Panel, inputClass } from "@/components/ui";

export default function SignUpPage() {
  return (
    <main className="mx-auto max-w-md px-3 py-6 sm:px-4 sm:py-10">
      <Panel>
        <p className="text-sm font-black uppercase tracking-[0.16em] text-court">League roster</p>
        <h1 className="mt-2 text-3xl font-black text-ink">Create your player</h1>
        <p className="mt-2 text-sm leading-6 text-mist">
          Join the roster with your email and a 4 to 8 digit PIN. You will use these at the table before a match.
        </p>
        <div className="mt-6">
          <ActionForm action={playerSignupAction} autoComplete="off" submitLabel="Create player">
            <Field label="Display name">
              <input className={inputClass} name="displayName" autoComplete="off" required />
            </Field>
            <Field label="Email">
              <input className={inputClass} name="playerEmail" type="email" autoComplete="off" required />
            </Field>
            <Field label="Player PIN">
              <input
                className={inputClass}
                name="playerPin"
                inputMode="numeric"
                pattern="[0-9]{4,8}"
                type="password"
                autoComplete="new-password"
                required
              />
            </Field>
          </ActionForm>
        </div>
      </Panel>
    </main>
  );
}
