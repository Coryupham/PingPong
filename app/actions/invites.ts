"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentProfile } from "@/lib/data";
import { createSupabaseServerClient } from "@/lib/supabase";

const inviteSchema = z.object({
  opponentId: z.string().uuid(),
  message: z.string().max(240).optional()
});

export async function createInviteAction(formData: FormData) {
  const profile = await getCurrentProfile();
  const supabase = await createSupabaseServerClient();
  const parsed = inviteSchema.safeParse({
    opponentId: formData.get("opponentId"),
    message: String(formData.get("message") ?? "")
  });

  if (!profile || !supabase) {
    return { error: "Sign in and configure Supabase before sending invites." };
  }

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid invite." };
  }

  if (parsed.data.opponentId === profile.id) {
    return { error: "Choose another player." };
  }

  const { error } = await supabase.from("game_invites").insert({
    challenger_id: profile.id,
    opponent_id: parsed.data.opponentId,
    message: parsed.data.message,
    status: "pending"
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/invites");
  return { success: "Invite sent." };
}

export async function updateInviteAction(formData: FormData) {
  const profile = await getCurrentProfile();
  const supabase = await createSupabaseServerClient();
  const id = String(formData.get("inviteId") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!profile || !supabase) {
    return { error: "Sign in first." };
  }

  if (!["accepted", "declined", "canceled"].includes(status)) {
    return { error: "Unsupported invite status." };
  }

  const { error } = await supabase
    .from("game_invites")
    .update({ status: status as "accepted" | "declined" | "canceled", accepted_at: status === "accepted" ? new Date().toISOString() : null })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/invites");
  return { success: "Invite updated." };
}
