import Link from "next/link";
import { TournamentResults } from "@/components/tournament-results";
import { getPublicTournaments } from "@/lib/data";

export default async function TournamentsPage() {
  const tournaments = await getPublicTournaments();

  return (
    <main className="mx-auto max-w-6xl px-3 py-5 sm:px-4 sm:py-8">
      <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-court sm:text-sm">Players</p>
          <h1 className="mt-1 text-3xl font-black text-ink sm:mt-2 sm:text-4xl">Tournament results</h1>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-mist sm:text-base">
            Follow bracket status, team match winners, and each recorded player game.
          </p>
        </div>
        <Link
          className="focus-ring inline-flex items-center justify-center rounded-md border border-line px-4 py-3 font-black text-mist hover:bg-graphite hover:text-ink"
          href="/rankings"
        >
          View rankings
        </Link>
      </div>
      <TournamentResults tournaments={tournaments} />
    </main>
  );
}
