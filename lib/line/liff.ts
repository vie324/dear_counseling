/**
 * LIFF（LINE Front-end Framework）クライアント側初期化。
 * リッチメニュー → カウンセリングボタンで LIFF アプリとして開かれた場合に
 * お客様の LINE プロフィール（userId / 表示名）を取得する。
 *
 * NEXT_PUBLIC_LIFF_ID が未設定、または LIFF コンテキスト外（通常のブラウザ）では
 * null を返し、フォームは通常のWebフォームとして動作する。
 */
"use client";

export interface LiffProfile {
  lineUserId: string;
  displayName: string | null;
}

export async function initLiff(): Promise<LiffProfile | null> {
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
  if (!liffId) return null;

  try {
    // SSR を避けるため動的 import
    const liff = (await import("@line/liff")).default;
    await liff.init({ liffId });

    if (!liff.isLoggedIn()) {
      // LIFF ブラウザ内なら自動でログインへ。外部ブラウザでも login() でLINEログインに飛ばせる。
      liff.login();
      return null;
    }

    const profile = await liff.getProfile();
    return {
      lineUserId: profile.userId,
      displayName: profile.displayName ?? null,
    };
  } catch (err) {
    console.error("[LIFF] init failed:", err);
    return null;
  }
}
