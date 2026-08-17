import { NextRequest, NextResponse } from "next/server";
import { getAppUrl } from "@/lib/app-url";
import { refundOrder } from "@/lib/orders";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const formData = await req.formData().catch(() => null);
  const raw = formData?.get("amount");
  const amount = raw ? Number(raw) : undefined;

  try {
    const result = await refundOrder(id, amount);
    if ("error" in result && result.error) {
      const errorCode =
        result.status === 404 ? "not_found" : result.status === 400 ? "not_paid" : "failed";
      return NextResponse.redirect(
        new URL(`/refund?error=${errorCode}`, getAppUrl(req)),
        303,
      );
    }

    return NextResponse.redirect(new URL("/refund?done=1", getAppUrl(req)), 303);
  } catch {
    return NextResponse.redirect(new URL("/refund?error=failed", getAppUrl(req)), 303);
  }
}
