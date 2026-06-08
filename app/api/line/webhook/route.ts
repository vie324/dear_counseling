import { NextRequest, NextResponse } from "next/server";
import { verifyLineSignature } from "@/lib/line/client";

/**
 * LINE Messaging API Webhook エンドポイント。
 * LINE Developers コンソールの Webhook URL に
 *   https://<your-app>/api/line/webhook
 * を設定してください。
 *
 * 署名を検証し、follow / message などのイベントを受け取る。
 * （リッチメニューのカウンセリングボタンは LIFF URI アクションで開く想定のため、
 *  ここでは最小限の受信のみ。必要に応じて応答やDB連携を追加してください）
 */
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-line-signature");

  if (!verifyLineSignature(body, signature)) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  try {
    const payload = JSON.parse(body);
    const events: Array<{ type: string; source?: { userId?: string } }> =
      payload.events ?? [];
    for (const event of events) {
      // 例: 友だち追加時に userId をログ（必要なら customers へ保存する拡張ポイント）
      if (event.type === "follow") {
        console.log("[LINE webhook] follow:", event.source?.userId);
      }
    }
  } catch (err) {
    console.error("[LINE webhook] parse error:", err);
  }

  // LINE には常に 200 を返す
  return NextResponse.json({ ok: true });
}

// LINE の Webhook 検証（接続確認）で GET が来ることがあるため 200 を返す
export async function GET() {
  return NextResponse.json({ ok: true });
}
