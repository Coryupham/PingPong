"use server";

import bcrypt from "bcryptjs";
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

const createPlayerSchema = z.object({
  displayName: z.string().trim().min(2, "Display name is required."),
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
  pin: z.string().regex(/^\d{4,8}$/, "PIN must be 4 to 8 digits.")
});

const createAdminSchema = z.object({
  displayName: z.string().trim().min(2, "Display name is required."),
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
  password: z.string().min(8, "Temporary password must be at least 8 characters.")
});

export async function adminCreatePlayerAction(formData: FormData) {
  const profile = await getCurrentProfile();
  const admin = createSupabaseAdminClient();

  if (!profile?.is_admin || !admin) {
    return { error: "Admin access required." };
  }

  const parsed = createPlayerSchema.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    pin: formData.get("pin")
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid player." };
  }

  const pinHash = await bcrypt.hash(parsed.data.pin, 12);
  const { data: player, error } = await admin
    .from("players")
    .insert({
      display_name: parsed.data.displayName,
      email: parsed.data.email,
      pin_hash: pinHash,
      created_by: profile.id
    })
    .select("id, email, display_name")
    .single();

  if (error || !player) {
    return { error: error?.message ?? "Could not create player." };
  }

  await admin.from("admin_audit_log").insert({
    admin_id: profile.id,
    action: "create_player",
    target_table: "players",
    target_id: player.id,
    before_data: null,
    after_data: player
  });

  revalidatePath("/admin");
  revalidatePath("/rankings");
  revalidatePath("/game");
  return { success: "Player added to the league." };
}

export async function adminCreateAdminAction(formData: FormData) {
  const profile = await getCurrentProfile();
  const admin = createSupabaseAdminClient();

  if (!profile?.is_admin || !admin) {
    return { error: "Admin access required." };
  }

  const parsed = createAdminSchema.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    password: formData.get("password")
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid admin." };
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: {
      display_name: parsed.data.displayName
    }
  });

  if (createError || !created.user) {
    return { error: createError?.message ?? "Could not create admin account." };
  }

  const newAdminProfile = {
    id: created.user.id,
    display_name: parsed.data.displayName,
    email: parsed.data.email,
    is_admin: true
  };

  const { error: profileError } = await admin.from("profiles").upsert(newAdminProfile, { onConflict: "id" });

  if (profileError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return { error: profileError.message };
  }

  await admin.from("admin_audit_log").insert({
    admin_id: profile.id,
    action: "create_admin",
    target_table: "auth.users",
    target_id: created.user.id,
    before_data: null,
    after_data: {
      id: created.user.id,
      email: parsed.data.email,
      display_name: parsed.data.displayName,
      is_admin: true
    }
  });

  revalidatePath("/admin");
  return { success: "Admin account created. Share the email and temporary password with them." };
}

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
  const winnerName = winnerSide === "playerOne" ? before.player_one_name : before.player_two_name;
  const winnerEmail = winnerSide === "playerOne" ? before.player_one_email : before.player_two_email;

  const { error } = await admin
    .from("matches")
    .update({
      player_one_score: score.playerOne,
      player_two_score: score.playerTwo,
      winner_id: winnerId,
      winner_name: winnerName,
      winner_email: winnerEmail,
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
      winner_name: winnerName,
      winner_email: winnerEmail,
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
