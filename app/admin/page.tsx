import {
  adminCreateAdminAction,
  adminCreatePlayerAction,
  adminEditMatchAction,
  adminSendPasswordResetAction,
  adminVoidMatchAction
} from "@/app/actions/admin";
import { AdminEditMatchForm, AdminVoidMatchForm } from "@/components/admin-match-actions";
import { ActionForm } from "@/components/auth-form-status";
import { CopySignupLink } from "@/components/copy-signup-link";
import { Field, Panel, inputClass } from "@/components/ui";
import { getCurrentProfile, getRankings, getRecentMatches } from "@/lib/data";

export default async function AdminPage() {
  const profile = await getCurrentProfile();
  const players = await getRankings();
  const matches = await getRecentMatches();

  if (!profile?.is_admin) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <Panel>
          <h1 className="text-3xl font-black text-ink">Admin access required</h1>
          <p className="mt-2 text-mist">Only league admins can modify scores or trigger account actions.</p>
        </Panel>
      </main>
    );
  }

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[0.85fr_1.15fr]">
      <section className="grid gap-6">
        <Panel>
          <h1 className="text-3xl font-black text-ink">Admin</h1>
          <p className="mt-2 text-sm leading-6 text-mist">
            Add rostered players, correct scores, and manage the admin account.
          </p>
          <CopySignupLink />
        </Panel>

        <Panel>
          <h2 className="text-xl font-black text-ink">Add player</h2>
          <p className="mt-2 text-sm leading-6 text-mist">
            Players use this email and PIN at the table. They do not log in.
          </p>
          <div className="mt-4">
            <ActionForm action={adminCreatePlayerAction} submitLabel="Add player">
              <Field label="Display name">
                <input className={inputClass} name="displayName" required />
              </Field>
              <Field label="Email">
                <input className={inputClass} name="email" type="email" required />
              </Field>
              <Field label="Player PIN">
                <input className={inputClass} name="pin" inputMode="numeric" pattern="[0-9]{4,8}" required />
              </Field>
            </ActionForm>
          </div>
        </Panel>

        <Panel>
          <h2 className="text-xl font-black text-ink">Admin password reset</h2>
          <div className="mt-4">
            <ActionForm action={adminSendPasswordResetAction} submitLabel="Generate reset link">
              <Field label="Admin email">
                <input className={inputClass} name="email" type="email" required />
              </Field>
            </ActionForm>
          </div>
        </Panel>

        <Panel>
          <h2 className="text-xl font-black text-ink">Create admin</h2>
          <p className="mt-2 text-sm leading-6 text-mist">
            Admins log in with Supabase Auth and can manage players, matches, and other admins.
          </p>
          <div className="mt-4">
            <ActionForm action={adminCreateAdminAction} autoComplete="off" submitLabel="Create admin">
              <Field label="Display name">
                <input className={inputClass} name="displayName" autoComplete="off" required />
              </Field>
              <Field label="Email">
                <input className={inputClass} name="email" type="email" autoComplete="off" required />
              </Field>
              <Field label="Temporary password">
                <input className={inputClass} name="password" type="password" autoComplete="new-password" minLength={8} required />
              </Field>
            </ActionForm>
          </div>
        </Panel>

        <Panel>
          <h2 className="text-xl font-black text-ink">Players</h2>
          <div className="mt-4 grid gap-2">
            {players.map((player) => (
              <div key={player.id} className="flex items-center justify-between rounded-md border border-line bg-night/70 p-3">
                <div>
                  <span className="block font-bold text-ink">{player.display_name}</span>
                  <span className="block text-xs text-mist">{player.email}</span>
                </div>
                <span className="font-black text-court">{player.rating}</span>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <section className="grid gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-court">Score control</p>
          <h2 className="mt-2 text-3xl font-black text-ink">Recent matches</h2>
        </div>
        {matches.length ? (
          matches.map((match) => {
            const p1 = players.find((player) => player.id === match.player_one_id);
            const p2 = players.find((player) => player.id === match.player_two_id);
            const playerOneName = match.player_one_name ?? p1?.display_name ?? "Player 1";
            const playerTwoName = match.player_two_name ?? p2?.display_name ?? "Player 2";

            return (
              <Panel key={match.id} className="grid gap-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-black text-ink">
                      {playerOneName} vs {playerTwoName}
                    </p>
                    <p className="text-sm text-mist">
                      Current: {match.player_one_score}-{match.player_two_score} · winner: {match.winner_name ?? "unknown"} · {match.status}
                    </p>
                  </div>
                </div>
                <AdminEditMatchForm
                  action={adminEditMatchAction}
                  matchId={match.id}
                  playerOneScore={match.player_one_score}
                  playerTwoScore={match.player_two_score}
                />
                <AdminVoidMatchForm action={adminVoidMatchAction} matchId={match.id} />
              </Panel>
            );
          })
        ) : (
          <Panel>
            <p className="font-semibold text-mist">No matches submitted yet.</p>
          </Panel>
        )}
      </section>
    </main>
  );
}
