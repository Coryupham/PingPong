import { unstable_noStore as noStore } from "next/cache";
import { createSupabaseAdminClient, createSupabaseServerClient, hasSupabaseConfig } from "@/lib/supabase";
import type { Match, Player } from "@/lib/types";

export type RankingPlayer = Pick<
  Player,
  "id" | "display_name" | "email" | "rating" | "wins" | "losses" | "games_played" | "points_for" | "points_against"
>;

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

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
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
