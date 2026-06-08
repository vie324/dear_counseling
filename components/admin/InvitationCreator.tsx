"use client";

import { useState, useTransition } from "react";
import { Copy, Check, Link2 } from "lucide-react";
import { createInvitation } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function InvitationCreator() {
  const [customerName, setCustomerName] = useState("");
  const [reservationDate, setReservationDate] = useState("");
  const [result, setResult] = useState<{ url: string; token: string } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    startTransition(async () => {
      const res = await createInvitation({ customerName, reservationDate });
      if (res.error) setError(res.error);
      else if (res.url && res.token)
        setResult({ url: res.url, token: res.token });
    });
  };

  const copy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 max-w-lg">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="cust">お客様のお名前（任意・マッチング用）</Label>
          <Input
            id="cust"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="山田 花子"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="date">ご予約日（任意）</Label>
          <Input
            id="date"
            type="date"
            value={reservationDate}
            onChange={(e) => setReservationDate(e.target.value)}
            className="mt-1"
          />
        </div>
        <Button type="submit" disabled={isPending}>
          <Link2 size={16} className="mr-1" />
          {isPending ? "発行中..." : "招待URLを発行"}
        </Button>
      </form>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {result && (
        <div className="mt-4 p-3 bg-brand-50 border border-brand-200 rounded">
          <p className="text-xs text-gray-500 mb-1">発行されたURL（14日間有効）</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs break-all text-brand-800">
              {result.url}
            </code>
            <button
              onClick={copy}
              className="shrink-0 p-1.5 rounded hover:bg-brand-100 text-brand-700"
              title="コピー"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
          {!result.url.startsWith("http") && (
            <p className="mt-2 text-[11px] text-amber-600">
              ※ NEXT_PUBLIC_APP_URL が未設定のため相対パスです。本番URLを設定してください。
            </p>
          )}
        </div>
      )}
    </div>
  );
}
