import Link from "next/link";
import { ActionForm } from "@/components/auth-form-status";
import { Field, Panel, inputClass } from "@/components/ui";
import { loginAction } from "@/app/actions/auth";

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <Panel>
        <h1 className="text-3xl font-black text-ink">Log in</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Jump back into scoring and league tracking.</p>
        <div className="mt-6">
          <ActionForm action={loginAction} submitLabel="Log in">
            <Field label="Email">
              <input className={inputClass} name="email" type="email" required />
            </Field>
            <Field label="Password">
              <input className={inputClass} name="password" type="password" required />
            </Field>
          </ActionForm>
        </div>
        <div className="mt-5 flex justify-between text-sm text-slate-600">
          <Link className="font-bold text-court" href="/sign-up">
            Create account
          </Link>
          <Link className="font-bold text-court" href="/reset-password">
            Reset password
          </Link>
        </div>
      </Panel>
    </main>
  );
}
