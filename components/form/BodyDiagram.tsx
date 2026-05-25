"use client";

import { useState, useMemo } from "react";
import {
  BODY_PARTS,
  getPartsForView,
  getAbstractParts,
  type BodyPart,
  type BodyView,
} from "@/lib/body-parts";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ConcernCategory } from "@/lib/schema";

export interface BodyDiagramProps {
  value: Record<ConcernCategory, string[]>;
  onChange: (next: Record<ConcernCategory, string[]>) => void;
  gender?: string;
}

export function BodyDiagram({ value, onChange, gender }: BodyDiagramProps) {
  const [view, setView] = useState<BodyView>("front");
  const [activePart, setActivePart] = useState<BodyPart | null>(null);

  const visibleParts = useMemo(() => getPartsForView(view, gender), [view, gender]);
  const abstractParts = useMemo(() => getAbstractParts(gender), [gender]);

  // 部位ごとの「選択された数」を計算
  const partSelectedCount = useMemo(() => {
    const map: Record<string, number> = {};
    for (const part of BODY_PARTS) {
      const cat = value[part.category] || [];
      const count = part.options.filter((opt) => cat.includes(opt)).length;
      map[part.id] = count;
    }
    return map;
  }, [value]);

  const togglePartOption = (part: BodyPart, option: string) => {
    const current = value[part.category] || [];
    const next = current.includes(option)
      ? current.filter((o) => o !== option)
      : [...current, option];

    onChange({
      ...value,
      [part.category]: next,
    });
  };

  return (
    <div className="space-y-4">
      {/* 正面 / 背面 切替 */}
      <div className="flex justify-center gap-2">
        <Button
          type="button"
          variant={view === "front" ? "default" : "outline"}
          size="sm"
          onClick={() => setView("front")}
        >
          正面
        </Button>
        <Button
          type="button"
          variant={view === "back" ? "default" : "outline"}
          size="sm"
          onClick={() => setView("back")}
        >
          背面
        </Button>
      </div>

      {/* SVG 本体 */}
      <div className="relative mx-auto max-w-xs">
        <svg
          viewBox="0 0 200 480"
          className="w-full h-auto"
          style={{ touchAction: "manipulation" }}
          aria-label={view === "front" ? "正面の身体図" : "背面の身体図"}
        >
          {/* インタラクティブ部位（すべてシルエットを構成） */}
          {visibleParts.map((part) => {
            const path = view === "front" ? part.pathFront : part.pathBack;
            if (!path) return null;
            const count = partSelectedCount[part.id] || 0;
            return (
              <path
                key={part.id}
                d={path}
                fill={count > 0 ? "#C2185B" : "#E0E0E0"}
                fillOpacity={count > 0 ? 0.85 : 1}
                stroke={count > 0 ? "#880E4F" : "#BDBDBD"}
                strokeWidth={count > 0 ? 1.2 : 0.6}
                className="cursor-pointer transition-all duration-200 hover:opacity-80"
                onClick={() => setActivePart(part)}
              />
            );
          })}

          {/* 顔のディテール（正面のみ、装飾） */}
          {view === "front" && (
            <g fill="#9E9E9E" stroke="none" pointerEvents="none">
              <circle cx="92" cy="28" r="1.6" />
              <circle cx="108" cy="28" r="1.6" />
              <path
                d="M93,40 q7,3 14,0"
                fill="none"
                stroke="#9E9E9E"
                strokeWidth="1"
                strokeLinecap="round"
              />
            </g>
          )}

          {/* 選択数バッジ */}
          {visibleParts.map((part) => {
            const count = partSelectedCount[part.id] || 0;
            if (count === 0) return null;
            const pos =
              view === "front" ? part.labelPos?.front : part.labelPos?.back;
            if (!pos) return null;
            return (
              <g key={`badge-${part.id}`} pointerEvents="none">
                <circle cx={pos.x} cy={pos.y} r="9" fill="white" stroke="#880E4F" strokeWidth="1.5" />
                <text
                  x={pos.x}
                  y={pos.y + 3.5}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#880E4F"
                  fontWeight="bold"
                >
                  {count}
                </text>
              </g>
            );
          })}
        </svg>

        <p className="mt-3 text-center text-xs text-gray-500">
          気になる部位をタップしてください
        </p>
      </div>

      {/* 図に載らないカテゴリ：チップ表示 */}
      {abstractParts.length > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <p className="text-xs text-gray-500 mb-2">その他のお悩み</p>
          <div className="flex flex-wrap gap-2">
            {abstractParts.map((part) => {
              const count = partSelectedCount[part.id] || 0;
              return (
                <button
                  key={part.id}
                  type="button"
                  onClick={() => setActivePart(part)}
                  className={cn(
                    "px-3 py-2 rounded-full text-sm border transition-colors",
                    count > 0
                      ? "bg-brand-700 text-white border-brand-700"
                      : "bg-white text-gray-700 border-gray-300 hover:border-brand-300"
                  )}
                >
                  {part.label}
                  {count > 0 && (
                    <span className="ml-1.5 bg-white text-brand-700 rounded-full px-1.5 py-0.5 text-xs font-bold">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 部位タップ時のボトムシート */}
      <Drawer
        open={!!activePart}
        onOpenChange={(open) => !open && setActivePart(null)}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="text-brand-700">
              {activePart?.label}のお悩み
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 space-y-2 max-h-[60vh] overflow-y-auto">
            {activePart?.options.map((opt) => {
              const checked = (value[activePart.category] || []).includes(opt);
              return (
                <label
                  key={opt}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-colors",
                    checked
                      ? "border-brand-700 bg-brand-50"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => togglePartOption(activePart, opt)}
                  />
                  <span className="text-sm">{opt}</span>
                </label>
              );
            })}
            <Button
              type="button"
              variant="outline"
              className="w-full mt-3"
              onClick={() => setActivePart(null)}
            >
              閉じる
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
