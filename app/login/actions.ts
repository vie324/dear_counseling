"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/admin";

export async function login(
  email: string,
  password: string
): Promise<{ error: string } | void> {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase が未設定です（.env.local を設定してください）" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "メールアドレスまたはパスワードが正しくありません" };
  }

  redirect("/admin");
}
