import { GameBoard } from "@/components/game-board";
import { Panel } from "@/components/ui";
import { getCurrentProfile, getInviteById, getPlayers, getRankings } from "@/lib/data";

export default async function GamePage({
  searchParams
}: {
  searchParams: Promise<{ invite?: string; opponent?: string }>;
}) {
  const params = await searchParams;
  const profile = await getCurrentProfile();
  const rankings = await getRankings();
  const current =
    profile ??
    rankings.find((player) => player.id === "demo-1") ??
    null;
  const players = await getPlayers();
  const opponents = players.filter((player) => player.id !== current?.id);
  const invite = await getInviteById(params.invite);
  const invitedOpponentId =
    params.opponent ??
    (invite && current
      ? invite.challenger_id === current.id
        ? invite.opponent_id
        : invite.challenger_id
      : undefined);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-court">Live game</p>
        <h1 className="mt-2 text-4xl font-black text-ink">Scoreboard</h1>
      </div>
      {current && opponents.length ? (
        <GameBoard
          currentPlayer={current}
          opponents={opponents}
          inviteId={params.invite}
          invitedOpponentId={invitedOpponentId}
        />
      ) : (
        <Panel>
          <h2 className="text-xl font-black text-ink">No opponents yet</h2>
          <p className="mt-2 text-slate-600">Create another player account before starting a tracked game.</p>
        </Panel>
      )}
    </main>
  );
}
