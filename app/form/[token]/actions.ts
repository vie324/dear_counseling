"use server";

import {
  CounselingResponseSchema,
  type CounselingResponse,
  LABELS,
} from "@/lib/schema";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { toDbRow } from "@/lib/response-mapper";
import { buildSubmissionNotification, notifyStaff } from "@/lib/line/client";

export type SubmitResult =
  | { success: true; responseId: string }
  | { success: false; error: string };

interface SubmitMeta {
  lineUserId?: string | null;
  lineDisplayName?: string | null;
}

/**
 * 問診票送信処理。
 *
 * 1. Zod バリデーション
 * 2. Supabase 未設定ならログ出力のみ（デモ動作）
 * 3. 設定済みなら:
 *    - トークンから招待を解決（あれば顧客と紐付け）
 *    - counseling_responses に保存（禁忌フラグは DB トリガーが自動判定）
 *    - 招待を使用済みに
 *    - スタッフへ LINE 通知（ベストエフォート）
 *
 * AI サマリーはスタッフ管理画面の詳細表示時に生成する（送信を遅延させないため）。
 */
export async function submitCounseling(
  token: string,
  raw: CounselingResponse,
  meta: SubmitMeta = {}
): Promise<SubmitResult> {
  const parsed = CounselingResponseSchema.safeParse(raw);
  if (!parsed.success) {
    console.error("Validation failed:", parsed.error.flatten());
    return { success: false, error: "入力内容に不備があります" };
  }
  const data = parsed.data;

  // ---- デモ動作（Supabase 未設定）----
  if (!isSupabaseConfigured()) {
    console.log(
      "[Counseling submission / demo]",
      JSON.stringify(
        {
          token,
          name: data.name,
          chief_complaint: data.chief_complaint,
          visit_purpose: data.visit_purpose,
        },
        null,
        2
      )
    );
    return { success: true, responseId: `demo-${Date.now()}` };
  }

  try {
    const admin = createAdminClient();

    // ---- 招待トークンの解決（存在すれば紐付け）----
    let invitationId: string | null = null;
    let customerId: string | null = null;
    const { data: invitation } = await admin
      .from("counseling_invitations")
      .select("id, customer_id, expires_at")
      .eq("token", token)
      .maybeSingle();

    if (invitation) {
      invitationId = invitation.id;
      customerId = invitation.customer_id;
    }

    // ---- 保存 ----
    const row = toDbRow(data, {
      invitationId,
      customerId,
      lineUserId: meta.lineUserId ?? null,
      lineDisplayName: meta.lineDisplayName ?? null,
    });

    const { data: inserted, error } = await admin
      .from("counseling_responses")
      .insert(row)
      .select(
        "id, name, chief_complaint, visit_purpose, is_high_risk, high_risk_reasons"
      )
      .single();

    if (error || !inserted) {
      console.error("Insert failed:", error);
      return { success: false, error: "保存に失敗しました。時間をおいて再度お試しください。" };
    }

    // ---- 招待を使用済みに ----
    if (invitationId) {
      await admin
        .from("counseling_invitations")
        .update({ used_at: new Date().toISOString() })
        .eq("id", invitationId);
    }

    // ---- スタッフへ通知（ベストエフォート）----
    try {
      const text = buildSubmissionNotification({
        responseId: inserted.id,
        name: inserted.name,
        chiefComplaint: inserted.chief_complaint,
        visitPurpose:
          LABELS.visit_purpose[
            inserted.visit_purpose as keyof typeof LABELS.visit_purpose
          ] ?? inserted.visit_purpose ?? "—",
        isHighRisk: inserted.is_high_risk,
        highRiskReasons: inserted.high_risk_reasons,
      });
      await notifyStaff(text);
    } catch (notifyErr) {
      console.error("Staff notification failed:", notifyErr);
    }

    return { success: true, responseId: inserted.id };
  } catch (err) {
    console.error("submitCounseling error:", err);
    return { success: false, error: "送信中にエラーが発生しました。" };
  }
}
