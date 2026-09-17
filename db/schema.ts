import { pgTable, serial, text, date, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial().primaryKey(),
  fullName: text("full_name").notNull(),
  username: text().notNull().unique(),
  email: text().notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  dateOfBirth: date("date_of_birth").notNull(),
  country: text().notNull(),
  gender: text().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
