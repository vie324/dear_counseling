"use client";

import { useTransition } from "react";
import { setStatus } from "@/app/admin/[id]/actions";
import type { ResponseStatus } from "@/lib/db-types";
import { cn } from "@/lib/utils";

const STATUSES: { value: ResponseStatus; label: string }[] = [
  { value: "submitted", label: "未確認" },
  { value: "reviewed", label: "確認済" },
  { value: "completed", label: "施術完了" },
  { value: "archived", label: "アーカイブ" },
];

export function StatusControl({
  id,
  current,
}: {
  id: string;
  current: ResponseStatus;
}) {
  const [isPending, startTransition] = useTransition();

  const change = (status: ResponseStatus) => {
    if (status === current) return;
    startTransition(async () => {
      await setStatus(id, status);
    });
  };

  return (
    <div className="inline-flex rounded-md border border-gray-200 overflow-hidden text-xs">
      {STATUSES.map((s) => (
        <button
          key={s.value}
          onClick={() => change(s.value)}
          disabled={isPending}
          className={cn(
            "px-3 py-1.5 transition-colors disabled:opacity-60",
            s.value === current
              ? "bg-brand-700 text-white"
              : "bg-white text-gray-600 hover:bg-gray-50"
          )}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
