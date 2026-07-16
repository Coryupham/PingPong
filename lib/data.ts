import { unstable_noStore as noStore } from "next/cache";
import { createSupabaseServerClient, hasSupabaseConfig } from "@/lib/supabase";
import type { GameInvite, Match, Profile } from "@/lib/types";

export type RankingProfile = Pick<
  Profile,
  "id" | "display_name" | "rating" | "wins" | "losses" | "games_played" | "points_for" | "points_against" | "is_admin"
>;

const demoProfiles: RankingProfile[] = [
  {
    id: "demo-1",
    display_name: "Avery Chen",
    rating: 1048,
    wins: 3,
    losses: 1,
    games_played: 4,
    points_for: 43,
    points_against: 35,
    is_admin: true
  },
  {
    id: "demo-2",
    display_name: "Morgan Lee",
    rating: 1015,
    wins: 2,
    losses: 2,
    games_played: 4,
    points_for: 39,
    points_against: 38,
    is_admin: false
  },
  {
    id: "demo-3",
    display_name: "Jordan Patel",
    rating: 987,
    wins: 1,
    losses: 2,
    games_played: 3,
    points_for: 29,
    points_against: 32,
    is_admin: false
  },
  {
    id: "demo-4",
    display_name: "Sam Rivera",
    rating: 950,
    wins: 0,
    losses: 1,
    games_played: 1,
    points_for: 8,
    points_against: 11,
    is_admin: false
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

export async function getRankings(): Promise<RankingProfile[]> {
  noStore();

  if (!hasSupabaseConfig()) {
    return demoProfiles;
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return demoProfiles;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, rating, wins, losses, games_played, points_for, points_against, is_admin")
    .order("rating", { ascending: false })
    .order("wins", { ascending: false })
    .order("games_played", { ascending: false });

  if (error || !data) {
    return demoProfiles;
  }

  return data;
}

export async function getPlayers() {
  const rankings = await getRankings();
  return rankings.filter((player) => !player.is_admin || rankings.length === 1);
}

export async function getInvitesForCurrentUser() {
  const profile = await getCurrentProfile();
  const supabase = await createSupabaseServerClient();
  if (!profile || !supabase) {
    return { profile, invites: [] as GameInvite[] };
  }

  const { data } = await supabase
    .from("game_invites")
    .select("*")
    .or(`challenger_id.eq.${profile.id},opponent_id.eq.${profile.id}`)
    .order("created_at", { ascending: false });

  return { profile, invites: data ?? [] };
}

export async function getInviteById(inviteId?: string) {
  if (!inviteId) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const { data } = await supabase.from("game_invites").select("*").eq("id", inviteId).single();
  return data;
}

export async function getRecentMatches(limit = 20) {
  const supabase = await createSupabaseServerClient();
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
