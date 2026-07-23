import { Medal } from "lucide-react";
import { getRankings } from "@/lib/data";

export default async function RankingsPage() {
  const rankings = await getRankings();

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-court">League board</p>
          <h1 className="mt-2 text-4xl font-black text-ink">Rankings</h1>
        </div>
        <p className="max-w-lg text-sm leading-6 text-mist">
          Players are sorted by Elo rating, then wins, then games played. New players begin at 1000.
        </p>
      </div>

      <div className="overflow-x-auto overflow-y-hidden rounded-lg border border-line bg-graphite/92 shadow-panel">
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
