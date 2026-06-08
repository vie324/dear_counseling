"use server";

import crypto from "crypto";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStaff } from "@/lib/auth";

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

function randomToken(len = 12): string {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = crypto.randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += chars[bytes[i] % chars.length];
  return out;
}

export async function createInvitation(input: {
  customerName?: string;
  reservationDate?: string;
}): Promise<{ url?: string; token?: string; error?: string }> {
  const current = await getCurrentStaff();
  if (!current?.staff?.is_active) {
    return { error: "権限がありません" };
  }

  const supabase = await createClient();
  const token = randomToken(12);
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase.from("counseling_invitations").insert({
    token,
    customer_name_hint: input.customerName?.trim() || null,
    reservation_date: input.reservationDate || null,
    expires_at: expiresAt,
    created_by: current.staff.email,
  });

  if (error) {
    console.error("createInvitation failed:", error);
    return { error: "招待URLの発行に失敗しました" };
  }

  const base = process.env.NEXT_PUBLIC_APP_URL || "";
  return { token, url: `${base}/form/${token}` };
}
