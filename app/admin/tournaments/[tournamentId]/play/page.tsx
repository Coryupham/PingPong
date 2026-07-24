import Link from "next/link";
import { TournamentGameBoard } from "@/components/tournament-game-board";
import { Panel } from "@/components/ui";
import { getCurrentProfile } from "@/lib/data";
import { createSupabaseAdminClient } from "@/lib/supabase";
import type { Tournament, TournamentMatch, TournamentPlayerGame, TournamentTeam } from "@/lib/types";

function scheduledGamesForMatch(
  match: TournamentMatch,
  teamOne: TournamentTeam,
  teamTwo: TournamentTeam,
  round: number
): TournamentPlayerGame[] {
  if (match.games?.length) {
    return match.games;
  }

  const teamOnePlayers = [...teamOne.players].sort((a, b) => b.rating - a.rating || a.displayName.localeCompare(b.displayName));
  const teamTwoPlayers = [...teamTwo.players].sort((a, b) => b.rating - a.rating || a.displayName.localeCompare(b.displayName));

  return teamOnePlayers.map((player, index) => ({
    id: `round-${round}-match-${match.matchNumber}-game-${index + 1}`,
    gameNumber: index + 1,
    playerOneId: player.id,
    playerTwoId: teamTwoPlayers[index]?.id ?? teamTwoPlayers[teamTwoPlayers.length - 1]?.id ?? "",
    playerOneScore: null,
    playerTwoScore: null,
    winnerPlayerId: null,
    winnerTeamId: null,
    recordedMatchId: null,
    status: "pending"
  }));
}

function errorPanel(title: string, message: string) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Panel>
        <h1 className="text-3xl font-black text-ink">{title}</h1>
        <p className="mt-2 text-mist">{message}</p>
        <Link className="mt-5 inline-flex font-black text-court hover:text-emerald-300" href="/admin/tournaments">
          Back to tournaments
        </Link>
      </Panel>
    </main>
  );
}

export default async function TournamentPlayPage({
  params,
  searchParams
}: {
  params: Promise<{ tournamentId: string }>;
  searchParams: Promise<{ round?: string; match?: string; game?: string }>;
}) {
  const profile = await getCurrentProfile();

  if (!profile?.is_admin) {
    return errorPanel("Admin access required", "Only league admins can record tournament games.");
  }

  const { tournamentId } = await params;
  const query = await searchParams;
  const round = Number(query.round ?? 0);
  const matchId = query.match ?? "";
  const gameId = query.game ?? "";
  const supabase = createSupabaseAdminClient();

  if (!supabase || !round || !matchId || !gameId) {
    return errorPanel("Tournament game not found", "Open a scheduled game from the tournament bracket.");
  }

  const { data } = await supabase.from("tournaments").select("*").eq("id", tournamentId).single();
  const tournament = data as Tournament | null;

  if (!tournament) {
    return errorPanel("Tournament not found", "This tournament could not be loaded.");
  }

  const roundData = tournament.rounds.find((item) => item.round === round);
  const match = roundData?.matches.find((item) => item.id === matchId);
  const teamsById = new Map(tournament.teams.map((team) => [team.id, team]));
  const teamOne = match?.teamOneId ? teamsById.get(match.teamOneId) : null;
  const teamTwo = match?.teamTwoId ? teamsById.get(match.teamTwoId) : null;
  const games = match && teamOne && teamTwo ? scheduledGamesForMatch(match, teamOne, teamTwo, round) : [];
  const game = games.find((item) => item.id === gameId);
  const playerOne = teamOne?.players.find((player) => player.id === game?.playerOneId);
  const playerTwo = teamTwo?.players.find((player) => player.id === game?.playerTwoId);

  if (!roundData || !match || !teamOne || !teamTwo || !game || !playerOne || !playerTwo) {
    return errorPanel("Tournament game not found", "This scheduled game could not be loaded from the bracket.");
  }

  if (game.status === "complete") {
    return errorPanel("Game already recorded", "This scheduled tournament game has already been recorded.");
  }

  return (
    <main className="mx-auto max-w-6xl px-3 py-4 sm:px-4 sm:py-8">
      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-court sm:text-sm">Tournament game</p>
          <h1 className="mt-1 text-3xl font-black text-ink sm:mt-2 sm:text-4xl">Scoreboard</h1>
        </div>
        <Link
          className="focus-ring inline-flex items-center justify-center rounded-md border border-line px-4 py-3 font-black text-mist hover:bg-graphite hover:text-ink"
          href="/admin/tournaments"
        >
          Back to bracket
        </Link>
      </div>
      <TournamentGameBoard
        tournamentId={tournament.id}
        tournamentName={tournament.name}
        round={round}
        matchId={match.id}
        gameId={game.id}
        teamOneName={teamOne.name}
        teamTwoName={teamTwo.name}
        playerOne={{
          id: playerOne.id,
          displayName: playerOne.displayName,
          rating: playerOne.rating
        }}
        playerTwo={{
          id: playerTwo.id,
          displayName: playerTwo.displayName,
          rating: playerTwo.rating
        }}
        backHref="/admin/tournaments"
      />
    </main>
  );
}
