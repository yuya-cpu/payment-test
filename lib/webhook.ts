import { NextRequest, NextResponse } from "next/server";
import {
  getOrder,
  getOrderByCheckoutSessionId,
  getOrderByPaymentFlowId,
  type OrderStatus,
  syncRefundsFromPayjp,
  updateOrderStatus,
} from "@/lib/orders";

type PayjpEvent = {
  id?: string;
  type?: string;
  data?: {
    id?: string;
    object?: string;
    status?: string;
    amount?: number;
    payment_flow_id?: string | null;
    metadata?: Record<string, unknown> | null;
  };
};

async function findOrder(event: PayjpEvent) {
  const orderId = String(event.data?.metadata?.order_id ?? "");
  if (orderId) {
    const byId = await getOrder(orderId);
    if (byId) return byId;
  }

  const object = event.data?.object;
  const id = event.data?.id;
  if (object === "checkout.session" && id) {
    const bySession = await getOrderByCheckoutSessionId(id);
    if (bySession) return bySession;
  }
  if ((object === "payment_flow" || object === "payment_refund") && id) {
    const byFlow = await getOrderByPaymentFlowId(
      object === "payment_refund" ? String(event.data?.payment_flow_id ?? "") : id,
    );
    if (byFlow) return byFlow;
  }
  if (event.data?.payment_flow_id) {
    const byFlow = await getOrderByPaymentFlowId(event.data.payment_flow_id);
    if (byFlow) return byFlow;
  }
  return null;
}

export async function handlePayjpWebhook(req: NextRequest) {
  const token = req.headers.get("x-payjp-webhook-token");
  if (!process.env.PAYJP_WEBHOOK_SECRET || token !== process.env.PAYJP_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "invalid token" }, { status: 401 });
  }

  const event = (await req.json()) as PayjpEvent;
  const order = await findOrder(event);

  if (!order) {
    return NextResponse.json({ received: true, ignored: true });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      await updateOrderStatus(order.id, "paid", {
        ...(event.data?.id ? { payjpCheckoutSessionId: event.data.id } : {}),
        ...(event.data?.payment_flow_id
          ? { payjpPaymentFlowId: event.data.payment_flow_id }
          : {}),
      });
      break;
    }
    case "payment_flow.succeeded": {
      await updateOrderStatus(order.id, "paid", {
        ...(event.data?.id ? { payjpPaymentFlowId: event.data.id } : {}),
      });
      break;
    }
    case "checkout.session.expired": {
      await updateOrderStatus(order.id, "expired");
      break;
    }
    case "payment_flow.payment_failed": {
      await updateOrderStatus(order.id, "failed" satisfies OrderStatus);
      break;
    }
    case "refund.created":
    case "refund.updated": {
      await syncRefundsFromPayjp(order.id);
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
