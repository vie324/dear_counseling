"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Sparkles, RefreshCw, AlertTriangle } from "lucide-react";
import { generateSummaryAction } from "@/app/admin/[id]/actions";
import type { AiSummary } from "@/lib/db-types";
import { cn } from "@/lib/utils";

interface Props {
  responseId: string;
  initialSummary: AiSummary | null;
  generatedAt: string | null;
  aiConfigured: boolean;
}

export function SummaryCard({
  responseId,
  initialSummary,
  generatedAt,
  aiConfigured,
}: Props) {
  const [summary, setSummary] = useState<AiSummary | null>(initialSummary);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const triggered = useRef(false);

  const run = () => {
    setError(null);
    startTransition(async () => {
      const res = await generateSummaryAction(responseId);
      if (res.summary) setSummary(res.summary);
      if (res.error) setError(res.error);
    });
  };

  // サマリー未生成 & AI設定あり → 初回表示で自動生成
  useEffect(() => {
    if (!summary && aiConfigured && !triggered.current) {
      triggered.current = true;
      run();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="rounded-xl border border-brand-200 bg-gradient-to-br from-brand-50 to-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="flex items-center gap-2 font-bold text-brand-700">
          <Sparkles size={18} /> AI 事前サマリー
        </h2>
        {(summary || aiConfigured) && (
          <button
            onClick={run}
            disabled={isPending || !aiConfigured}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-brand-700 disabled:opacity-50"
          >
            <RefreshCw size={13} className={cn(isPending && "animate-spin")} />
            {summary ? "再生成" : "生成"}
          </button>
        )}
      </div>

      {!aiConfigured && !summary && (
        <p className="text-sm text-gray-500">
          AI サマリーは未設定です（<code>ANTHROPIC_API_KEY</code> を設定すると自動生成されます）。
        </p>
      )}

      {isPending && !summary && (
        <p className="text-sm text-gray-500 animate-pulse">サマリーを生成中です…</p>
      )}

      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <AlertTriangle size={14} /> {error}
        </p>
      )}

      {summary && (
        <div className="space-y-4">
          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
            {summary.summary}
          </p>

          {summary.recommended_treatments?.length > 0 && (
            <ChipGroup
              label="おすすめ施術"
              items={summary.recommended_treatments}
              tone="brand"
            />
          )}
          {summary.priority_areas?.length > 0 && (
            <ChipGroup
              label="優先アプローチ"
              items={summary.priority_areas}
              tone="blue"
            />
          )}
          {summary.contraindications?.length > 0 && (
            <ChipGroup
              label="禁忌・注意"
              items={summary.contraindications}
              tone="red"
            />
          )}

          <div className="flex items-center justify-between pt-1">
            <ConfidenceBar value={summary.confidence} />
            {generatedAt && (
              <span className="text-[11px] text-gray-400">
                生成: {new Date(generatedAt).toLocaleString("ja-JP")}
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-400">
            ※AIによる参考情報です。最終判断は施術者が行ってください。
          </p>
        </div>
      )}
    </section>
  );
}

function ChipGroup({
  label,
  items,
  tone,
}: {
  label: string;
  items: string[];
  tone: "brand" | "red" | "blue";
}) {
  const toneClass = {
    brand: "bg-brand-100 text-brand-800 border-brand-200",
    red: "bg-red-100 text-red-800 border-red-200",
    blue: "bg-blue-100 text-blue-800 border-blue-200",
  }[tone];
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((it, i) => (
          <span
            key={i}
            className={cn("px-2.5 py-1 rounded-full text-xs border", toneClass)}
          >
            {it}
          </span>
        ))}
      </div>
    </div>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round((value ?? 0) * 100);
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-gray-400">確信度</span>
      <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-brand-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] text-gray-400">{pct}%</span>
    </div>
  );
}
