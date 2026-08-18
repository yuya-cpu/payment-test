import { desc, eq } from "drizzle-orm";
import {
  createPaymentRefund,
  getCheckoutSession,
  getPaymentFlow,
  getPaymentFlowRefunds,
} from "@payjp/payjpv2";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { getPayjpClient } from "@/lib/payjp";

export const orderStatuses = [
  "open",
  "paid",
  "canceled",
  "expired",
  "failed",
  "refunded",
] as const;

export type OrderStatus = (typeof orderStatuses)[number];
export type Order = typeof orders.$inferSelect;

export const orderStatusLabel: Record<OrderStatus, string> = {
  open: "未決済",
  paid: "支払い済み",
  canceled: "キャンセル",
  expired: "期限切れ",
  failed: "失敗",
  refunded: "返金済み",
};

function isOrderStatus(value: string): value is OrderStatus {
  return (orderStatuses as readonly string[]).includes(value);
}

export function statusLabel(status: string) {
  return isOrderStatus(status) ? orderStatusLabel[status] : status;
}

function canTransition(from: string, to: OrderStatus) {
  if (from === to) return true;
  if (from === "refunded") return false;
  if (to === "paid") return true;
  if (to === "refunded") return from === "paid";
  return from === "open" || from === "failed";
}

export async function listRecentOrders(limit = 10) {
  return db.select().from(orders).orderBy(desc(orders.createdAt)).limit(limit);
}

export async function getOrder(id: string) {
  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return order ?? null;
}

export async function getOrderByCheckoutSessionId(sessionId: string) {
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.payjpCheckoutSessionId, sessionId))
    .limit(1);
  return order ?? null;
}

export async function getOrderByPaymentFlowId(paymentFlowId: string) {
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.payjpPaymentFlowId, paymentFlowId))
    .limit(1);
  return order ?? null;
}

export async function createOrder(amount: number) {
  const [order] = await db
    .insert(orders)
    .values({ amount, status: "open" })
    .returning();
  return order;
}

export async function saveCheckoutSessionId(orderId: string, sessionId: string) {
  const [order] = await db
    .update(orders)
    .set({
      payjpCheckoutSessionId: sessionId,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId))
    .returning();
  return order ?? null;
}

export async function savePaymentFlowId(orderId: string, paymentFlowId: string) {
  const [order] = await db
    .update(orders)
    .set({
      payjpPaymentFlowId: paymentFlowId,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId))
    .returning();
  return order ?? null;
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  extra: Partial<Pick<Order, "payjpCheckoutSessionId" | "payjpPaymentFlowId" | "refundedAmount">> = {},
) {
  const current = await getOrder(orderId);
  if (!current) return null;
  if (!canTransition(current.status, status)) return current;

  const [order] = await db
    .update(orders)
    .set({
      status,
      ...extra,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId))
    .returning();
  return order ?? null;
}

export async function syncRefundsFromPayjp(orderId: string) {
  const current = await getOrder(orderId);
  if (!current) return null;
  if (current.status !== "paid" && current.status !== "refunded") return current;

  const { refunds } = await getPayjpPaymentData(current);
  const refundedAmount = refunds
    .filter((refund) => refund.status === "succeeded")
    .reduce((sum, refund) => sum + refund.amount, 0);
  const status: OrderStatus = refundedAmount >= current.amount ? "refunded" : "paid";

  return updateOrderStatus(orderId, status, { refundedAmount });
}

function omitClientSecret<T extends { client_secret?: string }>(value: T) {
  const { client_secret: _ignored, ...rest } = value;
  return rest;
}

export async function getPayjpPaymentData(order: Order) {
  if (!order.payjpCheckoutSessionId && !order.payjpPaymentFlowId) {
    return {
      checkoutSession: null,
      paymentFlow: null,
      refunds: [],
    };
  }

  const client = getPayjpClient();
  let checkoutSession = null;
  let paymentFlow = null;
  let refunds: Array<{ id: string; amount: number; status: string }> = [];

  if (order.payjpCheckoutSessionId) {
    const session = await getCheckoutSession({
      client,
      path: { checkout_session_id: order.payjpCheckoutSessionId },
    });
    if (session.error) {
      throw new Error("Checkout Session の取得に失敗しました");
    }
    checkoutSession = session.data ?? null;
  }

  const paymentFlowId =
    order.payjpPaymentFlowId ?? checkoutSession?.payment_flow_id ?? null;

  if (paymentFlowId) {
    const flow = await getPaymentFlow({
      client,
      path: { payment_flow_id: paymentFlowId },
    });
    if (flow.error) {
      throw new Error("Payment Flow の取得に失敗しました");
    }
    paymentFlow = flow.data ? omitClientSecret(flow.data) : null;

    const refundList = await getPaymentFlowRefunds({
      client,
      path: { payment_flow_id: paymentFlowId },
    });
    refunds = (refundList.data?.data ?? []).map((refund) => ({
      id: refund.id,
      amount: refund.amount,
      status: refund.status,
    }));
  }

  return { checkoutSession, paymentFlow, refunds };
}

export async function refundOrder(orderId: string, amount?: number) {
  const order = await getOrder(orderId);
  if (!order) {
    return { error: "注文が見つかりません", status: 404 as const };
  }
  if (order.status !== "paid") {
    return { error: "支払い済みの注文のみ返金できます", status: 400 as const };
  }

  const client = getPayjpClient();
  let paymentFlowId = order.payjpPaymentFlowId;

  if (!paymentFlowId && order.payjpCheckoutSessionId) {
    const session = await getCheckoutSession({
      client,
      path: { checkout_session_id: order.payjpCheckoutSessionId },
    });
    paymentFlowId = session.data?.payment_flow_id ?? null;
    if (paymentFlowId) {
      await updateOrderStatus(order.id, "paid", {
        payjpPaymentFlowId: paymentFlowId,
      });
    }
  }

  if (!paymentFlowId) {
    return {
      error: "PAY.JP の支払い ID がまだありません。Webhook 完了後に再試行してください",
      status: 400 as const,
    };
  }

  const remaining = order.amount - order.refundedAmount;
  if (amount != null && (amount <= 0 || amount > remaining)) {
    return { error: "返金額が不正です", status: 400 as const };
  }

  const refund = await createPaymentRefund({
    client,
    body: {
      payment_flow_id: paymentFlowId,
      ...(amount != null ? { amount } : {}),
      reason: "requested_by_customer",
      metadata: { order_id: order.id },
    },
    headers: {
      "Idempotency-Key": `refund-${order.id}-${order.refundedAmount}-${amount ?? "full"}`,
    },
  });

  if (refund.error || !refund.data) {
    return { error: "返金 API の呼び出しに失敗しました", status: 502 as const, detail: refund.error };
  }

  await syncRefundsFromPayjp(order.id);
  return { refund: refund.data };
}
