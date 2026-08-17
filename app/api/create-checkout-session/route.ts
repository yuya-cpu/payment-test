import { NextResponse } from "next/server";
import { createCheckoutSession } from "@payjp/payjpv2";
import { getAppUrl } from "@/lib/app-url";
import { createOrder, saveCheckoutSessionId } from "@/lib/orders";
import { getPayjpClient } from "@/lib/payjp";

function parseAmount(value: FormDataEntryValue | null | undefined) {
  const amount = Number(value ?? 1000);
  if (!Number.isInteger(amount) || amount < 50 || amount > 1_000_000) {
    return null;
  }
  return amount;
}

export async function POST(request: Request) {
  const formData = await request.formData().catch(() => null);
  const amount = parseAmount(formData?.get("amount"));
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

  const origin = getAppUrl(request);
  let client;
  try {
    client = getPayjpClient();
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "PAY.JP の設定を確認してください" },
      { status: 500 },
    );
  }
  const { data: session, error } = await createCheckoutSession({
    client,
    body: {
      mode: "payment",
      locale: "ja",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "jpy",
            unit_amount: amount,
            product_data: { name: "テスト商品" },
          },
        },
      ],
      success_url: `${origin}/success?order_id=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/api/orders/canceled?order_id=${order.id}`,
      metadata: { order_id: order.id },
      payment_flow_data: {
        metadata: { order_id: order.id },
      },
    },
  });

  if (error || !session?.url) {
    const detail =
      error instanceof Error
        ? {
            message: error.message,
            cause:
              error.cause instanceof Error
                ? {
                    message: error.cause.message,
                    code: (error.cause as NodeJS.ErrnoException).code,
                  }
                : error.cause,
          }
        : error;

    console.error("PAY.JP checkout error:", detail);
    return NextResponse.json(
      { error: "セッション作成に失敗しました", detail },
      { status: 500 },
    );
  }

  await saveCheckoutSessionId(order.id, session.id);
  return NextResponse.redirect(session.url, 303);
}
