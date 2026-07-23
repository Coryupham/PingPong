import { GameBoard } from "@/components/game-board";

export default async function GamePage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-court">Live game</p>
        <h1 className="mt-2 text-4xl font-black text-ink">Scoreboard</h1>
      </div>
      <GameBoard />
    </main>
  );
}
