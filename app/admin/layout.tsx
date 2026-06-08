import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import { logout } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isSupabaseConfigured()) {
    return (
      <CenteredCard title="セットアップが必要です">
        <p className="text-sm text-gray-600">
          Supabase の環境変数が未設定です。<code>.env.local</code> に
          <code>NEXT_PUBLIC_SUPABASE_URL</code> /{" "}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> /{" "}
          <code>SUPABASE_SERVICE_ROLE_KEY</code> を設定してください。
        </p>
      </CenteredCard>
    );
  }

  const current = await getCurrentStaff();
  if (!current) redirect("/login");

  // 認証済みだがスタッフ未登録 / 無効
  if (!current.staff?.is_active) {
    return (
      <CenteredCard title="スタッフ登録が必要です">
        <p className="text-sm text-gray-600">
          ログインは成功しましたが、このアカウントはスタッフとして登録されていません。
          Supabase の <code>staff</code> テーブルに以下を登録してください。
        </p>
        <pre className="mt-3 text-xs bg-gray-900 text-gray-100 rounded p-3 overflow-x-auto">
{`insert into staff (auth_user_id, email, name, role)
values ('${current.userId}', '${current.email}', 'お名前', 'admin');`}
        </pre>
        <form action={logout} className="mt-4">
          <button className="text-sm text-brand-700 underline">ログアウト</button>
        </form>
      </CenteredCard>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="font-bold text-brand-700">
              Dear 管理
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/admin" className="text-gray-600 hover:text-brand-700">
                問診一覧
              </Link>
              <Link
                href="/admin/invitations"
                className="text-gray-600 hover:text-brand-700"
              >
                招待URL発行
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 hidden sm:inline">
              {current.staff.name || current.email}
            </span>
            <form action={logout}>
              <button className="text-xs text-gray-500 hover:text-red-600">
                ログアウト
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}

function CenteredCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-lg w-full bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h1 className="text-lg font-bold text-gray-900 mb-3">{title}</h1>
        {children}
      </div>
    </main>
  );
}
