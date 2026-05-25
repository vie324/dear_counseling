"use server";

import {
  CounselingResponseSchema,
  type CounselingResponse,
} from "@/lib/schema";

export type SubmitResult =
  | { success: true; responseId: string }
  | { success: false; error: string };

/**
 * 【MVP版】問診票送信処理
 *
 * 本番リリース時には Supabase 連携・LINE 通知・AI サマリーが入る予定。
 * 現状はバリデーションのみ実行し、Vercel のログに出力するだけ。
 *
 * Vercel Dashboard → Logs から送信内容を確認できる。
 */
export async function submitCounseling(
  token: string,
  raw: CounselingResponse
): Promise<SubmitResult> {
  // Zod バリデーション
  const parsed = CounselingResponseSchema.safeParse(raw);
  if (!parsed.success) {
    console.error("Validation failed:", parsed.error.flatten());
    return { success: false, error: "入力内容に不備があります" };
  }

  const data = parsed.data;

  // Vercel ログに送信内容を出力（本番では Supabase に保存予定）
  console.log("[Counseling submission]", JSON.stringify({
    token,
    timestamp: new Date().toISOString(),
    name: data.name,
    name_kana: data.name_kana,
    phone: data.phone,
    email: data.email,
    chief_complaint: data.chief_complaint,
    visit_purpose: data.visit_purpose,
    top_concern: data.top_concern,
    concerns_count: Object.values(data.concerns).flat().length,
    desired_treatment: data.desired_treatment,
  }, null, 2));

  return {
    success: true,
    responseId: `mock-${Date.now()}`,
  };
}
