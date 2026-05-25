import { CounselingForm } from "@/components/form/CounselingForm";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ token: string }>;
}

/**
 * 【MVP版】問診票ページ
 *
 * URLのトークン部分は任意の文字列でアクセス可能（例: /form/demo, /form/test123）。
 * 本番リリース時には Supabase でトークン検証・有効期限チェックが入る予定。
 */
export default async function FormPage({ params }: Props) {
  const { token } = await params;

  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        <header className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-700">
            Dear 美容整体
          </h1>
          <p className="text-sm text-gray-600 mt-2">ご来院前 問診票</p>
        </header>

        <CounselingForm token={token} />
      </div>
    </main>
  );
}
