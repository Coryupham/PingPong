"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { calculateElo, recalculateRatings } from "@/lib/elo";
import { isValidFinalScore, getWinner } from "@/lib/scoring";
import { createSupabaseAdminClient } from "@/lib/supabase";

const gameSchema = z.object({
  playerOneEmail: z.string().email(),
  playerTwoEmail: z.string().email(),
  playerOnePin: z.string().min(4),
  playerTwoPin: z.string().min(4),
  playerOneScore: z.coerce.number().int().min(0).max(99),
  playerTwoScore: z.coerce.number().int().min(0).max(99),
  firstServerEmail: z.string().email().optional()
});

const verifyPlayersSchema = z.object({
  playerOneEmail: z.string().trim().toLowerCase().email("Enter player 1 email."),
  playerTwoEmail: z.string().trim().toLowerCase().email("Enter player 2 email."),
  playerOnePin: z.string().min(4, "Enter player 1 PIN."),
  playerTwoPin: z.string().min(4, "Enter player 2 PIN.")
});

export async function verifyPlayersAction(formData: FormData) {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return { error: "Configure Supabase before verifying players." };
  }

  const parsed = verifyPlayersSchema.safeParse({
    playerOneEmail: formData.get("playerOneEmail"),
    playerTwoEmail: formData.get("playerTwoEmail"),
    playerOnePin: formData.get("playerOnePin"),
    playerTwoPin: formData.get("playerTwoPin")
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid player details." };
  }

  if (parsed.data.playerOneEmail === parsed.data.playerTwoEmail) {
    return { error: "Choose two different players." };
  }

  const { data: players } = await supabase
    .from("players")
    .select("id, display_name, email, pin_hash")
    .in("email", [parsed.data.playerOneEmail, parsed.data.playerTwoEmail]);

  const playerOne = players?.find((player) => player.email === parsed.data.playerOneEmail);
  const playerTwo = players?.find((player) => player.email === parsed.data.playerTwoEmail);

  if (!playerOne || !playerTwo) {
    return { error: "Both players must be on the league roster." };
  }

  const [playerOnePinMatches, playerTwoPinMatches] = await Promise.all([
    bcrypt.compare(parsed.data.playerOnePin, playerOne.pin_hash),
    bcrypt.compare(parsed.data.playerTwoPin, playerTwo.pin_hash)
  ]);

  if (!playerOnePinMatches || !playerTwoPinMatches) {
    return { error: "One or both player PINs did not match." };
  }

  return {
    success: true,
    players: {
      playerOne: {
        displayName: playerOne.display_name,
        email: playerOne.email
      },
      playerTwo: {
        displayName: playerTwo.display_name,
        email: playerTwo.email
      }
    }
  };
}

