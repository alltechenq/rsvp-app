import {
  pgTable,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  uuid,
  serial,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  eventType: varchar("event_type", { length: 100 }).notNull(),
  hostNames: varchar("host_names", { length: 255 }).notNull(),
  eventDate: timestamp("event_date").notNull(),
  eventTime: varchar("event_time", { length: 10 }).notNull(),
  venue: varchar("venue", { length: 500 }).notNull(),
  venueAddress: text("venue_address"),
  rsvpDeadline: timestamp("rsvp_deadline").notNull(),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const guestGroups = pgTable("guest_groups", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id")
    .references(() => events.id, { onDelete: "cascade" })
    .notNull(),
  headGuestName: varchar("head_guest_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  maxGuests: integer("max_guests").notNull().default(1),
  token: uuid("token").notNull().unique(),
  saveTheDateSent: boolean("save_the_date_sent").default(false),
  inviteSent: boolean("invite_sent").default(false),
  responded: boolean("responded").default(false),
  respondedAt: timestamp("responded_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const guests = pgTable("guests", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id")
    .references(() => guestGroups.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  isHeadGuest: boolean("is_head_guest").default(false),
  attending: boolean("attending"),
});
