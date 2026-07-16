"use client";

import { useActionState, useMemo, useState } from "react";
import { Coins, Minus, Plus, Save } from "lucide-react";
import { submitMatchAction } from "@/app/actions/game";
import { SubmitButton, inputClass } from "@/components/ui";
import { clampScore, getServer, getWinner, type PlayerSide } from "@/lib/scoring";
import type { RankingProfile } from "@/lib/data";

type FormState = {
  error?: string;
  success?: string;
} | void;

export function GameBoard({
  currentPlayer,
  opponents,
  inviteId,
  invitedOpponentId
}: {
  currentPlayer: RankingProfile | null;
  opponents: RankingProfile[];
  inviteId?: string;
  invitedOpponentId?: string;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    async (_state, formData) => submitMatchAction(formData),
    undefined
  );
  const [playerOneScore, setPlayerOneScore] = useState(0);
  const [playerTwoScore, setPlayerTwoScore] = useState(0);
  const [firstServer, setFirstServer] = useState<PlayerSide | null>(null);
  const [opponentId, setOpponentId] = useState(invitedOpponentId ?? opponents[0]?.id ?? "");

  const opponent = opponents.find((player) => player.id === opponentId) ?? null;
  const score = { playerOne: playerOneScore, playerTwo: playerTwoScore };
  const winner = getWinner(score);
  const serverSide = getServer(firstServer, score);
  const serverName = serverSide === "playerOne" ? currentPlayer?.display_name : serverSide === "playerTwo" ? opponent?.display_name : "Coin flip needed";
  const firstServerId = firstServer === "playerOne" ? currentPlayer?.id : firstServer === "playerTwo" ? opponent?.id : "";

  const winnerName = useMemo(() => {
    if (!winner) {
      return null;
    }

    return winner === "playerOne" ? currentPlayer?.display_name : opponent?.display_name;
  }, [currentPlayer?.display_name, opponent?.display_name, winner]);

  function bump(side: PlayerSide, amount: number) {
    if (side === "playerOne") {
      setPlayerOneScore((scoreValue) => clampScore(scoreValue + amount));
    } else {
      setPlayerTwoScore((scoreValue) => clampScore(scoreValue + amount));
    }
  }

  function flipCoin() {
    setFirstServer(Math.random() > 0.5 ? "playerOne" : "playerTwo");
  }

  return (
    <form action={formAction} className="grid gap-5">
      <input type="hidden" name="playerOneScore" value={playerOneScore} />
      <input type="hidden" name="playerTwoScore" value={playerTwoScore} />
      <input type="hidden" name="firstServerId" value={firstServerId ?? ""} />
      <input type="hidden" name="inviteId" value={inviteId ?? ""} />

      <div className="grid gap-4 rounded-lg bg-white p-4 shadow-panel lg:grid-cols-[1fr_1fr]">
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Opponent
          <select
            className={inputClass}
            name="opponentId"
            value={opponentId}
            onChange={(event) => setOpponentId(event.target.value)}
            required
          >
            {opponents.map((player) => (
              <option key={player.id} value={player.id}>
                {player.display_name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Opponent confirmation PIN
          <input className={inputClass} name="opponentPin" inputMode="numeric" type="password" required />
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr]">
        <ScoreColumn
          label={currentPlayer?.display_name ?? "You"}
          score={playerOneScore}
          isServing={serverSide === "playerOne"}
          onAdd={() => bump("playerOne", 1)}
          onSubtract={() => bump("playerOne", -1)}
        />
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg bg-ink px-5 py-6 text-white shadow-panel">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-300">Serving</p>
          <p className="text-center text-2xl font-black">{serverName}</p>
          <button
            type="button"
            onClick={flipCoin}
            className="focus-ring inline-flex items-center gap-2 rounded-md bg-gold px-4 py-2 font-bold text-ink hover:bg-amber-400"
          >
            <Coins className="h-4 w-4" />
            Coin flip
          </button>
          <p className="max-w-44 text-center text-xs leading-5 text-slate-300">
            Serve switches every two total points.
          </p>
        </div>
        <ScoreColumn
          label={opponent?.display_name ?? "Opponent"}
          score={playerTwoScore}
          isServing={serverSide === "playerTwo"}
          onAdd={() => bump("playerTwo", 1)}
          onSubtract={() => bump("playerTwo", -1)}
        />
      </div>

      <div className="rounded-lg bg-white p-5 shadow-panel">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500">Match status</p>
            <p className="text-xl font-black text-ink">
              {winnerName ? `${winnerName} wins ${playerOneScore}-${playerTwoScore}` : "Play to 11, win by 2"}
            </p>
          </div>
          {state?.error ? <p className="text-sm font-bold text-red-700">{state.error}</p> : null}
          {state?.success ? <p className="text-sm font-bold text-emerald-700">{state.success}</p> : null}
          <SubmitButton disabled={!winner || !firstServer || pending}>
            <Save className="mr-2 h-4 w-4" />
            {pending ? "Submitting..." : "Submit score"}
          </SubmitButton>
        </div>
      </div>
    </form>
  );
}

function ScoreColumn({
  label,
  score,
  isServing,
  onAdd,
  onSubtract
}: {
  label: string;
  score: number;
  isServing: boolean;
  onAdd: () => void;
  onSubtract: () => void;
}) {
  return (
    <section className="rounded-lg bg-white p-5 text-center shadow-panel">
      <div className="flex min-h-10 items-center justify-center gap-2">
        <h2 className="text-xl font-black text-ink">{label}</h2>
        {isServing ? <span className="rounded bg-court px-2 py-1 text-xs font-black text-white">SERVE</span> : null}
      </div>
      <p className="my-8 text-8xl font-black tabular-nums text-ink">{score}</p>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onSubtract}
          className="focus-ring grid h-16 place-items-center rounded-md border border-slate-300 bg-white hover:bg-slate-50"
          aria-label={`Subtract point from ${label}`}
        >
          <Minus className="h-7 w-7" />
        </button>
        <button
          type="button"
          onClick={onAdd}
          className="focus-ring grid h-16 place-items-center rounded-md bg-court text-white hover:bg-teal-700"
          aria-label={`Add point to ${label}`}
        >
          <Plus className="h-7 w-7" />
        </button>
      </div>
    </section>
  );
}
