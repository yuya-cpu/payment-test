"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { menuItems, type MenuId } from "@/lib/menu";

export function MenuForm() {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<MenuId[]>([]);
  const [error, setError] = useState<string | null>(null);

  const total = useMemo(
    () =>
      selectedIds.reduce((sum, id) => {
        const item = menuItems.find((menuItem) => menuItem.id === id);
        return sum + (item?.amount ?? 0);
      }, 0),
    [selectedIds],
  );

  function toggleMenuId(id: MenuId) {
    setError(null);
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((menuId) => menuId !== id)
        : [...current, id],
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (selectedIds.length === 0) {
          setError("1つ以上選択してください");
          return;
        }
        router.push(`/embedd?menu_ids=${selectedIds.join(",")}`);
      }}
    >
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">メニュー</legend>
        {menuItems.map((item) => (
          <label
            key={item.id}
            className="flex cursor-pointer items-center justify-between rounded-md border border-zinc-300 px-3 py-2 has-[:checked]:border-zinc-900 has-[:checked]:bg-zinc-50"
          >
            <span className="flex items-center gap-3">
              <input
                type="checkbox"
                name="menu_ids"
                value={item.id}
                checked={selectedIds.includes(item.id)}
                onChange={() => toggleMenuId(item.id)}
                className="size-4"
              />
              <span>{item.name}</span>
            </span>
            <span className="text-sm text-zinc-600">
              {item.amount.toLocaleString()}円
            </span>
          </label>
        ))}
      </fieldset>

      {selectedIds.length > 0 ? (
        <p className="text-sm text-zinc-600">
          合計: {total.toLocaleString()}円
        </p>
      ) : null}

      <button
        type="submit"
        className="w-full rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white"
      >
        支払いへ進む
      </button>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </form>
  );
}
