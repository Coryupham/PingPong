import { describe, expect, it } from "vitest";
import { getServer, getWinner, isValidFinalScore } from "@/lib/scoring";

describe("scoring", () => {
  it("requires a player to reach 11 and win by two", () => {
    expect(isValidFinalScore({ playerOne: 10, playerTwo: 8 })).toBe(false);
    expect(isValidFinalScore({ playerOne: 11, playerTwo: 10 })).toBe(false);
    expect(isValidFinalScore({ playerOne: 11, playerTwo: 11 })).toBe(false);
    expect(isValidFinalScore({ playerOne: 12, playerTwo: 10 })).toBe(true);
    expect(getWinner({ playerOne: 9, playerTwo: 11 })).toBe("playerTwo");
  });

  it("switches serve after every two total points before deuce", () => {
    expect(getServer("playerOne", { playerOne: 0, playerTwo: 0 })).toBe("playerOne");
    expect(getServer("playerOne", { playerOne: 1, playerTwo: 0 })).toBe("playerOne");
    expect(getServer("playerOne", { playerOne: 1, playerTwo: 1 })).toBe("playerTwo");
    expect(getServer("playerOne", { playerOne: 2, playerTwo: 1 })).toBe("playerTwo");
    expect(getServer("playerOne", { playerOne: 2, playerTwo: 2 })).toBe("playerOne");
  });

  it("switches serve every point once both players reach 10", () => {
    expect(getServer("playerOne", { playerOne: 10, playerTwo: 10 })).toBe("playerOne");
    expect(getServer("playerOne", { playerOne: 11, playerTwo: 10 })).toBe("playerTwo");
    expect(getServer("playerOne", { playerOne: 11, playerTwo: 11 })).toBe("playerOne");
  });
});
