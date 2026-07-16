import { adminEditMatchAction, adminSendPasswordResetAction, adminVoidMatchAction } from "@/app/actions/admin";
import { ActionForm } from "@/components/auth-form-status";
import { Field, Panel, SubmitButton, inputClass } from "@/components/ui";
import { getCurrentProfile, getRankings, getRecentMatches } from "@/lib/data";

const fireAndForgetEditMatchAction = adminEditMatchAction as unknown as (formData: FormData) => void;
const fireAndForgetVoidMatchAction = adminVoidMatchAction as unknown as (formData: FormData) => void;

export default async function AdminPage() {
  const profile = await getCurrentProfile();
  const players = await getRankings();
  const matches = await getRecentMatches();

  if (!profile?.is_admin) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <Panel>
          <h1 className="text-3xl font-black text-ink">Admin access required</h1>
          <p className="mt-2 text-slate-600">Only league admins can modify scores or trigger account actions.</p>
        </Panel>
      </main>
    );
  }

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[0.85fr_1.15fr]">
      <section className="grid gap-6">
        <Panel>
          <h1 className="text-3xl font-black text-ink">Admin</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Correct scores, void matches, and generate password recovery links.
          </p>
        </Panel>

        <Panel>
          <h2 className="text-xl font-black text-ink">Password reset</h2>
          <div className="mt-4">
            <ActionForm action={adminSendPasswordResetAction} submitLabel="Generate reset link">
              <Field label="Player email">
                <input className={inputClass} name="email" type="email" required />
              </Field>
            </ActionForm>
          </div>
        </Panel>

        <Panel>
          <h2 className="text-xl font-black text-ink">Players</h2>
          <div className="mt-4 grid gap-2">
            {players.map((player) => (
              <div key={player.id} className="flex items-center justify-between rounded-md bg-slate-50 p-3">
                <span className="font-bold text-ink">{player.display_name}</span>
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

            return (
              <Panel key={match.id} className="grid gap-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-black text-ink">
                      {p1?.display_name ?? "Player 1"} vs {p2?.display_name ?? "Player 2"}
                    </p>
                    <p className="text-sm text-slate-600">
                      Current: {match.player_one_score}-{match.player_two_score} · {match.status}
                    </p>
                  </div>
                </div>
                <form action={fireAndForgetEditMatchAction} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                  <input type="hidden" name="matchId" value={match.id} />
                  <input className={inputClass} name="playerOneScore" type="number" min={0} max={99} defaultValue={match.player_one_score} />
                  <input className={inputClass} name="playerTwoScore" type="number" min={0} max={99} defaultValue={match.player_two_score} />
                  <SubmitButton>Update</SubmitButton>
                </form>
                <form action={fireAndForgetVoidMatchAction}>
                  <input type="hidden" name="matchId" value={match.id} />
                  <button className="focus-ring rounded-md border border-red-200 px-4 py-2 font-bold text-red-700 hover:bg-red-50">
                    Void match
                  </button>
                </form>
              </Panel>
            );
          })
        ) : (
          <Panel>
            <p className="font-semibold text-slate-700">No matches submitted yet.</p>
          </Panel>
        )}
      </section>
    </main>
  );
}
