import { NextResponse } from "next/server";
import { scoreTournamentMatchAction } from "@/app/actions/tournaments";

export async function POST(request: Request) {
  const formData = await request.formData();
  const result = await scoreTournamentMatchAction(undefined, formData);

  return NextResponse.json(result ?? {});
}
