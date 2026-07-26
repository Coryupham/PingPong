import { Medal, Trophy } from "lucide-react";
import { cn } from "@/components/ui";
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

export function TournamentResults({ tournaments }: { tournaments: Tournament[] }) {
  const featuredTournament = tournaments[0] ?? null;

  if (!featuredTournament) {
    return (
      <section className="rounded-lg border border-line bg-graphite/92 p-5 shadow-panel">
        <h2 className="text-2xl font-black text-ink">No tournaments yet</h2>
        <p className="mt-2 font-semibold text-mist">Tournament results will show here once an admin creates a bracket.</p>
      </section>
    );
  }

  const previousTournaments = tournaments.slice(1);

  return (
    <div className="grid min-w-0 gap-5">
      <TournamentBracket tournament={featuredTournament} featured />
      {previousTournaments.length ? (
        <section className="rounded-lg border border-line bg-graphite/92 p-5 shadow-panel">
          <h2 className="text-2xl font-black text-ink">Recent tournaments</h2>
          <div className="mt-4 grid gap-4">
            {previousTournaments.map((tournament) => (
              <TournamentBracket key={tournament.id} tournament={tournament} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function TournamentBracket({ tournament, featured = false }: { tournament: Tournament; featured?: boolean }) {
  const teamsById = new Map(tournament.teams.map((team) => [team.id, team]));
  const currentRound = tournament.rounds.find((round) => round.round === tournament.current_round);
  const champion = tournament.status === "complete" ? teamsById.get(currentRound?.matches[0]?.winnerTeamId ?? "") : null;
  const totalGames = tournament.rounds.reduce((total, round) => {
    return (
      total +
      round.matches.reduce((roundTotal, match) => {
        const teamOne = match.teamOneId ? teamsById.get(match.teamOneId) : null;
        const teamTwo = match.teamTwoId ? teamsById.get(match.teamTwoId) : null;
        return roundTotal + (teamOne && teamTwo ? scheduledGamesForMatch(match, teamOne, teamTwo, round.round).length : 0);
      }, 0)
    );
  }, 0);
  const completedGames = tournament.rounds.reduce((total, round) => {
    return (
      total +
      round.matches.reduce((roundTotal, match) => {
        const teamOne = match.teamOneId ? teamsById.get(match.teamOneId) : null;
        const teamTwo = match.teamTwoId ? teamsById.get(match.teamTwoId) : null;
        const games = teamOne && teamTwo ? scheduledGamesForMatch(match, teamOne, teamTwo, round.round) : [];
        return roundTotal + games.filter((game) => game.status === "complete").length;
      }, 0)
    );
  }, 0);

  return (
    <article className={cn("min-w-0 overflow-hidden rounded-lg border border-line bg-graphite/92 p-4 shadow-panel sm:p-5", !featured && "bg-night/70 shadow-none")}>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-court">
            {featured ? "Current tournament" : "Tournament"}
          </p>
          <h2 className="mt-1 text-2xl font-black text-ink sm:text-3xl">{tournament.name}</h2>
          <p className="mt-1 text-sm font-bold text-mist">
            {tournament.team_count} teams · {tournament.players_per_team} players/team · {completedGames}/{totalGames} games complete
          </p>
        </div>
        <StatusBadge tournament={tournament} championName={champion?.name} />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tournament.teams.map((team) => (
          <TeamSummary key={team.id} team={team} champion={champion?.id === team.id} />
        ))}
      </div>

      <div className="mobile-scroll -mx-1 mt-6 max-w-full overflow-x-auto px-1 pb-2">
        <div className="grid w-max auto-cols-[minmax(18rem,22rem)] grid-flow-col gap-3 sm:w-full sm:auto-cols-[minmax(22rem,1fr)] sm:gap-4">
          {tournament.rounds.map((round) => (
            <section key={round.round} className="rounded-md border border-line bg-night/80 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-[0.14em] text-court">Round {round.round}</h3>
                  <p className="mt-1 text-xs font-bold text-mist">
                    {round.matches.length} team {round.matches.length === 1 ? "match" : "matches"}
                  </p>
                </div>
                {round.round === tournament.current_round && tournament.status === "active" ? (
                  <span className="rounded bg-gold px-2 py-1 text-xs font-black text-night">Current</span>
                ) : null}
              </div>
              <div className="mt-3 grid gap-3">
                {round.matches.map((match) => (
                  <MatchCard key={match.id} match={match} round={round.round} teamsById={teamsById} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </article>
  );
}

function StatusBadge({ tournament, championName }: { tournament: Tournament; championName?: string }) {
  if (tournament.status === "complete") {
    return (
      <div className="rounded-md border border-gold/50 bg-gold/10 px-3 py-2 text-sm font-black text-gold">
        Champion: {championName ?? "TBD"}
      </div>
    );
  }

  return (
    <div className="rounded-md border border-court/40 bg-court/10 px-3 py-2 text-sm font-black text-court">
      Round {tournament.current_round} in progress
    </div>
  );
}

function TeamSummary({ team, champion }: { team: TournamentTeam; champion: boolean }) {
  return (
    <div className={cn("rounded-md border border-line bg-night/75 p-3", champion && "border-gold/50 bg-gold/10")}>
      <div className="flex items-center justify-between gap-2">
        <p className="font-black text-ink">{team.name}</p>
        {champion ? <Trophy className="h-4 w-4 text-gold" /> : <span className="text-xs font-black text-court">{team.ratingTotal}</span>}
      </div>
      <p className="mt-2 text-sm font-semibold leading-5 text-mist">
        {team.players.map((player) => player.displayName).join(", ")}
      </p>
    </div>
  );
}

function MatchCard({
  match,
  round,
  teamsById
}: {
  match: TournamentMatch;
  round: number;
  teamsById: Map<string, TournamentTeam>;
}) {
  const teamOne = match.teamOneId ? teamsById.get(match.teamOneId) : null;
  const teamTwo = match.teamTwoId ? teamsById.get(match.teamTwoId) : null;
  const winner = match.winnerTeamId ? teamsById.get(match.winnerTeamId) : null;
  const games = teamOne && teamTwo ? scheduledGamesForMatch(match, teamOne, teamTwo, round) : [];
  const completedGames = games.filter((game) => game.status === "complete").length;

  return (
    <div className="rounded-md border border-line bg-graphite/80 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-black text-ink">
            {teamOne?.name ?? "TBD"} vs {teamTwo?.name ?? "Bye"}
          </p>
          <p className="mt-1 text-xs font-bold text-mist">
            {winner ? `Winner: ${winner.name}` : teamTwo ? `${completedGames}/${games.length} games complete` : "Bye"}
          </p>
        </div>
        <MatchBadge status={match.status} hasBye={!teamTwo} />
      </div>

      {teamOne && teamTwo ? (
        <div className="mt-3 grid gap-2">
          {games.map((game) => (
            <PlayerGameResult key={game.id} game={game} teamOne={teamOne} teamTwo={teamTwo} />
          ))}
        </div>
      ) : (
        <p className="mt-3 rounded-md border border-court/40 bg-court/10 p-3 text-sm font-bold text-court">
          {teamOne?.name ?? "Team"} advances automatically.
        </p>
      )}
    </div>
  );
}

function MatchBadge({ status, hasBye }: { status: string; hasBye: boolean }) {
  if (hasBye) {
    return <span className="shrink-0 rounded bg-court px-2 py-1 text-xs font-black text-night">Bye</span>;
  }

  return (
    <span className={cn("shrink-0 rounded px-2 py-1 text-xs font-black", status === "complete" ? "bg-court text-night" : "bg-slate-800 text-mist")}>
      {status === "complete" ? "Final" : "Pending"}
    </span>
  );
}

function PlayerGameResult({
  game,
  teamOne,
  teamTwo
}: {
  game: TournamentPlayerGame;
  teamOne: TournamentTeam;
  teamTwo: TournamentTeam;
}) {
  const playerOne = teamOne.players.find((player) => player.id === game.playerOneId);
  const playerTwo = teamTwo.players.find((player) => player.id === game.playerTwoId);
  const playerOneWon = game.winnerPlayerId === playerOne?.id;
  const playerTwoWon = game.winnerPlayerId === playerTwo?.id;

  return (
    <div className="rounded-md border border-line bg-night/70 p-2">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <PlayerResultName name={playerOne?.displayName ?? "TBD"} teamName={teamOne.name} winner={playerOneWon} />
        <ScoreText game={game} />
        <PlayerResultName name={playerTwo?.displayName ?? "TBD"} teamName={teamTwo.name} winner={playerTwoWon} alignRight />
      </div>
    </div>
  );
}

function PlayerResultName({
  name,
  teamName,
  winner,
  alignRight = false
}: {
  name: string;
  teamName: string;
  winner: boolean;
  alignRight?: boolean;
}) {
  return (
    <div className={cn("min-w-0", alignRight && "text-right")}>
      <p className={cn("truncate text-sm font-black", winner ? "text-court" : "text-ink")}>
        {winner ? <Medal className="mr-1 inline h-3.5 w-3.5 align-[-2px]" /> : null}
        {name}
      </p>
      <p className="truncate text-xs font-bold text-mist">{teamName}</p>
    </div>
  );
}

function ScoreText({ game }: { game: TournamentPlayerGame }) {
  if (game.status !== "complete" || game.playerOneScore === null || game.playerTwoScore === null) {
    return <span className="rounded bg-slate-800 px-2 py-1 text-xs font-black text-mist">TBD</span>;
  }

  return (
    <span className="rounded bg-court px-2 py-1 text-sm font-black tabular-nums text-night">
      {game.playerOneScore}-{game.playerTwoScore}
    </span>
  );
}
