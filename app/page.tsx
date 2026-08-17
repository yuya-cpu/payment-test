import { Form } from "@/components/form";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-8 px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">決済</h1>
      <Form />
    </main>
  );
}
