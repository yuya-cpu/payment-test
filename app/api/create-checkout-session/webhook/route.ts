import { NextRequest } from "next/server";
import { handlePayjpWebhook } from "@/lib/webhook";

export async function POST(req: NextRequest) {
  return handlePayjpWebhook(req);
}
