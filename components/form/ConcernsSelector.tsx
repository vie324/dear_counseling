"use client";

import { useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { BodyDiagram } from "./BodyDiagram";
import { CONCERN_OPTIONS, LABELS, type ConcernCategory } from "@/lib/schema";
import { cn } from "@/lib/utils";

interface Props {
  gender?: string;
}

export function ConcernsSelector({ gender }: Props) {
  const { control, watch } = useFormContext();
  const [mode, setMode] = useState<"diagram" | "list">("diagram");

  return (
    <Controller
      control={control}
      name="concerns"
      defaultValue={{
        head_neck: [], lower_back: [], legs: [], face: [],
        eyes: [], women: [], systemic: [],
      }}
      render={({ field }) => (
        <Tabs
          value={mode}
          onValueChange={(v) => setMode(v as "diagram" | "list")}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="diagram">身体図から選ぶ</TabsTrigger>
            <TabsTrigger value="list">リストから選ぶ</TabsTrigger>
          </TabsList>

          <TabsContent value="diagram" className="mt-4">
            <BodyDiagram
              value={field.value}
              onChange={field.onChange}
              gender={gender}
            />
          </TabsContent>

          <TabsContent value="list" className="mt-4">
            <ConcernsList
              value={field.value}
              onChange={field.onChange}
              gender={gender}
            />
          </TabsContent>
        </Tabs>
      )}
    />
  );
}

function ConcernsList({
  value,
  onChange,
  gender,
}: {
  value: Record<ConcernCategory, string[]>;
  onChange: (v: Record<ConcernCategory, string[]>) => void;
  gender?: string;
}) {
  const categories = Object.keys(CONCERN_OPTIONS) as ConcernCategory[];

  const toggle = (cat: ConcernCategory, opt: string) => {
    const current = value[cat] || [];
    const next = current.includes(opt)
      ? current.filter((o) => o !== opt)
      : [...current, opt];
    onChange({ ...value, [cat]: next });
  };

  return (
    <div className="space-y-6">
      {categories.map((cat) => {
        // 女性のお悩みは性別フィルタ
        if (cat === "women" && gender !== "female") return null;

        const options = CONCERN_OPTIONS[cat];
        return (
          <div key={cat}>
            <h4 className="font-bold text-brand-700 mb-2">
              {LABELS.concern_category[cat]}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {options.map((opt) => {
                const checked = (value[cat] || []).includes(opt);
                return (
                  <label
                    key={opt}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded border text-sm cursor-pointer",
                      checked
                        ? "border-brand-700 bg-brand-50"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggle(cat, opt)}
                    />
                    <span>{opt}</span>
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
