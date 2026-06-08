export const metadata = {
  title: "プライバシーポリシー | Dear 美容整体",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <article className="max-w-2xl mx-auto bg-white rounded-lg border border-gray-200 p-6 sm:p-8 prose-sm">
        <h1 className="text-xl font-bold text-brand-700 mb-2">
          プライバシーポリシー
        </h1>
        <p className="text-sm text-gray-500 mb-6">Dear 美容整体</p>

        <Section title="1. 取得する情報">
          当院は、問診票を通じて、お名前・連絡先・身体やお悩みに関する情報・健康状態など、
          施術に必要な範囲で個人情報を取得します。
        </Section>
        <Section title="2. 利用目的">
          取得した情報は、カウンセリング・施術プランの作成・施術の提供・連絡・
          サービス向上のために利用します。これらの目的以外には利用しません。
        </Section>
        <Section title="3. 第三者提供">
          法令に基づく場合を除き、ご本人の同意なく個人情報を第三者へ提供することはありません。
        </Section>
        <Section title="4. 安全管理">
          取得した情報は適切に管理し、漏洩・滅失・毀損の防止に努めます。
        </Section>
        <Section title="5. 開示・訂正・削除">
          ご本人からの求めに応じ、個人情報の開示・訂正・削除に対応します。
          店舗までお問い合わせください。
        </Section>
        <Section title="6. お問い合わせ">
          本ポリシーに関するお問い合わせは、店舗のLINEまたはお電話までご連絡ください。
        </Section>

        <p className="text-xs text-gray-400 mt-8">
          ※本ポリシーはテンプレートです。実際の運用に合わせて内容を調整してください。
        </p>
      </article>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5">
      <h2 className="text-sm font-bold text-gray-900 mb-1">{title}</h2>
      <p className="text-sm text-gray-600 leading-relaxed">{children}</p>
    </section>
  );
}
