"use client";

import { useMemo } from "react";
import {
  BODY_PARTS,
  getPartsForView,
  type BodyView,
} from "@/lib/body-parts";
import { flattenConcerns } from "@/lib/format";
import type { CounselingRow } from "@/lib/db-types";

interface Props {
  concerns: CounselingRow["concerns"];
  gender?: string | null;
}

/** スタッフ管理画面用：選択されたお悩み箇所を人体図でハイライト表示（読み取り専用） */
export function BodyMapReadonly({ concerns, gender }: Props) {
  const partSelectedCount = useMemo(() => {
    const map: Record<string, number> = {};
    for (const part of BODY_PARTS) {
      const cat = concerns?.[part.category] || [];
      map[part.id] = part.options.filter((opt) => cat.includes(opt)).length;
    }
    return map;
  }, [concerns]);

  const groups = flattenConcerns(concerns);
  const totalSelected = groups.reduce((n, g) => n + g.items.length, 0);

  if (totalSelected === 0) {
    return <p className="text-sm text-gray-400">お悩み箇所の入力はありません</p>;
  }

  return (
    <div className="grid sm:grid-cols-2 gap-6">
      {/* 人体図（正面・背面） */}
      <div className="flex justify-center gap-2">
        <BodySvg view="front" gender={gender} counts={partSelectedCount} />
        <BodySvg view="back" gender={gender} counts={partSelectedCount} />
      </div>

      {/* お悩み一覧（カテゴリ別チップ） */}
      <div className="space-y-3">
        {groups.map((g) => (
          <div key={g.category}>
            <p className="text-xs font-medium text-brand-700 mb-1">{g.category}</p>
            <div className="flex flex-wrap gap-1.5">
              {g.items.map((it) => (
                <span
                  key={it}
                  className="px-2 py-0.5 rounded-full text-xs bg-brand-50 text-brand-800 border border-brand-200"
                >
                  {it}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BodySvg({
  view,
  gender,
  counts,
}: {
  view: BodyView;
  gender?: string | null;
  counts: Record<string, number>;
}) {
  const parts = getPartsForView(view, gender ?? undefined);
  return (
    <div className="text-center">
      <svg viewBox="0 0 200 420" className="w-24 h-auto" aria-label={`${view}図`}>
        {parts.map((part) => {
          const path = view === "front" ? part.pathFront : part.pathBack;
          if (!path) return null;
          const active = (counts[part.id] || 0) > 0;
          return (
            <path
              key={part.id}
              d={path}
              fill={active ? "#C2185B" : "#E0E0E0"}
              fillOpacity={active ? 0.85 : 1}
              stroke={active ? "#880E4F" : "#BDBDBD"}
              strokeWidth={active ? 1.2 : 0.6}
            />
          );
        })}
      </svg>
      <p className="text-[11px] text-gray-400 mt-1">
        {view === "front" ? "正面" : "背面"}
      </p>
    </div>
  );
}
