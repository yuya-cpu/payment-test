import { createClient } from "@payjp/payjpv2";

export function getPayjpClient() {
  const apiKey = process.env.PAYJP_SECRET_KEY;
  if (!apiKey) {
    throw new Error("PAYJP_SECRET_KEY が未設定です");
  }

  return createClient({ apiKey });
}
