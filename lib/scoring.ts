export type PlayerSide = "playerOne" | "playerTwo";

export type ScoreState = {
  playerOne: number;
  playerTwo: number;
};

export const MAX_SCORE = 11;
export const MAX_RECORDED_SCORE = 99;

export function getWinner(score: ScoreState): PlayerSide | null {
  const { playerOne, playerTwo } = score;
  const high = Math.max(playerOne, playerTwo);
  const lead = Math.abs(playerOne - playerTwo);

  if (high < MAX_SCORE || lead < 2) {
    return null;
  }

  return playerOne > playerTwo ? "playerOne" : "playerTwo";
}

export function isValidFinalScore(score: ScoreState) {
  return getWinner(score) !== null;
}

export function getServer(firstServer: PlayerSide | null, score: ScoreState): PlayerSide | null {
  if (!firstServer) {
    return null;
  }

  const totalPoints = score.playerOne + score.playerTwo;
  const isDeuceOrLater = score.playerOne >= MAX_SCORE - 1 && score.playerTwo >= MAX_SCORE - 1;

  if (isDeuceOrLater) {
    return totalPoints % 2 === 0
      ? firstServer
      : firstServer === "playerOne"
        ? "playerTwo"
        : "playerOne";
  }

  const serviceBlock = Math.floor(totalPoints / 2);
  const firstServes = serviceBlock % 2 === 0;

  if (firstServes) {
    return firstServer;
  }

  return firstServer === "playerOne" ? "playerTwo" : "playerOne";
}

export function clampScore(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(MAX_RECORDED_SCORE, Math.trunc(value)));
}

export function pointDifferential(scoreFor: number, scoreAgainst: number) {
  return scoreFor - scoreAgainst;
}
