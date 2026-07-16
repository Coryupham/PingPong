"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentProfile } from "@/lib/data";
import { isValidFinalScore, getWinner } from "@/lib/scoring";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { recalculateAllStats } from "@/app/actions/game";

const editMatchSchema = z.object({
  matchId: z.string().uuid(),
  playerOneScore: z.coerce.number().int().min(0).max(99),
  playerTwoScore: z.coerce.number().int().min(0).max(99)
});

export async function adminEditMatchAction(formData: FormData) {
  const profile = await getCurrentProfile();
  const admin = createSupabaseAdminClient();

  if (!profile?.is_admin || !admin) {
    return { error: "Admin access required." };
  }

  const parsed = editMatchSchema.safeParse({
    matchId: formData.get("matchId"),
    playerOneScore: formData.get("playerOneScore"),
    playerTwoScore: formData.get("playerTwoScore")
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid match edit." };
  }

  const score = { playerOne: parsed.data.playerOneScore, playerTwo: parsed.data.playerTwoScore };
  if (!isValidFinalScore(score)) {
    return { error: "Edited score must be a legal final score." };
  }

  const { data: before } = await admin.from("matches").select("*").eq("id", parsed.data.matchId).single();
  if (!before) {
    return { error: "Match not found." };
  }

  const winnerSide = getWinner(score);
  const winnerId = winnerSide === "playerOne" ? before.player_one_id : before.player_two_id;

  const { error } = await admin
    .from("matches")
    .update({
      player_one_score: score.playerOne,
      player_two_score: score.playerTwo,
      winner_id: winnerId,
      status: "corrected"
    })
    .eq("id", before.id);

  if (error) {
    return { error: error.message };
  }

  await admin.from("admin_audit_log").insert({
    admin_id: profile.id,
    action: "edit_match_score",
    target_table: "matches",
    target_id: before.id,
    before_data: before,
    after_data: {
      player_one_score: score.playerOne,
      player_two_score: score.playerTwo,
      winner_id: winnerId,
      status: "corrected"
    }
  });

  await recalculateAllStats(profile.id);
  revalidatePath("/admin");
  revalidatePath("/rankings");
  return { success: "Match updated." };
}

export async function adminVoidMatchAction(formData: FormData) {
  const profile = await getCurrentProfile();
  const admin = createSupabaseAdminClient();
  const matchId = String(formData.get("matchId") ?? "");

  if (!profile?.is_admin || !admin) {
    return { error: "Admin access required." };
  }

  const { data: before } = await admin.from("matches").select("*").eq("id", matchId).single();
  if (!before) {
    return { error: "Match not found." };
  }

  const { error } = await admin.from("matches").update({ status: "voided" }).eq("id", matchId);
  if (error) {
    return { error: error.message };
  }

  await admin.from("admin_audit_log").insert({
    admin_id: profile.id,
    action: "void_match",
    target_table: "matches",
    target_id: matchId,
    before_data: before,
    after_data: { status: "voided" }
  });

  await recalculateAllStats(profile.id);
  revalidatePath("/admin");
  revalidatePath("/rankings");
  return { success: "Match voided." };
}

export async function adminSendPasswordResetAction(formData: FormData) {
  const profile = await getCurrentProfile();
  const admin = createSupabaseAdminClient();
  const email = String(formData.get("email") ?? "");

  if (!profile?.is_admin || !admin) {
    return { error: "Admin access required." };
  }

  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/reset-password`
    }
  });

  if (error) {
    return { error: error.message };
  }

  await admin.from("admin_audit_log").insert({
    admin_id: profile.id,
    action: "send_password_reset",
    target_table: "auth.users",
    target_id: null,
    before_data: null,
    after_data: { email }
  });

  return { success: data.properties?.action_link ?? "Password reset link generated." };
}
