import Link from "next/link";
import { headers } from "next/headers";
import { createInviteAction, updateInviteAction } from "@/app/actions/invites";
import { ActionForm } from "@/components/auth-form-status";
import { CopyLinkButton } from "@/components/copy-link-button";
import { Field, Panel, SubmitButton, inputClass } from "@/components/ui";
import { getInvitesForCurrentUser, getPlayers } from "@/lib/data";

const fireAndForgetInviteAction = updateInviteAction as unknown as (formData: FormData) => void;

export default async function InvitesPage() {
  const { profile, invites } = await getInvitesForCurrentUser();
  const players = await getPlayers();
  const opponents = players.filter((player) => player.id !== profile?.id);
  const headerStore = await headers();
  const host = headerStore.get("host");
  const proto = headerStore.get("x-forwarded-proto") ?? "http";
  const siteUrl = host ? `${proto}://${host}` : (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001");

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[0.8fr_1.2fr]">
      <Panel>
        <h1 className="text-3xl font-black text-ink">Send invite</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Invites are tracked in-app for the MVP. Accepted invites can start a prefilled game.
        </p>
        <div className="mt-6">
          <ActionForm action={createInviteAction} submitLabel="Send invite">
            <Field label="Opponent">
              <select className={inputClass} name="opponentId" required>
                {opponents.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.display_name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Message">
              <textarea className={inputClass} name="message" rows={3} maxLength={240} />
            </Field>
          </ActionForm>
        </div>
      </Panel>

      <section className="grid gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-court">Challenges</p>
          <h2 className="mt-2 text-3xl font-black text-ink">Your invites</h2>
        </div>
        {invites.length ? (
          invites.map((invite) => {
            const opponentId = invite.challenger_id === profile?.id ? invite.opponent_id : invite.challenger_id;
            const opponent = players.find((player) => player.id === opponentId);
            const addressedToMe = invite.opponent_id === profile?.id;
            const gameHref = `/game?invite=${invite.id}`;
            const gameLink = { pathname: "/game", query: { invite: invite.id } };
            const gameUrl = `${siteUrl}${gameHref}`;

            return (
              <Panel key={invite.id} className="grid gap-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-black text-ink">{opponent?.display_name ?? "Player"}</p>
                    <p className="text-sm text-slate-600">{invite.message || "No message"}</p>
                  </div>
                  <span className="w-fit rounded bg-slate-100 px-3 py-1 text-sm font-bold text-slate-700">
                    {invite.status}
                  </span>
                </div>
                <div className="grid gap-2 rounded-md bg-slate-50 p-3">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Game link</p>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <code className="min-w-0 flex-1 break-all rounded bg-white px-3 py-2 text-sm text-slate-700">
                      {gameUrl}
                    </code>
                    <CopyLinkButton value={gameUrl} />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {addressedToMe && invite.status === "pending" ? (
                    <>
                      <form action={fireAndForgetInviteAction}>
                        <input type="hidden" name="inviteId" value={invite.id} />
                        <input type="hidden" name="status" value="accepted" />
                        <SubmitButton>Accept</SubmitButton>
                      </form>
                      <form action={fireAndForgetInviteAction}>
                        <input type="hidden" name="inviteId" value={invite.id} />
                        <input type="hidden" name="status" value="declined" />
                        <button className="focus-ring rounded-md border border-slate-300 px-4 py-2 font-bold hover:bg-slate-50">
                          Decline
                        </button>
                      </form>
                    </>
                  ) : null}
                  {invite.status === "accepted" ? (
                    <Link
                      className="focus-ring rounded-md bg-ink px-4 py-2 font-bold text-white hover:bg-slate-700"
                      href={gameLink}
                    >
                      Start game
                    </Link>
                  ) : null}
                </div>
              </Panel>
            );
          })
        ) : (
          <Panel>
            <p className="font-semibold text-slate-700">No invites yet.</p>
          </Panel>
        )}
      </section>
    </main>
  );
}
