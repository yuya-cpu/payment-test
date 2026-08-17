import Link from "next/link";

export default function CancelPage() {
  return (
    <main className="mx-auto max-w-lg px-6 py-16">
      <h1 className="text-xl font-semibold">決済をキャンセルしました</h1>
      <Link href="/" className="mt-6 inline-block text-sm underline">
        戻る
      </Link>
    </main>
  );
}
