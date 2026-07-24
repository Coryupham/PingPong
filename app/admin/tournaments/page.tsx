import Link from "next/link";
import { TournamentAdmin } from "@/components/tournament-admin";
import { Panel } from "@/components/ui";
import { getAdminTournaments, getCurrentProfile, getRankings } from "@/lib/data";

export default async function AdminTournamentsPage() {
  const profile = await getCurrentProfile();

  if (!profile?.is_admin) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <Panel>
          <h1 className="text-3xl font-black text-ink">Admin access required</h1>
          <p className="mt-2 text-mist">Only league admins can manage tournaments.</p>
        </Panel>
      </main>
    );
  }

  const [players, tournaments] = await Promise.all([getRankings(), getAdminTournaments()]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-court">Admin</p>
          <h1 className="mt-2 text-4xl font-black text-ink">Tournament management</h1>
        </div>
        <Link
          className="focus-ring inline-flex items-center justify-center rounded-md border border-line px-4 py-3 font-black text-mist hover:bg-graphite hover:text-ink"
          href="/admin"
        >
          Back to admin
        </Link>
      </div>
      <TournamentAdmin players={players} tournaments={tournaments} />
    </main>
  );
}
