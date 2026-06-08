/**
 * ログイン中のスタッフを取得するサーバー用ヘルパー。
 * RLS の self_read_staff ポリシーで自分の staff 行を読める前提。
 */
import { createClient } from "@/lib/supabase/server";

export interface StaffRecord {
  id: string;
  auth_user_id: string;
  email: string;
  name: string | null;
  role: "admin" | "staff";
  is_active: boolean;
}

export async function getCurrentStaff(): Promise<{
  userId: string;
  email: string;
  staff: StaffRecord | null;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: staff } = await supabase
    .from("staff")
    .select("id, auth_user_id, email, name, role, is_active")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  return {
    userId: user.id,
    email: user.email ?? "",
    staff: (staff as StaffRecord | null) ?? null,
  };
}
