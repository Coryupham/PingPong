import { GameBoard } from "@/components/game-board";

export default async function GamePage() {
  return (
    <main className="mx-auto max-w-6xl px-3 py-4 sm:px-4 sm:py-8">
      <div className="mb-4 sm:mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-court sm:text-sm">Live game</p>
        <h1 className="mt-1 text-3xl font-black text-ink sm:mt-2 sm:text-4xl">Scoreboard</h1>
      </div>
      <GameBoard />
    </main>
  );
}
