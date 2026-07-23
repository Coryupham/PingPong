"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase";

const playerSignupSchema = z.object({
  displayName: z.string().trim().min(2, "Display name is required."),
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
  pin: z.string().regex(/^\d{4,8}$/, "PIN must be 4 to 8 digits.")
});

export async function playerSignupAction(formData: FormData) {
  const admin = createSupabaseAdminClient();

  if (!admin) {
    return { error: "Supabase is not configured yet." };
  }

  const parsed = playerSignupSchema.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("playerEmail") ?? formData.get("email"),
    pin: formData.get("playerPin") ?? formData.get("pin")
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid signup." };
  }

  const pinHash = await bcrypt.hash(parsed.data.pin, 12);
  const { error } = await admin.from("players").insert({
    display_name: parsed.data.displayName,
    email: parsed.data.email,
    pin_hash: pinHash
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "A player with that email already exists." };
    }

    return { error: error.message };
  }

  revalidatePath("/admin");
  revalidatePath("/rankings");
  revalidatePath("/game");

  return { success: "You are on the roster. Use this email and PIN when starting a match." };
}
