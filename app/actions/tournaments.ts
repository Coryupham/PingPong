"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { calculateElo } from "@/lib/elo";
import { getCurrentProfile } from "@/lib/data";
import { getWinner, isValidFinalScore } from "@/lib/scoring";
import { createSupabaseAdminClient } from "@/lib/supabase";
import type { Player, Tournament, TournamentMatch, TournamentPlayerGame, TournamentRound, TournamentTeam } from "@/lib/types";

type FormState = {
  error?: string;
  success?: string;
} | void;

type DraftTeam = {
  id: string;
  name: string;
  playerIds: string[];
};

const createTournamentSchema = z.object({
  name: z.string().trim().min(2, "Tournament name is required."),
  teamCount: z.coerce.number().int().min(2, "Create at least two teams.").max(32, "Use 32 teams or fewer."),
  playersPerTeam: z.coerce.number().int().min(1, "Each team needs at least one player.").max(12, "Use 12 players or fewer per team."),
  teamsJson: z.string().min(2, "Generate teams before completing the bracket.")
});

const advanceTournamentSchema = z.object({
  tournamentId: z.string().uuid()
});

const updateTournamentGamePlayersSchema = z.object({
  tournamentId: z.string().uuid(),
  round: z.coerce.number().int().min(1),
  matchId: z.string().min(1),
  gameId: z.string().min(1),
  playerOneId: z.string().uuid(),
  playerTwoId: z.string().uuid()
});

const scoreTournamentMatchSchema = z.object({
  tournamentId: z.string().uuid(),
  round: z.coerce.number().int().min(1),
  matchId: z.string().min(1),
  gameId: z.string().min(1),
  playerOneId: z.string().uuid().optional(),
  playerTwoId: z.string().uuid().optional(),
  firstServerId: z.string().uuid().optional(),
  playerOneScore: z.coerce.number().int().min(0).max(99),
  playerTwoScore: z.coerce.number().int().min(0).max(99)
});

function parseDraftTeams(value: string): DraftTeam[] | null {
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return null;
    }

    return parsed.map((team) => ({
      id: String(team.id ?? ""),
      name: String(team.name ?? ""),
      playerIds: Array.isArray(team.playerIds) ? team.playerIds.map(String) : []
    }));
  } catch {
    return null;
  }
}

function buildTournamentTeams(draftTeams: DraftTeam[], players: Player[]) {
  const playerById = new Map(players.map((player) => [player.id, player]));

  return draftTeams.map((team, index): TournamentTeam => {
    const teamPlayers = team.playerIds.map((playerId) => playerById.get(playerId)).filter(Boolean) as Player[];
    const ratingTotal = teamPlayers.reduce((total, player) => total + player.rating, 0);

    return {
      id: team.id,
      name: team.name.trim() || `Team ${index + 1}`,
      seed: index + 1,
      players: teamPlayers.map((player) => ({
        id: player.id,
        displayName: player.display_name,
        email: player.email,
        rating: player.rating
      })),
      ratingTotal,
      averageRating: teamPlayers.length ? Math.round(ratingTotal / teamPlayers.length) : 0
    };
  });
}

