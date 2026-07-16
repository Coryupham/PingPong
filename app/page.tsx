import Link from "next/link";
import { Trophy, UserPlus, Swords, BarChart3 } from "lucide-react";
import { getCurrentProfile, getRankings } from "@/lib/data";

export default async function HomePage() {
  const profile = await getCurrentProfile();
  const rankings = await getRankings();
  const leaders = rankings.slice(0, 3);

  return (
    <main className="mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[1.15fr_0.85fr]">
      <section className="flex min-h-[560px] flex-col justify-between rounded-lg bg-ink p-6 text-white shadow-panel sm:p-8">
        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-court">
            Office table tennis, properly tracked
          </p>
          <h1 className="max-w-2xl text-4xl font-black leading-tight sm:text-6xl">
            Score games, confirm opponents, and keep the ladder honest.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">
            A lightweight league app for match scoring, player rankings, game invites, and admin
            corrections when somebody fat-fingers a final.
          </p>
        </div>
        <div className="mt-10 grid gap-3 sm:grid-cols-3">
          <Link
            className="focus-ring rounded-md bg-court px-4 py-3 text-center font-bold text-white hover:bg-teal-700"
            href={profile ? "/game" : "/sign-up"}
          >
            {profile ? "Start game" : "Create account"}
          </Link>
          <Link
            className="focus-ring rounded-md border border-white/20 px-4 py-3 text-center font-bold hover:bg-white/10"
            href="/rankings"
          >
            View rankings
          </Link>
          <Link
            className="focus-ring rounded-md border border-white/20 px-4 py-3 text-center font-bold hover:bg-white/10"
            href="/invites"
          >
            Invites
          </Link>
        </div>
      </section>

      <section className="grid gap-4">
        <div className="rounded-lg bg-white p-5 shadow-panel">
          <div className="flex items-center gap-3">
            <Trophy className="h-5 w-5 text-gold" />
            <h2 className="text-xl font-bold text-ink">Top players</h2>
          </div>
          <div className="mt-5 grid gap-3">
            {leaders.map((player, index) => (
              <div key={player.id} className="flex items-center justify-between rounded-md bg-slate-50 p-4">
                <div>
                  <p className="text-sm font-semibold text-slate-500">#{index + 1}</p>
                  <p className="text-lg font-bold text-ink">{player.display_name}</p>
                </div>
                <p className="text-2xl font-black text-court">{player.rating}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          {[
            { icon: Swords, title: "Score to 11", text: "Win by two, with submit blocked until the score is legal." },
            { icon: UserPlus, title: "Confirmed games", text: "Opponent PIN confirmation protects the match record." },
            { icon: BarChart3, title: "Elo rankings", text: "Ratings, wins, losses, and point differential stay current." }
          ].map((item) => (
            <div key={item.title} className="rounded-lg bg-white p-5 shadow-panel">
              <item.icon className="h-5 w-5 text-court" />
              <h3 className="mt-3 font-bold text-ink">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
