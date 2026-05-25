import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-brand-50 to-white px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <h1 className="text-2xl font-bold text-brand-700">Dear 美容整体</h1>
        <p className="text-sm text-gray-600 mt-3">問診票システム（デモ版）</p>

        <div className="mt-8 space-y-3">
          <Link
            href="/form/demo"
            className="block w-full bg-brand-700 text-white font-medium py-3 rounded-md hover:bg-brand-800 transition-colors"
          >
            問診票を開く
          </Link>
          <p className="text-xs text-gray-500">
            ※デモ版です。実際の送信は記録されません
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-400">
            本番版では店舗から個別URLが発行されます
          </p>
        </div>
      </div>
    </main>
  );
}
