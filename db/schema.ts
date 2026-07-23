import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgSchema,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid
} from "drizzle-orm/pg-core";

export const authSchema = pgSchema("auth");

export const authUsers = authSchema.table("users", {
  id: uuid("id").primaryKey()
});

export const matchStatus = pgEnum("match_status", ["final", "voided", "corrected"]);

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id")
      .primaryKey()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    displayName: text("display_name").notNull(),
    email: text("email"),
    isAdmin: boolean("is_admin").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    displayNameLength: check("profiles_display_name_length", sql`char_length(${table.displayName}) >= 2`)
  })
);

export const players = pgTable(
  "players",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    displayName: text("display_name").notNull(),
    email: text("email").notNull(),
    pinHash: text("pin_hash").notNull(),
    rating: integer("rating").notNull().default(1000),
    wins: integer("wins").notNull().default(0),
    losses: integer("losses").notNull().default(0),
    gamesPlayed: integer("games_played").notNull().default(0),
    pointsFor: integer("points_for").notNull().default(0),
    pointsAgainst: integer("points_against").notNull().default(0),
    createdBy: uuid("created_by").references(() => profiles.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    emailIdx: uniqueIndex("players_email_idx").on(table.email),
    rankingsIdx: index("players_rankings_idx").on(table.rating, table.wins, table.gamesPlayed),
    displayNameLength: check("players_display_name_length", sql`char_length(${table.displayName}) >= 2`)
  })
);

export const matches = pgTable(
  "matches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    playerOneId: uuid("player_one_id").notNull().references(() => players.id),
    playerOneName: text("player_one_name"),
    playerOneEmail: text("player_one_email"),
    playerTwoId: uuid("player_two_id").notNull().references(() => players.id),
    playerTwoName: text("player_two_name"),
    playerTwoEmail: text("player_two_email"),
    playerOneScore: integer("player_one_score").notNull(),
    playerTwoScore: integer("player_two_score").notNull(),
    winnerId: uuid("winner_id").notNull().references(() => players.id),
    winnerName: text("winner_name"),
    winnerEmail: text("winner_email"),
    firstServerId: uuid("first_server_id").references(() => players.id),
    firstServerName: text("first_server_name"),
    firstServerEmail: text("first_server_email"),
    status: matchStatus("status").notNull().default("final"),
    submittedBy: uuid("submitted_by").notNull().references(() => players.id),
    confirmedBy: uuid("confirmed_by").notNull().references(() => players.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    recentIdx: index("matches_recent_idx").on(table.createdAt),
    noSelfMatches: check("no_self_matches", sql`${table.playerOneId} <> ${table.playerTwoId}`),
    scoreBounds: check(
      "matches_score_bounds",
      sql`${table.playerOneScore} >= 0 and ${table.playerOneScore} <= 99 and ${table.playerTwoScore} >= 0 and ${table.playerTwoScore} <= 99`
    ),
    winnerIsParticipant: check(
      "winner_is_participant",
      sql`${table.winnerId} in (${table.playerOneId}, ${table.playerTwoId})`
    ),
    firstServerIsParticipant: check(
      "first_server_is_participant",
      sql`${table.firstServerId} is null or ${table.firstServerId} in (${table.playerOneId}, ${table.playerTwoId})`
    ),
    submitterIsParticipant: check(
      "submitter_is_participant",
      sql`${table.submittedBy} in (${table.playerOneId}, ${table.playerTwoId})`
    ),
    confirmerIsParticipant: check(
      "confirmer_is_participant",
      sql`${table.confirmedBy} in (${table.playerOneId}, ${table.playerTwoId})`
    )
  })
);

export const ratingEvents = pgTable(
  "rating_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    matchId: uuid("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    ratingBefore: integer("rating_before").notNull(),
    ratingAfter: integer("rating_after").notNull(),
    ratingDelta: integer("rating_delta").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    matchIdx: index("rating_events_match_idx").on(table.matchId)
  })
);

export const adminAuditLog = pgTable(
  "admin_audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    adminId: uuid("admin_id").notNull().references(() => profiles.id),
    action: text("action").notNull(),
    targetTable: text("target_table").notNull(),
    targetId: uuid("target_id"),
    beforeData: jsonb("before_data"),
    afterData: jsonb("after_data"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    recentIdx: index("admin_audit_recent_idx").on(table.createdAt)
  })
);

export const playersRelations = relations(players, ({ many, one }) => ({
  createdByAdmin: one(profiles, {
    fields: [players.createdBy],
    references: [profiles.id]
  }),
  matchesAsPlayerOne: many(matches, { relationName: "playerOneMatches" }),
  matchesAsPlayerTwo: many(matches, { relationName: "playerTwoMatches" })
}));

export const matchesRelations = relations(matches, ({ one }) => ({
  playerOne: one(players, {
    fields: [matches.playerOneId],
    references: [players.id],
    relationName: "playerOneMatches"
  }),
  playerTwo: one(players, {
    fields: [matches.playerTwoId],
    references: [players.id],
    relationName: "playerTwoMatches"
  }),
  winner: one(players, {
    fields: [matches.winnerId],
    references: [players.id]
  }),
  firstServer: one(players, {
    fields: [matches.firstServerId],
    references: [players.id]
  })
}));
