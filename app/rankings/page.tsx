import { Medal } from "lucide-react";
import { getRankings } from "@/lib/data";

export default async function RankingsPage() {
  const rankings = await getRankings();

  return (
    <main className="mx-auto max-w-6xl px-3 py-5 sm:px-4 sm:py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-court">League board</p>
          <h1 className="mt-1 text-3xl font-black text-ink sm:mt-2 sm:text-4xl">Rankings</h1>
        </div>
        <p className="max-w-lg text-sm leading-6 text-mist">
          Players are sorted by Elo rating, then wins, then games played. New players begin at 1000.
        </p>
      </div>

      <div className="grid gap-3 md:hidden">
        {rankings.map((player, index) => (
          <article key={player.id} className="rounded-lg border border-line bg-graphite/92 p-4 shadow-panel">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-court">
                  {index < 3 ? <Medal className="h-4 w-4 text-gold" /> : null}
                  Rank #{index + 1}
                </p>
                <h2 className="mt-1 truncate text-xl font-black text-ink">{player.display_name}</h2>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-mist">Rating</p>
                <p className="text-3xl font-black tabular-nums text-court">{player.rating}</p>
              </div>
            </div>
            <dl className="mt-4 grid grid-cols-4 gap-2 border-t border-line pt-3 text-center">
              {[
                ["Wins", player.wins],
                ["Losses", player.losses],
                ["Games", player.games_played],
                ["Diff", player.points_for - player.points_against]
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-[0.65rem] font-black uppercase tracking-[0.08em] text-mist">{label}</dt>
                  <dd className="mt-1 font-black tabular-nums text-ink">{value}</dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto overflow-y-hidden rounded-lg border border-line bg-graphite/92 shadow-panel md:block">
        <table className="w-full min-w-[780px] text-left">
          <thead className="bg-night text-sm uppercase tracking-[0.08em] text-mist">
            <tr>
              <th className="px-4 py-3">Rank</th>
              <th className="px-4 py-3">Player</th>
              <th className="px-4 py-3">Rating</th>
              <th className="px-4 py-3">W</th>
              <th className="px-4 py-3">L</th>
              <th className="px-4 py-3">Games</th>
              <th className="px-4 py-3">Point diff</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rankings.map((player, index) => (
              <tr key={player.id} className="text-sm text-mist hover:bg-night/55">
                <td className="px-4 py-4 font-black text-ink">
                  <span className="inline-flex items-center gap-2">
                    {index < 3 ? <Medal className="h-4 w-4 text-gold" /> : null}
                    #{index + 1}
                  </span>
                </td>
                <td className="px-4 py-4 font-bold text-ink">{player.display_name}</td>
                <td className="px-4 py-4 text-lg font-black text-court">{player.rating}</td>
                <td className="px-4 py-4">{player.wins}</td>
                <td className="px-4 py-4">{player.losses}</td>
                <td className="px-4 py-4">{player.games_played}</td>
                <td className="px-4 py-4">{player.points_for - player.points_against}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
