import { listRecentOrders, statusLabel } from "@/lib/orders";

export const dynamic = "force-dynamic";

const errorMessages: Record<string, string> = {
  not_paid: "支払い済みの注文のみ返金できます",
  not_found: "注文が見つかりません",
  failed: "返金に失敗しました",
};

export default async function RefundPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; done?: string }>;
}) {
  const { error, done } = await searchParams;
  let orders: Awaited<ReturnType<typeof listRecentOrders>> = [];
  try {
    orders = await listRecentOrders(20);
  } catch {
    orders = [];
  }

  const refundable = orders.filter((order) => order.status === "paid");
  const others = orders.filter((order) => order.status !== "paid");

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-8 px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">返金</h1>

      {done ? (
        <p className="text-sm text-green-700">返金しました。</p>
      ) : null}
      {error ? (
        <p className="text-sm text-red-700">
          {errorMessages[error] ?? "返金に失敗しました"}
        </p>
      ) : null}

      <section>
        <h2 className="text-sm font-medium text-zinc-500">返金できる支払い</h2>
        {refundable.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">返金できる支払いはありません。</p>
        ) : (
          <ul className="mt-3 divide-y divide-zinc-200 rounded-xl border border-zinc-200">
            {refundable.map((order) => (
              <li
                key={order.id}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <div className="text-sm">
                  <p>{order.amount.toLocaleString()}円</p>
                  <p className="text-zinc-500">{statusLabel(order.status)}</p>
                </div>
                <form action={`/api/orders/${order.id}/refund`} method="POST">
                  <button
                    type="submit"
                    className="rounded-md bg-red-700 px-3 py-1.5 text-sm text-white"
                  >
                    全額返金
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      {others.length > 0 ? (
        <section>
          <h2 className="text-sm font-medium text-zinc-500">その他</h2>
          <ul className="mt-3 divide-y divide-zinc-200 rounded-xl border border-zinc-200">
            {others.map((order) => (
              <li
                key={order.id}
                className="flex items-center justify-between px-4 py-3 text-sm"
              >
                <span>{order.amount.toLocaleString()}円</span>
                <span className="text-zinc-500">{statusLabel(order.status)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
