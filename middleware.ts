import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // スタッフ管理画面・ログインのみセッション更新（公開フォームには影響させない）
  matcher: ["/admin/:path*", "/login"],
};
