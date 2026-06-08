import Link from "next/link";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { display, formatDateTime } from "@/lib/format";
import type { ResponseStatus } from "@/lib/db-types";

export const dynamic = "force-dynamic";

const STATUS_TABS: { value: ResponseStatus | "all"; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: "submitted", label: "未確認" },
  { value: "reviewed", label: "確認済" },
  { value: "completed", label: "施術完了" },
  { value: "archived", label: "アーカイブ" },
];

const STATUS_BADGE: Record<ResponseStatus, string> = {
  submitted: "bg-amber-100 text-amber-800",
  reviewed: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  archived: "bg-gray-100 text-gray-500",
};

const STATUS_LABEL: Record<ResponseStatus, string> = {
  submitted: "未確認",
  reviewed: "確認済",
  completed: "施術完了",
  archived: "アーカイブ",
};

interface ListRow {
  id: string;
  name: string;
  name_kana: string | null;
  chief_complaint: string;
  visit_purpose: string | null;
  status: ResponseStatus;
  is_high_risk: boolean;
  high_risk_reasons: string[] | null;
  submitted_at: string;
}

export default async function AdminListPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("counseling_responses")
    .select(
      "id, name, name_kana, chief_complaint, visit_purpose, status, is_high_risk, high_risk_reasons, submitted_at"
    )
    .order("submitted_at", { ascending: false })
    .limit(100);

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  const rows = (data as ListRow[] | null) ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">問診一覧</h1>
        <span className="text-sm text-gray-400">{rows.length} 件</span>
      </div>

      {/* ステータスタブ */}
      <div className="flex flex-wrap gap-2 mb-5">
        {STATUS_TABS.map((t) => {
          const isActive = (status ?? "all") === t.value;
          const href = t.value === "all" ? "/admin" : `/admin?status=${t.value}`;
          return (
            <Link
              key={t.value}
              href={href}
              className={
                "px-3 py-1.5 rounded-full text-sm border " +
                (isActive
                  ? "bg-brand-700 text-white border-brand-700"
                  : "bg-white text-gray-600 border-gray-200 hover:border-brand-300")
              }
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
          データの取得に失敗しました。RLS とスタッフ登録をご確認ください。
        </p>
      )}

      {rows.length === 0 && !error && (
        <p className="text-sm text-gray-400 py-12 text-center">
          該当する問診票はまだありません。
        </p>
      )}

      <div className="space-y-2">
        {rows.map((r) => (
          <Link
            key={r.id}
            href={`/admin/${r.id}`}
            className={
              "block rounded-lg border bg-white p-4 hover:shadow-sm transition-shadow " +
              (r.is_high_risk ? "border-red-300" : "border-gray-200")
            }
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-900">{r.name}</span>
                  {r.name_kana && (
                    <span className="text-xs text-gray-400">{r.name_kana}</span>
                  )}
                  <span
                    className={
                      "px-2 py-0.5 rounded-full text-[11px] " +
                      STATUS_BADGE[r.status]
                    }
                  >
                    {STATUS_LABEL[r.status]}
                  </span>
                  {r.is_high_risk && (
                    <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] bg-red-100 text-red-700">
                      <AlertTriangle size={11} /> 要確認
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                  {r.chief_complaint}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {display.visitPurpose(r.visit_purpose)} ・{" "}
                  {formatDateTime(r.submitted_at)}
                </p>
              </div>
              <ChevronRight size={18} className="text-gray-300 shrink-0 mt-1" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
