import { unstable_noStore as noStore } from "next/cache";
import { createSupabaseAdminClient, createSupabaseServerClient, hasSupabaseConfig } from "@/lib/supabase";
import type { AdminAuditLog, Match, Player, Profile, RatingEvent, Tournament } from "@/lib/types";

export type RankingPlayer = Pick<
  Player,
  "id" | "display_name" | "email" | "rating" | "wins" | "losses" | "games_played" | "points_for" | "points_against"
>;

export type AdminAuditLogSummary = Pick<
  AdminAuditLog,
  "id" | "admin_id" | "action" | "target_table" | "target_id" | "created_at"
>;

export type AdminDatabaseSnapshot = {
  counts: {
    adminProfiles: number;
    players: number;
    matches: number;
    ratingEvents: number;
    auditLog: number;
    tournaments: number;
  };
  adminProfiles: Pick<Profile, "id" | "display_name" | "email" | "is_admin" | "created_at">[];
  players: RankingPlayer[];
  matches: Match[];
  ratingEvents: RatingEvent[];
  auditLog: AdminAuditLogSummary[];
  tournaments: Tournament[];
};

const demoPlayers: RankingPlayer[] = [
  {
    id: "demo-1",
    display_name: "Avery Chen",
    email: "avery@example.com",
    rating: 1048,
    wins: 3,
    losses: 1,
    games_played: 4,
    points_for: 43,
    points_against: 35
  },
  {
    id: "demo-2",
    display_name: "Morgan Lee",
    email: "morgan@example.com",
    rating: 1015,
    wins: 2,
    losses: 2,
    games_played: 4,
    points_for: 39,
    points_against: 38
  },
  {
    id: "demo-3",
    display_name: "Jordan Patel",
    email: "jordan@example.com",
    rating: 987,
    wins: 1,
    losses: 2,
    games_played: 3,
    points_for: 29,
    points_against: 32
  },
  {
    id: "demo-4",
    display_name: "Sam Rivera",
    email: "sam@example.com",
    rating: 950,
    wins: 0,
    losses: 1,
    games_played: 1,
    points_for: 8,
    points_against: 11
  }
];

export async function getCurrentProfile() {
  noStore();

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const { data: authData, error: authError } = await supabase.auth.getUser().catch(() => ({
    data: { user: null },
    error: null
  }));

  if (authError || !authData.user) {
    return null;
  }

  const { data } = await supabase.from("profiles").select("*").eq("id", authData.user.id).single();
  return data;
}

export async function getRankings(): Promise<RankingPlayer[]> {
  noStore();

  if (!hasSupabaseConfig()) {
    return demoPlayers;
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return demoPlayers;
  }

  const { data, error } = await supabase
    .from("players")
    .select("id, display_name, email, rating, wins, losses, games_played, points_for, points_against")
    .order("rating", { ascending: false })
    .order("wins", { ascending: false })
    .order("games_played", { ascending: false });

  if (error || !data) {
    return demoPlayers;
  }

  return data;
}

export async function getPlayers() {
  return getRankings();
}

export async function getRecentMatches(limit = 20) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return [] as Match[];
  }

  const { data } = await supabase
    .from("matches")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  return data ?? [];
}

export async function getAdminDatabaseSnapshot(): Promise<AdminDatabaseSnapshot | null> {
  noStore();

  const profile = await getCurrentProfile();
  const supabase = createSupabaseAdminClient();

  if (!profile?.is_admin || !supabase) {
    return null;
  }

  const [
    adminProfilesResult,
    playersResult,
    matchesResult,
    ratingEventsResult,
    auditLogResult,
    tournamentsResult,
    adminProfilesCount,
    playersCount,
    matchesCount,
    ratingEventsCount,
    auditLogCount,
    tournamentsCount
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name, email, is_admin, created_at")
      .eq("is_admin", true)
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("players")
      .select("id, display_name, email, rating, wins, losses, games_played, points_for, points_against")
      .order("rating", { ascending: false })
      .order("wins", { ascending: false })
      .limit(12),
    supabase
      .from("matches")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("rating_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("admin_audit_log")
      .select("id, admin_id, action, target_table, target_id, created_at")
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("tournaments")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(12),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_admin", true),
    supabase.from("players").select("*", { count: "exact", head: true }),
    supabase.from("matches").select("*", { count: "exact", head: true }),
    supabase.from("rating_events").select("*", { count: "exact", head: true }),
    supabase.from("admin_audit_log").select("*", { count: "exact", head: true }),
    supabase.from("tournaments").select("*", { count: "exact", head: true })
  ]);

  return {
    counts: {
      adminProfiles: adminProfilesCount.count ?? adminProfilesResult.data?.length ?? 0,
      players: playersCount.count ?? playersResult.data?.length ?? 0,
      matches: matchesCount.count ?? matchesResult.data?.length ?? 0,
      ratingEvents: ratingEventsCount.count ?? ratingEventsResult.data?.length ?? 0,
      auditLog: auditLogCount.count ?? auditLogResult.data?.length ?? 0,
      tournaments: tournamentsCount.count ?? tournamentsResult.data?.length ?? 0
    },
    adminProfiles: adminProfilesResult.data ?? [],
    players: playersResult.data ?? [],
    matches: matchesResult.data ?? [],
    ratingEvents: ratingEventsResult.data ?? [],
    auditLog: auditLogResult.data ?? [],
    tournaments: tournamentsResult.data ?? []
  };
}

export async function getAdminTournaments(): Promise<Tournament[]> {
  noStore();

  const profile = await getCurrentProfile();
  const supabase = createSupabaseAdminClient();

  if (!profile?.is_admin || !supabase) {
    return [];
  }

  const { data } = await supabase
    .from("tournaments")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(8);

  return data ?? [];
}

export async function getPublicTournaments(): Promise<Tournament[]> {
  noStore();

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return [];
  }

  const { data } = await supabase
    .from("tournaments")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(12);

  return data ?? [];
}
