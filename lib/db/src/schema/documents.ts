import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { employeesTable } from "./employees";

export const documentsTable = pgTable("documents", {
  id: serial("id").primaryKey(),
  number: text("number").notNull().unique(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  status: text("status").notNull().default("draft"),
  employeeId: integer("employee_id").notNull().references(() => employeesTable.id),
  content: text("content").notNull(),
  templateId: integer("template_id"),
  employeeScanDataUrl: text("employee_scan_data_url"),
  employeeScanFileName: text("employee_scan_file_name"),
  employeeSignedAt: timestamp("employee_signed_at"),
  signedAt: timestamp("signed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDocumentSchema = createInsertSchema(documentsTable).omit({ id: true, createdAt: true });
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documentsTable.$inferSelect;
