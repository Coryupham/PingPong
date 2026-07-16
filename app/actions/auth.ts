"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase";

const signUpSchema = z.object({
  displayName: z.string().trim().min(2, "Display name is required."),
  email: z.string().email("Enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  pin: z.string().regex(/^\d{4,8}$/, "PIN must be 4 to 8 digits.")
});

export async function signUpAction(formData: FormData) {
  const parsed = signUpSchema.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    password: formData.get("password"),
    pin: formData.get("pin")
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Could not sign up." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { error: "Supabase is not configured yet. Add environment variables to create accounts." };
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return { error: "Supabase service role key is not configured. Add it before creating profiles." };
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: {
      display_name: parsed.data.displayName
    }
  });

  if (error || !data.user) {
    return { error: error?.message ?? "Could not create account." };
  }

  const pinHash = await bcrypt.hash(parsed.data.pin, 12);
  const { error: profileError } = await admin.from("profiles").upsert({
    id: data.user.id,
    display_name: parsed.data.displayName,
    email: parsed.data.email,
    pin_hash: pinHash
  });

  if (profileError) {
    return { error: profileError.message };
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password
  });

  if (signInError) {
    return { error: signInError.message };
  }

  redirect("/rankings");
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { error: "Supabase is not configured yet." };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect("/game");
}

export async function logoutAction() {
  const supabase = await createSupabaseServerClient();

  if (supabase) {
    await supabase.auth.signOut();
  }

  redirect("/login");
}

export async function resetPasswordAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const supabase = await createSupabaseServerClient();
  const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/reset-password`;

  if (!supabase) {
    return { error: "Supabase is not configured yet." };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

  if (error) {
    return { error: error.message };
  }

  return { success: "Password reset email sent." };
}
