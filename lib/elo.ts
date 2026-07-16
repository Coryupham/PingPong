export type RatingPlayer = {
  id: string;
  rating: number;
};

export type EloResult = {
  winnerRating: number;
  loserRating: number;
  winnerDelta: number;
  loserDelta: number;
};

const DEFAULT_K_FACTOR = 32;

export function expectedScore(playerRating: number, opponentRating: number) {
  return 1 / (1 + 10 ** ((opponentRating - playerRating) / 400));
}

export function calculateElo(winnerRating: number, loserRating: number, kFactor = DEFAULT_K_FACTOR): EloResult {
  const winnerExpected = expectedScore(winnerRating, loserRating);
  const loserExpected = expectedScore(loserRating, winnerRating);
  const winnerDelta = Math.round(kFactor * (1 - winnerExpected));
  const loserDelta = Math.round(kFactor * (0 - loserExpected));

  return {
    winnerRating: winnerRating + winnerDelta,
    loserRating: loserRating + loserDelta,
    winnerDelta,
    loserDelta
  };
}

export type RecalcMatch = {
  player_one_id: string;
  player_two_id: string;
  winner_id: string;
  player_one_score: number;
  player_two_score: number;
};

export type RecalculatedPlayer = {
  id: string;
  rating: number;
  wins: number;
  losses: number;
  games_played: number;
  points_for: number;
  points_against: number;
};

export function recalculateRatings(playerIds: string[], matches: RecalcMatch[]) {
  const players = new Map<string, RecalculatedPlayer>();

  for (const id of playerIds) {
    players.set(id, {
      id,
      rating: 1000,
      wins: 0,
      losses: 0,
      games_played: 0,
      points_for: 0,
      points_against: 0
    });
  }

  for (const match of matches) {
    const p1 = players.get(match.player_one_id);
    const p2 = players.get(match.player_two_id);
    if (!p1 || !p2) {
      continue;
    }

    const winner = match.winner_id === p1.id ? p1 : p2;
    const loser = winner.id === p1.id ? p2 : p1;
    const elo = calculateElo(winner.rating, loser.rating);

    winner.rating = elo.winnerRating;
    loser.rating = elo.loserRating;
    winner.wins += 1;
    loser.losses += 1;
    winner.games_played += 1;
    loser.games_played += 1;
    p1.points_for += match.player_one_score;
    p1.points_against += match.player_two_score;
    p2.points_for += match.player_two_score;
    p2.points_against += match.player_one_score;
  }

  return Array.from(players.values());
}
