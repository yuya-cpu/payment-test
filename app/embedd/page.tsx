import { EmbeddedForm } from "@/components/embedd-form";

export default function EmbeddedPage() {
    return (
        <main className="mx-auto max-w-screen-sm py-12">
            <h1 className="text-2xl font-bold">支払いフォーム</h1>
            <EmbeddedForm />
        </main>
    );
}