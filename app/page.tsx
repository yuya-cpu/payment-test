import { MenuForm } from "@/components/menu-form";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-8 px-6 py-16">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">メニュー</h1>
        <p className="mt-2 text-sm text-zinc-600">
          商品を選んでからカード決済に進みます。
        </p>
      </div>
      <MenuForm />
    </main>
  );
}
