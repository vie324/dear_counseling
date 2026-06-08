/**
 * LINE Messaging API（サーバー専用）。
 * - スタッフへの新着問診プッシュ通知
 * - Webhook 署名検証
 *
 * 環境変数が未設定の場合は通知をスキップ（graceful degradation）。
 */
import crypto from "crypto";

const PUSH_ENDPOINT = "https://api.line.me/v2/bot/message/push";

export function isLineConfigured(): boolean {
  return Boolean(
    process.env.LINE_CHANNEL_ACCESS_TOKEN && process.env.LINE_STAFF_NOTIFY_TO
  );
}

/** Webhook の x-line-signature を検証 */
export function verifyLineSignature(body: string, signature: string | null): boolean {
  const secret = process.env.LINE_CHANNEL_SECRET;
  if (!secret || !signature) return false;
  const hash = crypto.createHmac("sha256", secret).update(body).digest("base64");
  try {
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
  } catch {
    return false;
  }
}

/** 1人にテキストをプッシュ */
async function pushText(to: string, text: string): Promise<void> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) return;

  const res = await fetch(PUSH_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      to,
      messages: [{ type: "text", text: text.slice(0, 4900) }],
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`LINE push failed (${res.status}): ${detail}`);
  }
}

/** 通知先（カンマ区切り）全員にプッシュ。失敗してもエラーは投げず握りつぶす（通知はベストエフォート） */
export async function notifyStaff(text: string): Promise<void> {
  if (!isLineConfigured()) return;
  const recipients = (process.env.LINE_STAFF_NOTIFY_TO || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  await Promise.allSettled(recipients.map((to) => pushText(to, text)));
}

/** 新着問診の通知文を組み立てる */
export function buildSubmissionNotification(params: {
  responseId: string;
  name: string;
  chiefComplaint: string;
  visitPurpose: string;
  isHighRisk: boolean;
  highRiskReasons: string[] | null;
}): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const link = appUrl ? `${appUrl}/admin/${params.responseId}` : "";
  const lines = [
    params.isHighRisk ? "⚠️【要確認】新しい問診票が届きました" : "📝 新しい問診票が届きました",
    "",
    `お名前: ${params.name} 様`,
    `来院目的: ${params.visitPurpose}`,
    `主訴: ${params.chiefComplaint}`,
  ];
  if (params.isHighRisk && params.highRiskReasons?.length) {
    lines.push("", `🚩 注意: ${params.highRiskReasons.join(" / ")}`);
  }
  if (link) {
    lines.push("", `詳細はこちら:`, link);
  }
  return lines.join("\n");
}
