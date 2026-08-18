import { NextResponse } from "next/server";
import { createPaymentFlow } from "@payjp/payjpv2";
import { resolveOrder } from "@/lib/menu";
import { createOrder, savePaymentFlowId } from "@/lib/orders";
import { getPayjpClient, getPayjpPublicKey } from "@/lib/payjp";

function parseMenuIds(body: unknown): string[] {
  if (!body || typeof body !== "object") return [];
  const value = (body as { menu_ids?: unknown }).menu_ids;
  if (Array.isArray(value)) {
    return value.map(String);
  }
  if (typeof value === "string") {
    return value.split(",");
  }
  return [];
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const orderSummary = resolveOrder(parseMenuIds(body));
  if (!orderSummary) {
    return NextResponse.json(
      { error: "メニューを1つ以上選択してください" },
      { status: 400 },
    );
  }

  const { amount, label, menuIds } = orderSummary;
  if (amount > 1_000_000) {
    return NextResponse.json(
      { error: "合計金額は 1,000,000 円以下にしてください" },
      { status: 400 },
    );
  }

  let order;
  try {
    order = await createOrder(amount);
  } catch (error) {
    console.error("order insert failed:", error);
    return NextResponse.json(
      { error: "注文の作成に失敗しました。データベース接続を確認してください" },
      { status: 500 },
    );
  }

  let client;
  let publicKey;
  try {
    client = getPayjpClient();
    publicKey = getPayjpPublicKey();
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "PAY.JP の設定を確認してください",
      },
      { status: 500 },
    );
  }

  const { data, error } = await createPaymentFlow({
    client,
    body: {
      amount,
      currency: "jpy",
      payment_method_types: ["card", "paypay"],
      description: label,
      metadata: {
        order_id: order.id,
        menu_ids: menuIds.join(","),
      },
    },
  });

  if (error || !data?.client_secret) {
    console.error("payment flow creation failed:", error);
    const detail =
      error && typeof error === "object" && "errors" in error
        ? (error as { errors?: Array<{ message?: string }> }).errors?.[0]
            ?.message
        : undefined;
    return NextResponse.json(
      { error: "Payment Flow の作成に失敗しました", detail },
      { status: 500 },
    );
  }

  await savePaymentFlowId(order.id, data.id);

  return NextResponse.json({
    orderId: order.id,
    clientSecret: data.client_secret,
    publicKey,
  });
}
