import { EmbeddedForm } from "@/components/embedd-form";
import { resolveOrder } from "@/lib/menu";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function EmbeddedPage({
  searchParams,
}: {
  searchParams: Promise<{ menu_ids?: string | string[] }>;
}) {
  const { menu_ids: menuIdsParam } = await searchParams;
  const order = resolveOrder(
    Array.isArray(menuIdsParam)
      ? menuIdsParam
      : menuIdsParam
        ? menuIdsParam.split(",")
        : [],
  );
  if (!order) redirect("/");

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-8 px-6 py-16">
      <div>
        <Link href="/" className="text-sm text-zinc-500 underline">
          メニューに戻る
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">お支払い</h1>
        <ul className="mt-3 space-y-1 text-sm text-zinc-600">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-4">
              <span>{item.name}</span>
              <span>{item.amount.toLocaleString()}円</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm font-medium">
          合計 {order.amount.toLocaleString()}円
        </p>
      </div>
      <EmbeddedForm menuIds={order.menuIds} />
    </main>
  );
}
