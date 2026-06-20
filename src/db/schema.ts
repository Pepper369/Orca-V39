import { date, index, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const dashboardSnapshots = pgTable(
  "dashboard_snapshots",
  {
    id: serial("id").primaryKey(),
    snapshotDate: date("snapshot_date").notNull().defaultNow(),
    data: jsonb("data").notNull(),
    createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
  },
  (table) => ({
    snapshotDateIdx: index("dashboard_snapshots_snapshot_date_idx").on(table.snapshotDate),
    createdAtIdx: index("dashboard_snapshots_created_at_idx").on(table.createdAt),
  })
);

export const marketAlerts = pgTable(
  "market_alerts",
  {
    id: serial("id").primaryKey(),
    alertType: text("alert_type").notNull(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    severity: text("severity").notNull(),
    createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
  },
  (table) => ({
    createdAtIdx: index("market_alerts_created_at_idx").on(table.createdAt),
  })
);
