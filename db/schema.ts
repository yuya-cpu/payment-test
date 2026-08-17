import { integer, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  amount: integer("amount").notNull(),
  status: varchar("status", { length: 32 }).notNull(),
  payjpCheckoutSessionId: varchar("payjp_checkout_session_id", {
    length: 255,
  }).unique(),
  payjpPaymentFlowId: varchar("payjp_payment_flow_id", { length: 255 }),
  refundedAmount: integer("refunded_amount").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
