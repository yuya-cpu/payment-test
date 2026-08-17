import Link from "next/link";

export default function SuccessPage() {
  return (
    <main className="mx-auto max-w-lg px-6 py-16">
      <h1 className="text-xl font-semibold">決済が完了しました</h1>
      <p className="mt-2 text-sm text-zinc-600">ご利用ありがとうございました。</p>
      <Link href="/" className="mt-6 inline-block text-sm underline">
        トップへ
      </Link>
    </main>
  );
}
