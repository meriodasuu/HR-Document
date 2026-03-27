import { pgTable, text, serial, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const customTemplatesTable = pgTable("custom_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull().default("custom"),
  description: text("description").notNull().default(""),
  fields: jsonb("fields").notNull().default([]),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCustomTemplateSchema = createInsertSchema(customTemplatesTable).omit({ id: true, createdAt: true });
export type InsertCustomTemplate = z.infer<typeof insertCustomTemplateSchema>;
export type CustomTemplate = typeof customTemplatesTable.$inferSelect;
