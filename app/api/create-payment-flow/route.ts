import { NextResponse } from "next/server";
import { createPaymentFlow } from "@payjp/payjpv2";
import { createOrder, savePaymentFlowId } from "@/lib/orders";
import { getPayjpClient, getPayjpPublicKey } from "@/lib/payjp";
function parseAmount(value: unknown) {
  const amount = Number(value ?? 1000);
  if (!Number.isInteger(amount) || amount < 50 || amount > 1_000_000) {
    return null;
  }
  return amount;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const amount = parseAmount(body?.amount);
  if (amount == null) {
    return NextResponse.json(
      { error: "金額は 50〜1,000,000 円の整数で指定してください" },
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
      payment_method_types: ["card"],
      metadata: { order_id: order.id },
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
