"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase";

export async function signUpAction(formData: FormData) {
  void formData;
  return { error: "Player self-signup is disabled. Ask the league admin to add you to the roster." };
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

  const {
    data: { user }
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user?.id ?? "").single();

  if (!profile?.is_admin) {
    await supabase.auth.signOut();
    return { error: "Only league admins can log in." };
  }

  redirect("/admin");
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
