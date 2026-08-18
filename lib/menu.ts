export const menuItems = [
  { id: "coffee", name: "ハンバーガー", amount: 500 },
  { id: "latte", name: "チーズバーガー", amount: 600 },
  { id: "lunch", name: "セット", amount: 1200 },
] as const;

export type MenuItem = (typeof menuItems)[number];
export type MenuId = MenuItem["id"];

export function getMenuItem(id: string | null | undefined): MenuItem | null {
  if (!id) return null;
  return menuItems.find((item) => item.id === id) ?? null;
}

export function parseMenuIds(value: string | string[] | null | undefined): MenuId[] {
  const raw = Array.isArray(value) ? value : value ? value.split(",") : [];
  const ids = raw.map((id) => id.trim()).filter(Boolean);
  const valid = ids
    .map((id) => getMenuItem(id))
    .filter((item): item is MenuItem => item != null)
    .map((item) => item.id);
  return [...new Set(valid)];
}

export function resolveOrder(menuIds: string[]) {
  const items = parseMenuIds(menuIds);
  if (items.length === 0) return null;

  const selected = items
    .map((id) => getMenuItem(id))
    .filter((item): item is MenuItem => item != null);

  return {
    items: selected,
    amount: selected.reduce((sum, item) => sum + item.amount, 0),
    label: selected.map((item) => item.name).join("、"),
    menuIds: selected.map((item) => item.id),
  };
}
