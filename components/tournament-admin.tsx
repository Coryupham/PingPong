"use client";

import { useActionState, useMemo, useState } from "react";
import { CalendarPlus, Play, Save, Shuffle, Trophy } from "lucide-react";
import {
  advanceTournamentRoundAction,
  createTournamentAction,
  updateTournamentGamePlayersAction
} from "@/app/actions/tournaments";
import { SubmitButton, cn, inputClass } from "@/components/ui";
import type { RankingPlayer } from "@/lib/data";
import type { Tournament, TournamentMatch, TournamentPlayerGame, TournamentTeam } from "@/lib/types";

type DraftTeam = {
  id: string;
  name: string;
  playerIds: string[];
};

type FormState = {
  error?: string;
  success?: string;
} | void;

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

export function TournamentAdmin({
  players,
  tournaments
}: {
  players: RankingPlayer[];
  tournaments: Tournament[];
}) {
  const [name, setName] = useState(`Tournament ${new Date().toLocaleDateString()}`);
  const [teamCount, setTeamCount] = useState(4);
  const [playersPerTeam, setPlayersPerTeam] = useState(2);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [draftTeams, setDraftTeams] = useState<DraftTeam[]>([]);
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    async (_state, formData) => createTournamentAction(formData),
    undefined
  );

  const selectedPlayers = useMemo(
    () => players.filter((player) => selectedPlayerIds.includes(player.id)),
    [players, selectedPlayerIds]
  );
  const requiredPlayers = teamCount * playersPerTeam;
  const canGenerate = selectedPlayers.length === requiredPlayers;
  const playerById = useMemo(() => new Map(players.map((player) => [player.id, player])), [players]);
  const teamSizesValid = draftTeams.length === teamCount && draftTeams.every((team) => team.playerIds.length === playersPerTeam);
  const hasActiveTournament = tournaments.some((tournament) => tournament.status === "active");

  function togglePlayer(playerId: string) {
    setSelectedPlayerIds((current) =>
      current.includes(playerId) ? current.filter((id) => id !== playerId) : [...current, playerId]
    );
    setDraftTeams([]);
  }

  function generateTeams() {
    if (!canGenerate) {
      return;
    }

    const teams = Array.from({ length: teamCount }, (_, index) => ({
      id: crypto.randomUUID(),
      name: `Team ${index + 1}`,
      playerIds: [] as string[]
    }));
    const sortedPlayers = [...selectedPlayers].sort((a, b) => b.rating - a.rating || a.display_name.localeCompare(b.display_name));

    sortedPlayers.forEach((player, index) => {
      const wave = Math.floor(index / teamCount);
      const position = index % teamCount;
      const teamIndex = wave % 2 === 0 ? position : teamCount - 1 - position;
      teams[teamIndex]?.playerIds.push(player.id);
    });

    setDraftTeams(teams);
  }

  function movePlayer(playerId: string, nextTeamId: string) {
    setDraftTeams((current) =>
      current.map((team) => ({
        ...team,
        playerIds:
          team.id === nextTeamId
            ? [...team.playerIds.filter((id) => id !== playerId), playerId]
            : team.playerIds.filter((id) => id !== playerId)
      }))
    );
  }

  function updateTeamName(teamId: string, nextName: string) {
    setDraftTeams((current) => current.map((team) => (team.id === teamId ? { ...team, name: nextName } : team)));
  }

  return (
    <div className="grid gap-6">
      {!hasActiveTournament ? (
        <section className="rounded-lg border border-line bg-graphite/92 p-5 shadow-panel">
          <div className="flex items-center gap-2">
            <CalendarPlus className="h-5 w-5 text-court" />
            <h2 className="text-2xl font-black text-ink">Create tournament</h2>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_10rem_10rem]">
            <label className="grid gap-2 text-sm font-bold text-mist">
              Tournament name
              <input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <label className="grid gap-2 text-sm font-bold text-mist">
              Teams
              <input
                className={inputClass}
                min={2}
                max={32}
                type="number"
                value={teamCount}
                onChange={(event) => {
                  setTeamCount(Number(event.target.value));
                  setDraftTeams([]);
                }}
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-mist">
              Players/team
              <input
                className={inputClass}
                min={1}
                max={12}
                type="number"
                value={playersPerTeam}
                onChange={(event) => {
                  setPlayersPerTeam(Number(event.target.value));
                  setDraftTeams([]);
                }}
              />
            </label>
          </div>

          <div className="mt-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="text-sm font-black uppercase tracking-[0.14em] text-court">Select players</h3>
                <p className="mt-1 text-sm font-bold text-mist">
                  {selectedPlayers.length}/{requiredPlayers} selected
                </p>
              </div>
              <button
                type="button"
                onClick={generateTeams}
                disabled={!canGenerate}
                className="focus-ring inline-flex items-center justify-center gap-2 rounded-md border border-court/40 px-4 py-3 font-black text-court hover:bg-court/10 disabled:cursor-not-allowed disabled:border-line disabled:text-slate-500"
              >
                <Shuffle className="h-4 w-4" />
                Generate balanced teams
              </button>
            </div>
            <div className="mt-3 grid max-h-72 gap-2 overflow-y-auto rounded-md border border-line bg-night/45 p-3 sm:grid-cols-2">
              {players.map((player) => (
                <label
                  key={player.id}
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-3 rounded-md border p-3 text-sm",
                    selectedPlayerIds.includes(player.id)
                      ? "border-court/50 bg-court/10 text-ink"
                      : "border-line bg-graphite/70 text-mist"
                  )}
                >
                  <span>
                    <span className="block font-black">{player.display_name}</span>
                    <span className="block text-xs">Rating {player.rating}</span>
                  </span>
                  <input
                    checked={selectedPlayerIds.includes(player.id)}
                    onChange={() => togglePlayer(player.id)}
                    type="checkbox"
                  />
                </label>
              ))}
            </div>
          </div>

          {draftTeams.length ? (
            <form action={formAction} className="mt-5 grid gap-4">
              <input type="hidden" name="name" value={name} />
              <input type="hidden" name="teamCount" value={teamCount} />
              <input type="hidden" name="playersPerTeam" value={playersPerTeam} />
              <input type="hidden" name="teamsJson" value={JSON.stringify(draftTeams)} />
              <div className="grid gap-3 md:grid-cols-2">
                {draftTeams.map((team) => (
                  <DraftTeamCard
                    key={team.id}
                    team={team}
                    teams={draftTeams}
                    playerById={playerById}
                    playersPerTeam={playersPerTeam}
                    onMovePlayer={movePlayer}
                    onUpdateName={updateTeamName}
                  />
                ))}
              </div>
              {state?.error ? <p className="rounded-md border border-paddle/40 bg-paddle/10 p-3 text-sm font-bold text-paddle">{state.error}</p> : null}
              {state?.success ? <p className="rounded-md border border-court/40 bg-court/10 p-3 text-sm font-bold text-court">{state.success}</p> : null}
              <SubmitButton disabled={pending || !teamSizesValid || !name.trim()}>
                {pending ? "Completing..." : "Complete bracket"}
              </SubmitButton>
            </form>
          ) : null}
        </section>
      ) : null}

      <section className="rounded-lg border border-line bg-graphite/92 p-5 shadow-panel">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-gold" />
          <h2 className="text-2xl font-black text-ink">Tournaments</h2>
        </div>
        <div className="mt-4 grid gap-4">
          {tournaments.length ? (
            tournaments.map((tournament) => <TournamentCard key={tournament.id} tournament={tournament} />)
          ) : (
            <p className="rounded-md border border-line bg-night/70 p-4 font-semibold text-mist">No tournaments yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function DraftTeamCard({
  team,
  teams,
  playerById,
  playersPerTeam,
  onMovePlayer,
  onUpdateName
}: {
  team: DraftTeam;
  teams: DraftTeam[];
  playerById: Map<string, RankingPlayer>;
  playersPerTeam: number;
  onMovePlayer: (playerId: string, nextTeamId: string) => void;
  onUpdateName: (teamId: string, nextName: string) => void;
}) {
  const teamPlayers = team.playerIds.map((playerId) => playerById.get(playerId)).filter(Boolean) as RankingPlayer[];
  const ratingTotal = teamPlayers.reduce((total, player) => total + player.rating, 0);

  return (
    <div className="rounded-md border border-line bg-night/70 p-3">
      <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
        <input
          className={cn(inputClass, "font-black")}
          value={team.name}
          onChange={(event) => onUpdateName(team.id, event.target.value)}
        />
        <span
          className={cn(
            "rounded px-2 py-1 text-xs font-black",
            team.playerIds.length === playersPerTeam ? "bg-court text-night" : "bg-paddle/15 text-paddle"
          )}
        >
          {team.playerIds.length}/{playersPerTeam}
        </span>
      </div>
      <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-mist">Team rating {ratingTotal}</p>
      <div className="mt-3 grid gap-2">
        {teamPlayers.map((player) => (
          <div key={player.id} className="grid gap-2 rounded-md border border-line bg-graphite/70 p-2 sm:grid-cols-[1fr_8rem] sm:items-center">
            <div>
              <p className="font-bold text-ink">{player.display_name}</p>
              <p className="text-xs text-mist">Rating {player.rating}</p>
            </div>
            <select
              className={inputClass}
              value={team.id}
              onChange={(event) => onMovePlayer(player.id, event.target.value)}
            >
              {teams.map((draftTeam) => (
                <option key={draftTeam.id} value={draftTeam.id}>
                  {draftTeam.name}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}

function TournamentCard({ tournament }: { tournament: Tournament }) {
  const teamsById = new Map(tournament.teams.map((team) => [team.id, team]));
  const currentRound = tournament.rounds.find((round) => round.round === tournament.current_round);
  const canAdvance = tournament.status === "active" && Boolean(currentRound?.matches.every((match) => match.status === "complete"));
  const champion = tournament.status === "complete" ? teamsById.get(currentRound?.matches[0]?.winnerTeamId ?? "") : null;

  return (
    <div className="rounded-md border border-line bg-night/70 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-xl font-black text-ink">{tournament.name}</h3>
          <p className="text-sm font-bold text-mist">
            {tournament.team_count} teams · {tournament.players_per_team} players/team · {tournament.status}
          </p>
          {champion ? <p className="mt-1 text-sm font-black text-gold">Champion: {champion.name}</p> : null}
        </div>
        {canAdvance ? <AdvanceRoundForm tournamentId={tournament.id} isFinalRound={currentRound?.matches.length === 1} /> : null}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {tournament.teams.map((team) => (
          <div key={team.id} className="rounded-md border border-line bg-graphite/70 p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="font-black text-ink">{team.name}</p>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-court">{team.ratingTotal}</p>
            </div>
            <p className="mt-2 text-sm text-mist">
              {team.players.map((player) => player.displayName).join(", ")}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto pb-2">
        <div className="grid min-w-[720px] auto-cols-[minmax(22rem,1fr)] grid-flow-col gap-4">
        {tournament.rounds.map((round) => (
          <section key={round.round} className="rounded-md border border-line bg-graphite/45 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-black uppercase tracking-[0.14em] text-court">Round {round.round}</h4>
                <p className="mt-1 text-xs font-bold text-mist">
                  {round.matches.length} team matchups ·{" "}
                  {round.matches.reduce((total, match) => {
                    const teamOne = match.teamOneId ? teamsById.get(match.teamOneId) : null;
                    const teamTwo = match.teamTwoId ? teamsById.get(match.teamTwoId) : null;
                    return total + (teamOne && teamTwo ? scheduledGamesForMatch(match, teamOne, teamTwo, round.round).length : 0);
                  }, 0)}{" "}
                  player games
                </p>
              </div>
              {round.round === tournament.current_round && tournament.status === "active" ? (
                <span className="rounded bg-gold px-2 py-1 text-xs font-black text-night">Current</span>
              ) : null}
            </div>
            <div className="mt-3 grid gap-4">
              {round.matches.map((match) => (
                <TournamentMatchRow
                  key={match.id}
                  tournament={tournament}
                  match={match}
                  round={round.round}
                  teamsById={teamsById}
                />
              ))}
            </div>
          </section>
        ))}
        </div>
      </div>
    </div>
  );
}

function TournamentMatchRow({
  tournament,
  match,
  round,
  teamsById
}: {
  tournament: Tournament;
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
    <div className="rounded-md border border-line bg-night/80 p-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-black text-ink">
            Team match {match.matchNumber}
          </p>
          <p className="text-sm font-bold text-mist">
            {teamOne?.name ?? "TBD"} vs {teamTwo?.name ?? "Bye"}
          </p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-sm font-bold text-mist">{winner ? `Winner: ${winner.name}` : `${completedGames}/${games.length} games`}</p>
          {teamTwo ? <p className="text-xs text-mist">Players are paired by rating.</p> : null}
        </div>
      </div>
      {teamOne && teamTwo ? (
        <div className="mt-3 grid gap-3">
          {games.length ? (
            games.map((game) => (
              <TournamentPlayerGameRow
                key={game.id}
                tournament={tournament}
                match={match}
                game={game}
                round={round}
                teamOne={teamOne}
                teamTwo={teamTwo}
              />
            ))
          ) : (
            <p className="rounded-md border border-paddle/40 bg-paddle/10 p-3 text-sm font-bold text-paddle">
              No player games could be scheduled for this matchup.
            </p>
          )}
        </div>
      ) : (
        <p className="mt-3 rounded-md border border-court/40 bg-court/10 p-3 text-sm font-bold text-court">
          Bye: {teamOne?.name ?? "Team"} advances automatically.
        </p>
      )}
    </div>
  );
}

function TournamentPlayerGameRow({
  tournament,
  match,
  game,
  round,
  teamOne,
  teamTwo
}: {
  tournament: Tournament;
  match: TournamentMatch;
  game: TournamentPlayerGame;
  round: number;
  teamOne: TournamentTeam;
  teamTwo: TournamentTeam;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    async (_state, formData) => updateTournamentGamePlayersAction(formData),
    undefined
  );
  const playerOne = teamOne.players.find((player) => player.id === game.playerOneId);
  const playerTwo = teamTwo.players.find((player) => player.id === game.playerTwoId);
  const winner =
    game.winnerTeamId === teamOne.id ? playerOne : game.winnerTeamId === teamTwo.id ? playerTwo : null;

  return (
    <div className="rounded-md border border-line bg-graphite/70 p-3">
      {game.status === "complete" ? (
        <>
          <div className="grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
            <PlayerSlot teamName={teamOne.name} playerName={playerOne?.displayName ?? "TBD"} rating={playerOne?.rating ?? 0} />
            <div className="text-center text-xs font-black uppercase tracking-[0.14em] text-mist">vs</div>
            <PlayerSlot teamName={teamTwo.name} playerName={playerTwo?.displayName ?? "TBD"} rating={playerTwo?.rating ?? 0} alignRight />
          </div>
          <p className="mt-3 rounded-md border border-court/40 bg-court/10 p-3 text-sm font-bold text-court">
            {game.playerOneScore}-{game.playerTwoScore} · winner: {winner?.displayName ?? "recorded"}
          </p>
        </>
      ) : (
        <>
          <form action={formAction} className="grid gap-3">
            <input type="hidden" name="tournamentId" value={tournament.id} />
            <input type="hidden" name="round" value={round} />
            <input type="hidden" name="matchId" value={match.id} />
            <input type="hidden" name="gameId" value={game.id} />
            <div className="grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
              <PlayerSelect team={teamOne} name="playerOneId" defaultValue={playerOne?.id ?? teamOne.players[0]?.id ?? ""} />
              <div className="pb-3 text-center text-xs font-black uppercase tracking-[0.14em] text-mist">vs</div>
              <PlayerSelect team={teamTwo} name="playerTwoId" defaultValue={playerTwo?.id ?? teamTwo.players[0]?.id ?? ""} alignRight />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <SubmitButton disabled={pending} className="border border-line bg-night text-ink shadow-none hover:bg-slate-900">
                <Save className="mr-2 h-4 w-4" />
                {pending ? "Saving..." : "Save lineup"}
              </SubmitButton>
              <a
                className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-court px-4 py-3 font-black text-night shadow-glow hover:bg-emerald-300"
                href={`/admin/tournaments/${tournament.id}/play?round=${round}&match=${encodeURIComponent(match.id)}&game=${encodeURIComponent(game.id)}`}
              >
                <Play className="h-4 w-4 fill-current" />
                Play game
              </a>
            </div>
          </form>
          {state?.error ? <p className="mt-3 text-sm font-bold text-paddle">{state.error}</p> : null}
          {state?.success ? <p className="mt-3 text-sm font-bold text-court">{state.success}</p> : null}
        </>
      )}
    </div>
  );
}

function PlayerSelect({
  team,
  name,
  defaultValue,
  alignRight = false
}: {
  team: TournamentTeam;
  name: string;
  defaultValue: string;
  alignRight?: boolean;
}) {
  return (
    <label className={cn("grid gap-2 text-left text-xs font-bold text-mist", alignRight ? "sm:text-right" : "")}>
      {team.name}
      <select className={inputClass} name={name} defaultValue={defaultValue}>
        {team.players.map((player) => (
          <option key={player.id} value={player.id}>
            {player.displayName} ({player.rating})
          </option>
        ))}
      </select>
    </label>
  );
}

function PlayerSlot({
  teamName,
  playerName,
  rating,
  alignRight = false
}: {
  teamName: string;
  playerName: string;
  rating: number;
  alignRight?: boolean;
}) {
  return (
    <div className={cn("min-w-0", alignRight ? "text-left sm:text-right" : "text-left")}>
      <p className="truncate text-sm font-black text-ink">{playerName}</p>
      <p className="text-xs font-bold text-mist">
        {teamName} · {rating}
      </p>
    </div>
  );
}

function AdvanceRoundForm({ tournamentId, isFinalRound }: { tournamentId: string; isFinalRound: boolean }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    async (_state, formData) => advanceTournamentRoundAction(formData),
    undefined
  );

  return (
    <form action={formAction} className="grid gap-2">
      <input type="hidden" name="tournamentId" value={tournamentId} />
      <SubmitButton disabled={pending} className="bg-gold hover:bg-yellow-300">
        {pending ? "Working..." : isFinalRound ? "Complete tournament" : "Generate next round"}
      </SubmitButton>
      {state?.error ? <p className="text-sm font-bold text-paddle">{state.error}</p> : null}
      {state?.success ? <p className="text-sm font-bold text-court">{state.success}</p> : null}
    </form>
  );
}
