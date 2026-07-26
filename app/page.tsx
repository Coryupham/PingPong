import Link from "next/link";
import { Trophy, UserPlus, Swords, BarChart3 } from "lucide-react";
import { getRankings } from "@/lib/data";

export default async function HomePage() {
  const rankings = await getRankings();
  const leaders = rankings.slice(0, 3);

  return (
    <main className="mx-auto grid max-w-6xl gap-5 px-3 py-5 sm:gap-8 sm:px-4 sm:py-8 lg:grid-cols-[1.12fr_0.88fr]">
      <section className="relative flex min-h-[470px] min-w-0 overflow-hidden rounded-lg border border-line bg-graphite p-5 text-ink shadow-panel sm:min-h-[560px] sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_28%,rgba(46,213,115,0.18),transparent_18rem)]" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-court/70" />
        <div className="relative flex flex-1 flex-col justify-between">
        <div>
          <p className="mb-3 text-sm font-black uppercase tracking-[0.16em] text-court">
            Neon Arcade Lite
          </p>
          <h1 className="max-w-2xl text-4xl font-black leading-[1.08] sm:text-6xl sm:leading-tight">
            Fast matches. Clean scores. Proper bragging rights.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-mist sm:text-lg sm:leading-8">
            A table-side league app with quick scoring, PIN-confirmed matches, Elo rankings,
            and just enough glow to make winning feel official.
          </p>
        </div>
        <div className="mt-8 grid gap-3 sm:mt-10 sm:grid-cols-2">
          <Link
            className="focus-ring flex min-h-12 items-center justify-center rounded-md bg-court px-4 py-3 text-center font-black text-night shadow-glow hover:bg-emerald-300"
            href="/game"
          >
            Start game
          </Link>
          <Link
            className="focus-ring flex min-h-12 items-center justify-center rounded-md border border-line px-4 py-3 text-center font-bold text-ink hover:bg-night"
            href="/rankings"
          >
            View rankings
          </Link>
        </div>
        </div>
      </section>

      <section className="grid min-w-0 gap-4">
        <div className="rounded-lg border border-line bg-graphite/92 p-5 shadow-panel">
          <div className="flex items-center gap-3">
            <Trophy className="h-5 w-5 text-gold" />
            <h2 className="text-xl font-black text-ink">Top players</h2>
          </div>
          <div className="mt-5 grid gap-3">
            {leaders.map((player, index) => (
              <div key={player.id} className="flex items-center justify-between rounded-md border border-line bg-night/70 p-4">
                <div>
                  <p className="text-sm font-black text-court">#{index + 1}</p>
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
            { icon: UserPlus, title: "Confirmed games", text: "Both players confirm by email and PIN before the score is saved." },
            { icon: BarChart3, title: "Elo rankings", text: "Ratings, wins, losses, and point differential stay current." }
          ].map((item) => (
            <div key={item.title} className="rounded-lg border border-line bg-graphite/92 p-5 shadow-panel">
              <item.icon className="h-5 w-5 text-court" />
              <h3 className="mt-3 font-bold text-ink">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-mist">{item.text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
