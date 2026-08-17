import { NextRequest, NextResponse } from "next/server";
import { getAppUrl } from "@/lib/app-url";
import { updateOrderStatus } from "@/lib/orders";

export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get("order_id");
  if (orderId) {
    await updateOrderStatus(orderId, "canceled");
  }

  const url = new URL("/cancel", getAppUrl(req));
  if (orderId) url.searchParams.set("order_id", orderId);
  return NextResponse.redirect(url, 303);
}
