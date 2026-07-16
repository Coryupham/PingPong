import Link from "next/link";
import { ActionForm } from "@/components/auth-form-status";
import { Field, Panel, inputClass } from "@/components/ui";
import { signUpAction } from "@/app/actions/auth";

export default function SignUpPage() {
  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <Panel>
        <h1 className="text-3xl font-black text-ink">Create your player</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Your PIN is used by opponents to confirm a match before score submission.
        </p>
        <div className="mt-6">
          <ActionForm action={signUpAction} submitLabel="Create account">
            <Field label="Display name">
              <input className={inputClass} name="displayName" required />
            </Field>
            <Field label="Email">
              <input className={inputClass} name="email" type="email" required />
            </Field>
            <Field label="Password">
              <input className={inputClass} name="password" type="password" minLength={8} required />
            </Field>
            <Field label="Match confirmation PIN">
              <input className={inputClass} name="pin" inputMode="numeric" pattern="[0-9]{4,8}" required />
            </Field>
          </ActionForm>
        </div>
        <p className="mt-5 text-sm text-slate-600">
          Already playing?{" "}
          <Link className="font-bold text-court" href="/login">
            Log in
          </Link>
        </p>
      </Panel>
    </main>
  );
}
