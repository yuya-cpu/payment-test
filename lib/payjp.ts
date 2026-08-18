import { createClient } from "@payjp/payjpv2";

export function getPayjpClient() {
  const apiKey = process.env.PAYJP_SECRET_KEY;
  if (!apiKey) {
    throw new Error("PAYJP_SECRET_KEY が未設定です");
  }

  return createClient({ apiKey });
}

export function getPayjpPublicKey() {
  const publicKey =
    process.env.PAYJP_PUBLIC_KEY ?? process.env.NEXT_PUBLIC_PAYJP_PUBLIC_KEY;
  if (!publicKey) {
    throw new Error(
      "PAYJP_PUBLIC_KEY または NEXT_PUBLIC_PAYJP_PUBLIC_KEY が未設定です",
    );
  }
  return publicKey;
}
