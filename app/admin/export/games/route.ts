import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/data";
import { createSupabaseAdminClient } from "@/lib/supabase";
import type { Match } from "@/lib/types";

const exportColumns: { header: string; value: (match: Match) => string | number | null }[] = [
  { header: "match_id", value: (match) => match.id },
  { header: "created_at", value: (match) => match.created_at },
  { header: "updated_at", value: (match) => match.updated_at },
  { header: "status", value: (match) => match.status },
  { header: "player_one_name", value: (match) => match.player_one_name },
  { header: "player_one_email", value: (match) => match.player_one_email },
  { header: "player_one_score", value: (match) => match.player_one_score },
  { header: "player_two_name", value: (match) => match.player_two_name },
  { header: "player_two_email", value: (match) => match.player_two_email },
  { header: "player_two_score", value: (match) => match.player_two_score },
  { header: "winner_name", value: (match) => match.winner_name },
  { header: "winner_email", value: (match) => match.winner_email },
  { header: "first_server_name", value: (match) => match.first_server_name },
  { header: "first_server_email", value: (match) => match.first_server_email },
  { header: "tournament_id", value: (match) => match.tournament_id },
  { header: "tournament_round", value: (match) => match.tournament_round },
  { header: "tournament_match_id", value: (match) => match.tournament_match_id },
  { header: "player_one_id", value: (match) => match.player_one_id },
  { header: "player_two_id", value: (match) => match.player_two_id },
  { header: "winner_id", value: (match) => match.winner_id },
  { header: "first_server_id", value: (match) => match.first_server_id },
  { header: "submitted_by", value: (match) => match.submitted_by },
  { header: "confirmed_by", value: (match) => match.confirmed_by }
];

function csvCell(value: string | number | null) {
  const text = value === null ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function toCsv(matches: Match[]) {
  const header = exportColumns.map((column) => csvCell(column.header)).join(",");
  const rows = matches.map((match) => exportColumns.map((column) => csvCell(column.value(match))).join(","));
  return [header, ...rows].join("\r\n");
}

export async function GET() {
  const profile = await getCurrentProfile();
  const supabase = createSupabaseAdminClient();

  if (!profile?.is_admin || !supabase) {
    return new NextResponse("Admin access required.", { status: 403 });
  }

  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return new NextResponse(error.message, { status: 500 });
  }

  const csv = toCsv(data ?? []);
  const filename = `ping-pong-games-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Type": "text/csv; charset=utf-8"
    }
  });
}
