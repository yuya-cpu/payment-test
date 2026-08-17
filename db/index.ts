import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

function getDatabaseUrl() {
  const url = process.env.POSTGRES_URL ?? process.env.POSTGRES_URL_NON_POOLING;
  if (!url) {
    throw new Error("POSTGRES_URL または POSTGRES_URL_NON_POOLING が未設定です");
  }
  return url;
}

const client = postgres(getDatabaseUrl(), {
  prepare: false,
  max: 1,
});

export const db = drizzle(client, { schema });
