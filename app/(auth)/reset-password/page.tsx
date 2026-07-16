import { ActionForm } from "@/components/auth-form-status";
import { Field, Panel, inputClass } from "@/components/ui";
import { resetPasswordAction } from "@/app/actions/auth";

export default function ResetPasswordPage() {
  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <Panel>
        <h1 className="text-3xl font-black text-ink">Reset password</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Supabase will email a recovery link using the project email settings.
        </p>
        <div className="mt-6">
          <ActionForm action={resetPasswordAction} submitLabel="Send reset email">
            <Field label="Email">
              <input className={inputClass} name="email" type="email" required />
            </Field>
          </ActionForm>
        </div>
      </Panel>
    </main>
  );
}
