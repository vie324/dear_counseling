export default function ThanksPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-brand-50 to-white px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 mx-auto bg-brand-100 rounded-full flex items-center justify-center mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#C2185B"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-brand-700">送信完了</h1>
        <p className="text-sm text-gray-600 mt-4 leading-relaxed">
          問診票のご回答ありがとうございました。<br />
          ご来店日に施術担当者がお迎えいたします。
        </p>
        <p className="text-xs text-gray-500 mt-6">
          ご質問・予約変更は店舗までLINEもしくはお電話でご連絡ください。
        </p>
      </div>
    </main>
  );
}
