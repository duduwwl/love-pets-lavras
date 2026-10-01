import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, uniqueIndex, index, primaryKey } from "drizzle-orm/sqlite-core";

export const appointments = sqliteTable("appointments", {
  id: text("id").primaryKey(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  service: text("service").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  petName: text("pet_name").notNull(),
  petType: text("pet_type").notNull(),
  guardianName: text("guardian_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  notes: text("notes"),
  status: text("status").notNull().default("pending"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_appointments_date").on(table.date),
  index("idx_appointments_phone_created").on(table.phone, table.createdAt),
]);

export const calendarCells = sqliteTable("calendar_cells", {
  date: text("date").notNull(),
  time: text("time").notNull(),
  appointmentId: text("appointment_id").references(() => appointments.id),
  blockId: text("block_id").references(() => blockedSlots.id),
}, (table) => [
  primaryKey({ columns: [table.date, table.time] }),
  index("idx_calendar_cells_appointment").on(table.appointmentId),
  index("idx_calendar_cells_block").on(table.blockId),
]);

export const services = sqliteTable("services", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  enabled: integer("enabled", { mode: "boolean" }).notNull(),
});

export const weeklyHours = sqliteTable("weekly_hours", {
  weekday: integer("weekday").primaryKey(),
  enabled: integer("enabled", { mode: "boolean" }).notNull(),
  openTime: text("open_time").notNull(),
  closeTime: text("close_time").notNull(),
});

export const blockedSlots = sqliteTable("blocked_slots", {
  id: text("id").primaryKey(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  reason: text("reason"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("idx_blocked_date_time").on(table.date, table.time),
]);

export const shopProducts = sqliteTable("shop_products", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  usage: text("usage").notNull(),
  selection: text("selection").notNull(),
  care: text("care").notNull(),
  image: text("image").notNull(),
  price: text("price"),
  available: integer("available", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