function buildScheduledGames(
  teamOne: TournamentTeam,
  teamTwo: TournamentTeam,
  roundNumber: number,
  matchNumber: number
): TournamentPlayerGame[] {
  const teamOnePlayers = [...teamOne.players].sort((a, b) => b.rating - a.rating || a.displayName.localeCompare(b.displayName));
  const teamTwoPlayers = [...teamTwo.players].sort((a, b) => b.rating - a.rating || a.displayName.localeCompare(b.displayName));

  return teamOnePlayers.map((player, index) => ({
    id: `round-${roundNumber}-match-${matchNumber}-game-${index + 1}`,
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

function buildRound(teams: TournamentTeam[], roundNumber: number): TournamentRound {
  const seededTeams = [...teams].sort((a, b) => b.ratingTotal - a.ratingTotal || a.name.localeCompare(b.name));
  const matches: TournamentMatch[] = [];

  for (let index = 0; index < Math.ceil(seededTeams.length / 2); index += 1) {
    const teamOne = seededTeams[index] ?? null;
    const teamTwo = seededTeams[seededTeams.length - 1 - index] ?? null;
    const hasBye = Boolean(teamOne && (!teamTwo || teamOne.id === teamTwo.id));

    if (!teamOne) {
      continue;
    }

    matches.push({
      id: `round-${roundNumber}-match-${index + 1}`,
      matchNumber: index + 1,
      teamOneId: teamOne.id,
      teamTwoId: hasBye ? null : teamTwo?.id ?? null,
      games: hasBye || !teamTwo ? [] : buildScheduledGames(teamOne, teamTwo, roundNumber, index + 1),
      winnerTeamId: hasBye ? teamOne.id : null,
      status: hasBye ? "complete" : "pending"
    });
  }

  return {
    round: roundNumber,
    matches
  };
}

function teamById(teams: TournamentTeam[]) {
  return new Map(teams.map((team) => [team.id, team]));
}

function getTeamMatchWinner(match: TournamentMatch, teamOne: TournamentTeam, teamTwo: TournamentTeam) {
  const completedGames = match.games.filter((game) => game.status === "complete" && game.winnerTeamId);
  const teamOneGameWins = completedGames.filter((game) => game.winnerTeamId === teamOne.id).length;
  const teamTwoGameWins = completedGames.filter((game) => game.winnerTeamId === teamTwo.id).length;

  if (teamOneGameWins > teamTwoGameWins) {
    return teamOne.id;
  }

  if (teamTwoGameWins > teamOneGameWins) {
    return teamTwo.id;
  }

  const pointDifferential = completedGames.reduce(
    (total, game) => total + (game.playerOneScore ?? 0) - (game.playerTwoScore ?? 0),
    0
  );

  if (pointDifferential > 0) {
    return teamOne.id;
  }

  if (pointDifferential < 0) {
    return teamTwo.id;
  }

  return teamOne.ratingTotal <= teamTwo.ratingTotal ? teamOne.id : teamTwo.id;
}

export async function createTournamentAction(formData: FormData): Promise<FormState> {
  const profile = await getCurrentProfile();
  const supabase = createSupabaseAdminClient();

  if (!profile?.is_admin || !supabase) {
    return { error: "Admin access required." };
  }

  const parsed = createTournamentSchema.safeParse({
    name: formData.get("name"),
    teamCount: formData.get("teamCount"),
    playersPerTeam: formData.get("playersPerTeam"),
    teamsJson: formData.get("teamsJson")
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid tournament." };
  }

  const draftTeams = parseDraftTeams(parsed.data.teamsJson);
  if (!draftTeams || draftTeams.length !== parsed.data.teamCount) {
    return { error: "Generate and review the requested number of teams before completing the bracket." };
  }

  const playerIds = draftTeams.flatMap((team) => team.playerIds);
  const uniquePlayerIds = new Set(playerIds);
  const requiredPlayerCount = parsed.data.teamCount * parsed.data.playersPerTeam;

  if (playerIds.length !== requiredPlayerCount || uniquePlayerIds.size !== requiredPlayerCount) {
    return { error: `Select exactly ${requiredPlayerCount} unique players for this tournament.` };
  }

  if (draftTeams.some((team) => team.playerIds.length !== parsed.data.playersPerTeam)) {
    return { error: `Each team must have exactly ${parsed.data.playersPerTeam} players.` };
  }

  const { count: activeTournamentCount, error: activeTournamentError } = await supabase
    .from("tournaments")
    .select("id", { count: "exact", head: true })
    .eq("status", "active");

  if (activeTournamentError) {
    return { error: activeTournamentError.message };
  }

  if ((activeTournamentCount ?? 0) > 0) {
    return { error: "Complete the active tournament before creating a new one." };
  }

  const { data: players, error: playersError } = await supabase
    .from("players")
    .select("*")
    .in("id", Array.from(uniquePlayerIds));

  if (playersError || !players || players.length !== requiredPlayerCount) {
    return { error: playersError?.message ?? "Could not load every selected player." };
  }

  const teams = buildTournamentTeams(draftTeams, players);
  const rounds = [buildRound(teams, 1)];

  const { data: tournament, error } = await supabase
    .from("tournaments")
    .insert({
      name: parsed.data.name,
      team_count: parsed.data.teamCount,
      players_per_team: parsed.data.playersPerTeam,
      teams,
      rounds,
      current_round: 1,
      status: "active",
      created_by: profile.id
    })
    .select("id")
    .single();

  if (error || !tournament) {
    return { error: error?.message ?? "Could not create tournament." };
  }

  await supabase.from("admin_audit_log").insert({
    admin_id: profile.id,
    action: "create_tournament",
    target_table: "tournaments",
    target_id: tournament.id,
    before_data: null,
    after_data: {
      name: parsed.data.name,
      team_count: parsed.data.teamCount,
      players_per_team: parsed.data.playersPerTeam
    }
  });

  revalidatePath("/admin");
  revalidatePath("/admin/tournaments");
  return { success: "Tournament bracket completed and first-round matches created." };
}

export async function advanceTournamentRoundAction(formData: FormData): Promise<FormState> {
  const profile = await getCurrentProfile();
  const supabase = createSupabaseAdminClient();

  if (!profile?.is_admin || !supabase) {
    return { error: "Admin access required." };
  }

  const parsed = advanceTournamentSchema.safeParse({
    tournamentId: formData.get("tournamentId")
  });

  if (!parsed.success) {
    return { error: "Invalid tournament." };
  }

  const { data: tournament, error: loadError } = await supabase
    .from("tournaments")
    .select("*")
    .eq("id", parsed.data.tournamentId)
    .single();

  if (loadError || !tournament) {
    return { error: loadError?.message ?? "Tournament not found." };
  }

  const currentTournament = tournament as Tournament;
  if (currentTournament.status === "complete") {
    return { error: "This tournament is already complete." };
  }

  const roundIndex = currentTournament.rounds.findIndex((round) => round.round === currentTournament.current_round);
  const currentRound = currentTournament.rounds[roundIndex];

  if (!currentRound) {
    return { error: "Current round was not found." };
  }

  const teamsById = teamById(currentTournament.teams);
  const hasPendingMatches = currentRound.matches.some((match) => match.status !== "complete" || !match.winnerTeamId);

  if (hasPendingMatches) {
    return { error: "Record every tournament game in this round before advancing." };
  }

  const completedMatches = currentRound.matches;

  const advancingTeams = completedMatches
    .map((match) => (match.winnerTeamId ? teamsById.get(match.winnerTeamId) : null))
    .filter(Boolean) as TournamentTeam[];

  if (!advancingTeams.length) {
    return { error: "No teams can advance from this round." };
  }

  const updatedRounds = [...currentTournament.rounds];
  updatedRounds[roundIndex] = {
    ...currentRound,
    matches: completedMatches
  };

  const isComplete = advancingTeams.length === 1;
  if (!isComplete) {
    updatedRounds.push(buildRound(advancingTeams, currentTournament.current_round + 1));
  }

  const { error: updateError } = await supabase
    .from("tournaments")
    .update({
      rounds: updatedRounds,
      current_round: isComplete ? currentTournament.current_round : currentTournament.current_round + 1,
      status: isComplete ? "complete" : "active"
    })
    .eq("id", currentTournament.id);

  if (updateError) {
    return { error: updateError.message };
  }

  await supabase.from("admin_audit_log").insert({
    admin_id: profile.id,
    action: isComplete ? "complete_tournament" : "advance_tournament_round",
    target_table: "tournaments",
    target_id: currentTournament.id,
    before_data: {
      current_round: currentTournament.current_round,
      status: currentTournament.status
    },
    after_data: {
      current_round: isComplete ? currentTournament.current_round : currentTournament.current_round + 1,
      status: isComplete ? "complete" : "active"
    }
  });

  revalidatePath("/admin");
  revalidatePath("/admin/tournaments");
  return { success: isComplete ? "Tournament complete." : "Next round matches generated." };
}

export async function updateTournamentGamePlayersAction(formData: FormData): Promise<FormState> {
  const profile = await getCurrentProfile();
  const supabase = createSupabaseAdminClient();

  if (!profile?.is_admin || !supabase) {
    return { error: "Admin access required." };
  }

  const parsed = updateTournamentGamePlayersSchema.safeParse({
    tournamentId: formData.get("tournamentId"),
    round: formData.get("round"),
    matchId: formData.get("matchId"),
    gameId: formData.get("gameId"),
    playerOneId: formData.get("playerOneId"),
    playerTwoId: formData.get("playerTwoId")
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid tournament game." };
  }

  const { data: tournament, error: tournamentError } = await supabase
    .from("tournaments")
    .select("*")
    .eq("id", parsed.data.tournamentId)
    .single();

  if (tournamentError || !tournament) {
    return { error: tournamentError?.message ?? "Tournament not found." };
  }

  const currentTournament = tournament as Tournament;
  if (currentTournament.status === "complete") {
    return { error: "This tournament is already complete." };
  }

  const roundIndex = currentTournament.rounds.findIndex((round) => round.round === parsed.data.round);
  const round = currentTournament.rounds[roundIndex];
  const matchIndex = round?.matches.findIndex((match) => match.id === parsed.data.matchId) ?? -1;
  const match = matchIndex >= 0 ? round.matches[matchIndex] : null;

  if (!round || !match) {
    return { error: "Tournament match not found." };
  }

  if (match.status === "complete") {
    return { error: "This team match is already complete." };
  }

  const teamsById = teamById(currentTournament.teams);
  const teamOne = match.teamOneId ? teamsById.get(match.teamOneId) : null;
  const teamTwo = match.teamTwoId ? teamsById.get(match.teamTwoId) : null;

  if (!teamOne || !teamTwo) {
    return { error: "Tournament teams were not found." };
  }

  const teamOnePlayerIds = new Set(teamOne.players.map((player) => player.id));
  const teamTwoPlayerIds = new Set(teamTwo.players.map((player) => player.id));

  if (!teamOnePlayerIds.has(parsed.data.playerOneId) || !teamTwoPlayerIds.has(parsed.data.playerTwoId)) {
    return { error: "Substitutions must come from the selected tournament teams." };
  }

  if (parsed.data.playerOneId === parsed.data.playerTwoId) {
    return { error: "Choose two different players." };
  }

  const matchWithGames =
    match.games?.length ? match : { ...match, games: buildScheduledGames(teamOne, teamTwo, parsed.data.round, match.matchNumber) };
  const game = matchWithGames.games.find((matchGame) => matchGame.id === parsed.data.gameId);

  if (!game) {
    return { error: "Tournament game not found." };
  }

  if (game.status === "complete") {
    return { error: "This player game has already been recorded." };
  }

  const updatedGames = matchWithGames.games.map((matchGame) =>
    matchGame.id === game.id
      ? {
          ...matchGame,
          playerOneId: parsed.data.playerOneId,
          playerTwoId: parsed.data.playerTwoId
        }
      : matchGame
  );
  const updatedRounds = [...currentTournament.rounds];

  updatedRounds[roundIndex] = {
    ...round,
    matches: round.matches.map((roundMatch) =>
      roundMatch.id === match.id ? { ...matchWithGames, games: updatedGames } : roundMatch
    )
  };

  const { error: updateError } = await supabase
    .from("tournaments")
    .update({ rounds: updatedRounds })
    .eq("id", currentTournament.id);

  if (updateError) {
    return { error: updateError.message };
  }

  await supabase.from("admin_audit_log").insert({
    admin_id: profile.id,
    action: "update_tournament_game_players",
    target_table: "tournaments",
    target_id: currentTournament.id,
    before_data: {
      tournament_round: parsed.data.round,
      tournament_match_id: match.id,
      tournament_game_id: game.id,
      player_one_id: game.playerOneId,
      player_two_id: game.playerTwoId
    },
    after_data: {
      tournament_round: parsed.data.round,
      tournament_match_id: match.id,
      tournament_game_id: game.id,
      player_one_id: parsed.data.playerOneId,
      player_two_id: parsed.data.playerTwoId
    }
  });

  revalidatePath("/admin/tournaments");
  revalidatePath(`/admin/tournaments/${currentTournament.id}/play`);
  return { success: "Tournament game lineup saved." };
}

export async function scoreTournamentMatchAction(_state: FormState, formData: FormData): Promise<FormState> {
  const profile = await getCurrentProfile();
  const supabase = createSupabaseAdminClient();

  if (!profile?.is_admin || !supabase) {
    return { error: "Admin access required." };
  }

  const parsed = scoreTournamentMatchSchema.safeParse({
    tournamentId: formData.get("tournamentId"),
    round: formData.get("round"),
    matchId: formData.get("matchId"),
    gameId: formData.get("gameId"),
    playerOneId: String(formData.get("playerOneId") || "") || undefined,
    playerTwoId: String(formData.get("playerTwoId") || "") || undefined,
    firstServerId: String(formData.get("firstServerId") || "") || undefined,
    playerOneScore: formData.get("playerOneScore"),
    playerTwoScore: formData.get("playerTwoScore")
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid tournament game." };
  }

  const score = {
    playerOne: parsed.data.playerOneScore,
    playerTwo: parsed.data.playerTwoScore
  };

  if (!isValidFinalScore(score)) {
    return { error: "Final score must reach 11 and win by two." };
  }

  const { data: tournament, error: tournamentError } = await supabase
    .from("tournaments")
    .select("*")
    .eq("id", parsed.data.tournamentId)
    .single();

  if (tournamentError || !tournament) {
    return { error: tournamentError?.message ?? "Tournament not found." };
  }

  const currentTournament = tournament as Tournament;
  if (currentTournament.status === "complete") {
    return { error: "This tournament is already complete." };
  }

  const roundIndex = currentTournament.rounds.findIndex((round) => round.round === parsed.data.round);
  const round = currentTournament.rounds[roundIndex];
  const matchIndex = round?.matches.findIndex((match) => match.id === parsed.data.matchId) ?? -1;
  const match = matchIndex >= 0 ? round.matches[matchIndex] : null;

  if (!round || !match) {
    return { error: "Tournament match not found." };
  }

  const teamsById = teamById(currentTournament.teams);
  const teamOne = match.teamOneId ? teamsById.get(match.teamOneId) : null;
  const teamTwo = match.teamTwoId ? teamsById.get(match.teamTwoId) : null;

  if (!teamOne || !teamTwo) {
    return { error: "Tournament teams were not found." };
  }

  const matchWithGames =
    match.games?.length ? match : { ...match, games: buildScheduledGames(teamOne, teamTwo, parsed.data.round, match.matchNumber) };
  const gameIndex = matchWithGames.games.findIndex((game) => game.id === parsed.data.gameId);
  const game = gameIndex >= 0 ? matchWithGames.games[gameIndex] : null;

  if (!game) {
    return { error: "Tournament game not found." };
  }

  if (game.status === "complete") {
    return { error: "This player game has already been recorded." };
  }

  const playerOneId = parsed.data.playerOneId ?? game.playerOneId;
  const playerTwoId = parsed.data.playerTwoId ?? game.playerTwoId;
  const teamOnePlayerIds = new Set(teamOne.players.map((player) => player.id));
  const teamTwoPlayerIds = new Set(teamTwo.players.map((player) => player.id));

  if (!teamOnePlayerIds.has(playerOneId) || !teamTwoPlayerIds.has(playerTwoId)) {
    return { error: "Substitutions must come from the selected tournament teams." };
  }

  if (playerOneId === playerTwoId) {
    return { error: "Choose two different players." };
  }

  if (parsed.data.firstServerId && parsed.data.firstServerId !== playerOneId && parsed.data.firstServerId !== playerTwoId) {
    return { error: "First server must be one of the selected players." };
  }

  const { data: players, error: playersError } = await supabase
    .from("players")
    .select("id, display_name, email, pin_hash, rating, wins, losses, games_played, points_for, points_against")
    .in("id", [playerOneId, playerTwoId]);

  const playerOne = players?.find((player) => player.id === playerOneId);
  const playerTwo = players?.find((player) => player.id === playerTwoId);

  if (playersError || !playerOne || !playerTwo) {
    return { error: playersError?.message ?? "Could not load both selected players." };
  }

  const winnerSide = getWinner(score);
  const winner = winnerSide === "playerOne" ? playerOne : playerTwo;
  const loser = winnerSide === "playerOne" ? playerTwo : playerOne;
  const firstServer =
    parsed.data.firstServerId === playerTwo.id ? playerTwo : parsed.data.firstServerId === playerOne.id ? playerOne : null;
  const winnerTeamId = winnerSide === "playerOne" ? teamOne.id : teamTwo.id;
  const elo = calculateElo(winner.rating, loser.rating);

  const { data: recordedMatch, error: matchError } = await supabase
    .from("matches")
    .insert({
      player_one_id: playerOne.id,
      player_one_name: playerOne.display_name,
      player_one_email: playerOne.email,
      player_two_id: playerTwo.id,
      player_two_name: playerTwo.display_name,
      player_two_email: playerTwo.email,
      player_one_score: score.playerOne,
      player_two_score: score.playerTwo,
      winner_id: winner.id,
      winner_name: winner.display_name,
      winner_email: winner.email,
      first_server_id: firstServer?.id ?? null,
      first_server_name: firstServer?.display_name ?? null,
      first_server_email: firstServer?.email ?? null,
      submitted_by: playerOne.id,
      confirmed_by: playerTwo.id,
      tournament_id: currentTournament.id,
      tournament_round: parsed.data.round,
      tournament_match_id: game.id,
      status: "final"
    })
    .select()
    .single();

  if (matchError || !recordedMatch) {
    return { error: matchError?.message ?? "Could not record tournament game." };
  }

  await supabase.from("rating_events").insert([
    {
      match_id: recordedMatch.id,
      player_id: winner.id,
      rating_before: winner.rating,
      rating_after: elo.winnerRating,
      rating_delta: elo.winnerDelta
    },
    {
      match_id: recordedMatch.id,
      player_id: loser.id,
      rating_before: loser.rating,
      rating_after: elo.loserRating,
      rating_delta: elo.loserDelta
    }
  ]);

  await supabase
    .from("players")
    .update({
      rating: winnerSide === "playerOne" ? elo.winnerRating : elo.loserRating,
      wins: playerOne.wins + (winnerSide === "playerOne" ? 1 : 0),
      losses: playerOne.losses + (winnerSide === "playerOne" ? 0 : 1),
      games_played: playerOne.games_played + 1,
      points_for: playerOne.points_for + score.playerOne,
      points_against: playerOne.points_against + score.playerTwo
    })
    .eq("id", playerOne.id);

  await supabase
    .from("players")
    .update({
      rating: winnerSide === "playerTwo" ? elo.winnerRating : elo.loserRating,
      wins: playerTwo.wins + (winnerSide === "playerTwo" ? 1 : 0),
      losses: playerTwo.losses + (winnerSide === "playerTwo" ? 0 : 1),
      games_played: playerTwo.games_played + 1,
      points_for: playerTwo.points_for + score.playerTwo,
      points_against: playerTwo.points_against + score.playerOne
    })
    .eq("id", playerTwo.id);

  const updatedRounds = [...currentTournament.rounds];
  const nextGames = matchWithGames.games.map((matchGame) =>
    matchGame.id === game.id
      ? {
          ...matchGame,
          playerOneId,
          playerTwoId,
          playerOneScore: score.playerOne,
          playerTwoScore: score.playerTwo,
          winnerPlayerId: winner.id,
          winnerTeamId,
          recordedMatchId: recordedMatch.id,
          status: "complete" as const
        }
    : matchGame
  );
  const nextMatch = {
    ...matchWithGames,
    games: nextGames
  };
  const allGamesComplete = nextGames.length > 0 && nextGames.every((matchGame) => matchGame.status === "complete");
  const completedMatch = allGamesComplete
    ? {
        ...nextMatch,
        winnerTeamId: getTeamMatchWinner(nextMatch, teamOne, teamTwo),
        status: "complete" as const
      }
    : nextMatch;

  updatedRounds[roundIndex] = {
    ...round,
    matches: round.matches.map((roundMatch) =>
      roundMatch.id === match.id ? completedMatch : roundMatch
    )
  };

  const { error: tournamentUpdateError } = await supabase
    .from("tournaments")
    .update({ rounds: updatedRounds })
    .eq("id", currentTournament.id);

  if (tournamentUpdateError) {
    return { error: tournamentUpdateError.message };
  }

  await supabase.from("admin_audit_log").insert({
    admin_id: profile.id,
    action: "score_tournament_match",
    target_table: "matches",
    target_id: recordedMatch.id,
    before_data: null,
    after_data: {
      tournament_id: currentTournament.id,
      tournament_round: parsed.data.round,
      tournament_match_id: game.id,
      player_one_id: playerOneId,
      player_two_id: playerTwoId,
      winner_team_id: winnerTeamId
    }
  });

  revalidatePath("/admin");
  revalidatePath("/admin/tournaments");
  revalidatePath("/rankings");
  return { success: "Tournament game recorded and player records updated." };
}
