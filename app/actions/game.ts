"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { calculateElo, recalculateRatings } from "@/lib/elo";
import { isValidFinalScore, getWinner } from "@/lib/scoring";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase";
import { getCurrentProfile } from "@/lib/data";

const gameSchema = z.object({
  opponentId: z.string().uuid(),
  opponentPin: z.string().min(4),
  playerOneScore: z.coerce.number().int().min(0).max(99),
  playerTwoScore: z.coerce.number().int().min(0).max(99),
  firstServerId: z.string().uuid().optional(),
  inviteId: z.string().uuid().optional()
});

export async function submitMatchAction(formData: FormData) {
  const profile = await getCurrentProfile();
  const supabase = await createSupabaseServerClient();

  if (!profile || !supabase) {
    return { error: "Sign in and configure Supabase before submitting matches." };
  }

  const parsed = gameSchema.safeParse({
    opponentId: formData.get("opponentId"),
    opponentPin: formData.get("opponentPin"),
    playerOneScore: formData.get("playerOneScore"),
    playerTwoScore: formData.get("playerTwoScore"),
    firstServerId: formData.get("firstServerId") || undefined,
    inviteId: formData.get("inviteId") || undefined
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid match." };
  }

  if (parsed.data.opponentId === profile.id) {
    return { error: "Choose a different opponent." };
  }

  const score = {
    playerOne: parsed.data.playerOneScore,
    playerTwo: parsed.data.playerTwoScore
  };

  if (!isValidFinalScore(score)) {
    return { error: "Final score must be at least 11 and won by 2." };
  }

  const { data: opponent } = await supabase
    .from("profiles")
    .select("id, pin_hash, rating, wins, losses, games_played, points_for, points_against")
    .eq("id", parsed.data.opponentId)
    .single();

  if (!opponent) {
    return { error: "Opponent not found." };
  }

  const pinMatches = await bcrypt.compare(parsed.data.opponentPin, opponent.pin_hash);
  if (!pinMatches) {
    return { error: "Opponent PIN did not match." };
  }

  const winnerSide = getWinner(score);
  const winnerId = winnerSide === "playerOne" ? profile.id : opponent.id;
  const loserId = winnerId === profile.id ? opponent.id : profile.id;
  const winnerRating = winnerId === profile.id ? profile.rating : opponent.rating;
  const loserRating = loserId === profile.id ? profile.rating : opponent.rating;
  const elo = calculateElo(winnerRating, loserRating);

  const { data: match, error: matchError } = await supabase
    .from("matches")
    .insert({
      player_one_id: profile.id,
      player_two_id: opponent.id,
      player_one_score: score.playerOne,
      player_two_score: score.playerTwo,
      winner_id: winnerId,
      first_server_id: parsed.data.firstServerId,
      invite_id: parsed.data.inviteId,
      submitted_by: profile.id,
      confirmed_by: opponent.id,
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

  const playerOneWon = winnerId === profile.id;
  await supabase
    .from("profiles")
    .update({
      rating: playerOneWon ? elo.winnerRating : elo.loserRating,
      wins: profile.wins + (playerOneWon ? 1 : 0),
      losses: profile.losses + (playerOneWon ? 0 : 1),
      games_played: profile.games_played + 1,
      points_for: profile.points_for + score.playerOne,
      points_against: profile.points_against + score.playerTwo
    })
    .eq("id", profile.id);

  await supabase
    .from("profiles")
    .update({
      rating: playerOneWon ? elo.loserRating : elo.winnerRating,
      wins: opponent.wins + (playerOneWon ? 0 : 1),
      losses: opponent.losses + (playerOneWon ? 1 : 0),
      games_played: opponent.games_played + 1,
      points_for: opponent.points_for + score.playerTwo,
      points_against: opponent.points_against + score.playerOne
    })
    .eq("id", opponent.id);

  if (parsed.data.inviteId) {
    await supabase
      .from("game_invites")
      .update({ status: "accepted", accepted_at: new Date().toISOString() })
      .eq("id", parsed.data.inviteId);
  }

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
    admin.from("profiles").select("id"),
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
    await admin.from("profiles").update(player).eq("id", player.id);
  }

  await admin.from("admin_audit_log").insert({
    admin_id: adminId,
    action: "recalculate_stats",
    target_table: "profiles",
    before_data: null,
    after_data: { player_count: recalculated.length }
  });

  return { success: true };
}