export async function submitMatchAction(formData: FormData) {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return { error: "Configure Supabase before submitting matches." };
  }

  const parsed = gameSchema.safeParse({
    playerOneEmail: String(formData.get("playerOneEmail") ?? "").toLowerCase(),
    playerTwoEmail: String(formData.get("playerTwoEmail") ?? "").toLowerCase(),
    playerOnePin: formData.get("playerOnePin"),
    playerTwoPin: formData.get("playerTwoPin"),
    playerOneScore: formData.get("playerOneScore"),
    playerTwoScore: formData.get("playerTwoScore"),
    firstServerEmail: String(formData.get("firstServerEmail") || "").toLowerCase() || undefined
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid match." };
  }

  if (parsed.data.playerOneEmail === parsed.data.playerTwoEmail) {
    return { error: "Choose two different players." };
  }

  const score = {
    playerOne: parsed.data.playerOneScore,
    playerTwo: parsed.data.playerTwoScore
  };

  if (!isValidFinalScore(score)) {
    return { error: "Final score must reach 11 and win by two." };
  }

  const { data: players } = await supabase
    .from("players")
    .select("id, display_name, email, pin_hash, rating, wins, losses, games_played, points_for, points_against")
    .in("email", [parsed.data.playerOneEmail, parsed.data.playerTwoEmail]);

  const playerOne = players?.find((player) => player.email === parsed.data.playerOneEmail);
  const playerTwo = players?.find((player) => player.email === parsed.data.playerTwoEmail);

  if (!playerOne || !playerTwo) {
    return { error: "Both players must be on the league roster." };
  }

  const firstServer =
    parsed.data.firstServerEmail === playerOne.email
      ? playerOne
      : parsed.data.firstServerEmail === playerTwo.email
        ? playerTwo
        : null;

  if (!firstServer) {
    return { error: "Flip the coin before submitting the match." };
  }

  const [playerOnePinMatches, playerTwoPinMatches] = await Promise.all([
    bcrypt.compare(parsed.data.playerOnePin, playerOne.pin_hash),
    bcrypt.compare(parsed.data.playerTwoPin, playerTwo.pin_hash)
  ]);

  if (!playerOnePinMatches || !playerTwoPinMatches) {
    return { error: "One or both player PINs did not match." };
  }

  const winnerSide = getWinner(score);
  const winnerId = winnerSide === "playerOne" ? playerOne.id : playerTwo.id;
  const winner = winnerSide === "playerOne" ? playerOne : playerTwo;
  const loserId = winnerId === playerOne.id ? playerTwo.id : playerOne.id;
  const winnerRating = winnerId === playerOne.id ? playerOne.rating : playerTwo.rating;
  const loserRating = loserId === playerOne.id ? playerOne.rating : playerTwo.rating;
  const elo = calculateElo(winnerRating, loserRating);

  const { data: match, error: matchError } = await supabase
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
      winner_id: winnerId,
      winner_name: winner.display_name,
      winner_email: winner.email,
      first_server_id: firstServer.id,
      first_server_name: firstServer.display_name,
      first_server_email: firstServer.email,
      submitted_by: playerOne.id,
      confirmed_by: playerTwo.id,
      status: "final"
    })
    .select()
    .single();

  if (matchError || !match) {
    return { error: matchError?.message ?? "Could not submit match." };
  }

  await supabase.from("rating_events").insert([
    {
      match_id: match.id,
      player_id: winnerId,
      rating_before: winnerRating,
      rating_after: elo.winnerRating,
      rating_delta: elo.winnerDelta
    },
    {
      match_id: match.id,
      player_id: loserId,
      rating_before: loserRating,
      rating_after: elo.loserRating,
      rating_delta: elo.loserDelta
    }
  ]);

  const playerOneWon = winnerId === playerOne.id;
  await supabase
    .from("players")
    .update({
      rating: playerOneWon ? elo.winnerRating : elo.loserRating,
      wins: playerOne.wins + (playerOneWon ? 1 : 0),
      losses: playerOne.losses + (playerOneWon ? 0 : 1),
      games_played: playerOne.games_played + 1,
      points_for: playerOne.points_for + score.playerOne,
      points_against: playerOne.points_against + score.playerTwo
    })
    .eq("id", playerOne.id);

  await supabase
    .from("players")
    .update({
      rating: playerOneWon ? elo.loserRating : elo.winnerRating,
      wins: playerTwo.wins + (playerOneWon ? 0 : 1),
      losses: playerTwo.losses + (playerOneWon ? 1 : 0),
      games_played: playerTwo.games_played + 1,
      points_for: playerTwo.points_for + score.playerTwo,
      points_against: playerTwo.points_against + score.playerOne
    })
    .eq("id", playerTwo.id);

  revalidatePath("/rankings");
  revalidatePath("/game");
  return { success: "Match submitted." };
}

export async function recalculateAllStats(adminId: string) {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return { error: "Supabase admin client is not configured." };
  }

  const [{ data: profiles }, { data: matches }] = await Promise.all([
    admin.from("players").select("id"),
    admin
      .from("matches")
      .select("player_one_id, player_two_id, winner_id, player_one_score, player_two_score")
      .neq("status", "voided")
      .order("created_at", { ascending: true })
  ]);

  const recalculated = recalculateRatings(
    profiles?.map((player) => player.id) ?? [],
    matches ?? []
  );

  for (const player of recalculated) {
    await admin.from("players").update(player).eq("id", player.id);
  }

  await admin.from("admin_audit_log").insert({
    admin_id: adminId,
    action: "recalculate_stats",
    target_table: "players",
    before_data: null,
    after_data: { player_count: recalculated.length }
  });

  return { success: true };
}
