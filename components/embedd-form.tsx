"use client";

import { useEffect, useRef, useState } from "react";
import { loadPayments } from "@payjp/payments-js";

type PayjpWidgets = Awaited<
  ReturnType<Awaited<ReturnType<typeof loadPayments>>["widgets"]>
>;

export function EmbeddedForm() {
  const [amount] = useState(1000);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const widgetsRef = useRef<PayjpWidgets | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/create-payment-flow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount }),
        });

        const data = await response.json();
        if (!response.ok) {
          setError(data.error ?? "エラーが発生しました");
          return;
        }

        const publicKey = process.env.NEXT_PUBLIC_PAYJP_PUBLIC_KEY;
        if (!publicKey) {
          setError("公開鍵が設定されていません");
          return;
        }

        const payments = await loadPayments(publicKey);
        const widgets = await payments.widgets({
          clientSecret: data.clientSecret,
          locale: "ja",
        });

        if (cancelled) return;

        widgets.createForm("payment").mount("#payment-form");
        widgetsRef.current = widgets;
        setOrderId(data.orderId);
        setReady(true);
      } catch (err) {
        if (cancelled) return;
        console.error("embedded checkout failed:", err);
        setError(
          err instanceof Error
            ? err.message
            : "決済フォームの表示に失敗しました",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void init();

    return () => {
      cancelled = true;
    };
  }, [amount]);

  async function confirm() {
    const widgets = widgetsRef.current;
    if (!widgets || !orderId) return;

    const result = await widgets.confirmPayment({
      return_url: `${window.location.origin}/embedd/complete?order_id=${orderId}`,
    });

    if (result.error) {
      setError(result.error.message ?? "支払いに失敗しました");
    }
  }

  return (
    <div className="space-y-4">
      {loading ? <p className="text-sm text-zinc-500">読み込み中…</p> : null}

      <div id="payment-form" className={ready ? "" : "hidden"} />

      {ready ? (
        <button
          type="button"
          onClick={confirm}
          className="w-full rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white"
        >
          支払う
        </button>
      ) : null}

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
