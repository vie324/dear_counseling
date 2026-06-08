"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaff } from "@/lib/auth";
import { generateCounselingSummary } from "@/lib/ai/summary";
import type { AiSummary, CounselingRow, ResponseStatus } from "@/lib/db-types";

export async function setStatus(
  id: string,
  status: ResponseStatus
): Promise<{ ok: boolean; error?: string }> {
  const current = await getCurrentStaff();
  if (!current?.staff?.is_active) return { ok: false, error: "権限がありません" };

  const supabase = await createClient();
  const patch: Record<string, unknown> = { status };
  if (status === "reviewed" || status === "completed") {
    patch.reviewed_at = new Date().toISOString();
    patch.reviewed_by = current.staff.name || current.email;
  }

  const { error } = await supabase
    .from("counseling_responses")
    .update(patch)
    .eq("id", id);

  if (error) {
    console.error("setStatus failed:", error);
    return { ok: false, error: "更新に失敗しました" };
  }

  revalidatePath(`/admin/${id}`);
  revalidatePath("/admin");
  return { ok: true };
}

export async function generateSummaryAction(
  id: string
): Promise<{ summary: AiSummary | null; error?: string }> {
  const current = await getCurrentStaff();
  if (!current?.staff?.is_active) return { summary: null, error: "権限がありません" };

  if (!process.env.ANTHROPIC_API_KEY) {
    return { summary: null, error: "ANTHROPIC_API_KEY が未設定です" };
  }

  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from("counseling_responses")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !row) {
    return { summary: null, error: "問診データが見つかりません" };
  }

  const summary = await generateCounselingSummary(row as CounselingRow);
  if (!summary) {
    return { summary: null, error: "サマリー生成に失敗しました" };
  }

  await admin
    .from("counseling_responses")
    .update({
      ai_summary: summary,
      ai_summary_generated_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath(`/admin/${id}`);
  return { summary };
}
