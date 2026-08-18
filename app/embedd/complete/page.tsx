export default function EmbeddedCompletePage({
    searchParams,
  }: {
    searchParams: Promise<{ order_id?: string }>;
  }) {
    return (
      <main className="mx-auto flex w-full max-w-lg flex-col gap-4 px-6 py-16">
        <h1 className="text-2xl font-semibold">処理を受け付けました</h1>
        
      </main>
    );
  }