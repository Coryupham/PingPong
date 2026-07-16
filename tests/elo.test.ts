import { describe, expect, it } from "vitest";
import { calculateElo, recalculateRatings } from "@/lib/elo";

describe("elo", () => {
  it("updates winner and loser around equal ratings", () => {
    const result = calculateElo(1000, 1000);

    expect(result.winnerRating).toBe(1016);
    expect(result.loserRating).toBe(984);
    expect(result.winnerDelta).toBe(16);
    expect(result.loserDelta).toBe(-16);
  });

  it("recalculates ratings and stats from chronological matches", () => {
    const [a, b] = recalculateRatings(["a", "b"], [
      {
        player_one_id: "a",
        player_two_id: "b",
        winner_id: "a",
        player_one_score: 11,
        player_two_score: 7
      },
      {
        player_one_id: "a",
        player_two_id: "b",
        winner_id: "b",
        player_one_score: 9,
        player_two_score: 11
      }
    ]);

    expect(a.games_played).toBe(2);
    expect(b.games_played).toBe(2);
    expect(a.wins).toBe(1);
    expect(b.wins).toBe(1);
    expect(a.points_for).toBe(20);
    expect(b.points_for).toBe(18);
  });
});
