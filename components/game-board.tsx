"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { Coins, Minus, Play, Plus, Save, Trophy, X } from "lucide-react";
import { submitMatchAction, verifyPlayersAction } from "@/app/actions/game";
import { SubmitButton, cn, inputClass } from "@/components/ui";
import { clampScore, getServer, getWinner, type PlayerSide } from "@/lib/scoring";

type FormState = {
  error?: string;
  success?: string;
} | void;

type VerifiedPlayer = {
  displayName: string;
  email: string;
};

export function GameBoard() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    async (_state, formData) => submitMatchAction(formData),
    undefined
  );
  const [playerOneScore, setPlayerOneScore] = useState(0);
  const [playerTwoScore, setPlayerTwoScore] = useState(0);
  const [firstServer, setFirstServer] = useState<PlayerSide | null>(null);
  const [playerOneEmail, setPlayerOneEmail] = useState("");
  const [playerTwoEmail, setPlayerTwoEmail] = useState("");
  const [playerOnePin, setPlayerOnePin] = useState("");
  const [playerTwoPin, setPlayerTwoPin] = useState("");
  const [verifiedPlayers, setVerifiedPlayers] = useState<{
    playerOne: VerifiedPlayer;
    playerTwo: VerifiedPlayer;
  } | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [showCoinFlipModal, setShowCoinFlipModal] = useState(false);
  const [dismissedWinKey, setDismissedWinKey] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const playerOne = verifiedPlayers?.playerOne ?? null;
  const playerTwo = verifiedPlayers?.playerTwo ?? null;
  const score = { playerOne: playerOneScore, playerTwo: playerTwoScore };
  const winner = getWinner(score);
  const serverSide = getServer(firstServer, score);
  const serverName =
    serverSide === "playerOne"
      ? playerOne?.displayName
      : serverSide === "playerTwo"
        ? playerTwo?.displayName
        : "Coin flip needed";
  const firstServerEmail =
    firstServer === "playerOne" ? playerOneEmail : firstServer === "playerTwo" ? playerTwoEmail : "";
  const winKey = winner ? `${winner}-${playerOneScore}-${playerTwoScore}-${playerOneEmail}-${playerTwoEmail}` : null;

  const winnerName = useMemo(() => {
    if (!winner) {
      return null;
    }

    return winner === "playerOne" ? playerOne?.displayName : playerTwo?.displayName;
  }, [playerOne?.displayName, playerTwo?.displayName, winner]);
  const showWinnerModal = Boolean(winnerName && winKey && dismissedWinKey !== winKey);

  useEffect(() => {
    if (!state?.success) {
      return;
    }

    setPlayerOneScore(0);
    setPlayerTwoScore(0);
    setFirstServer(null);
    setGameStarted(false);
    setShowCoinFlipModal(false);
    setPlayerOneEmail("");
    setPlayerTwoEmail("");
    setPlayerOnePin("");
    setPlayerTwoPin("");
    setVerifiedPlayers(null);
    setVerificationError(null);
    setDismissedWinKey(null);
    formRef.current?.reset();
  }, [state?.success]);

  function bump(side: PlayerSide, amount: number) {
    if (side === "playerOne") {
      setPlayerOneScore((scoreValue) => clampScore(scoreValue + amount));
    } else {
      setPlayerTwoScore((scoreValue) => clampScore(scoreValue + amount));
    }
  }

  function startCoinFlip() {
    setPlayerOneScore(0);
    setPlayerTwoScore(0);
    setFirstServer(null);
    setVerifiedPlayers(null);
    setVerificationError(null);
    setDismissedWinKey(null);
    setShowCoinFlipModal(true);
  }

  async function verifyAndFlipCoin() {
    setVerifying(true);
    setVerificationError(null);
    const formData = new FormData();
    formData.set("playerOneEmail", playerOneEmail);
    formData.set("playerTwoEmail", playerTwoEmail);
    formData.set("playerOnePin", playerOnePin);
    formData.set("playerTwoPin", playerTwoPin);
    const result = await verifyPlayersAction(formData);
    setVerifying(false);

    if ("error" in result && result.error) {
      setVerificationError(result.error);
      return;
    }

    if (!result.players) {
      setVerificationError("Could not verify players.");
      return;
    }

    setVerifiedPlayers(result.players);
    setFirstServer(Math.random() > 0.5 ? "playerOne" : "playerTwo");
    setGameStarted(true);
    setShowCoinFlipModal(false);
  }

  return (
    <form ref={formRef} action={formAction} className="grid gap-5">
      <input type="hidden" name="playerOneScore" value={playerOneScore} />
      <input type="hidden" name="playerTwoScore" value={playerTwoScore} />
      <input type="hidden" name="playerOneEmail" value={playerOneEmail} />
      <input type="hidden" name="playerTwoEmail" value={playerTwoEmail} />
      <input type="hidden" name="playerOnePin" value={playerOnePin} />
      <input type="hidden" name="playerTwoPin" value={playerTwoPin} />
      <input type="hidden" name="firstServerEmail" value={firstServerEmail} />

      {!gameStarted ? (
        <section className="grid min-h-[520px] place-items-center rounded-lg border border-line bg-graphite/92 p-6 text-center shadow-panel">
          <div className="max-w-xl">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-court/40 bg-court/10 text-court shadow-glow">
              <Play className="h-9 w-9 fill-current" />
            </div>
            <p className="mt-6 text-sm font-black uppercase tracking-[0.18em] text-court">Ready at the table</p>
            <h2 className="mt-3 text-5xl font-black text-ink">Start a game</h2>
            <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-mist">
              Players do not need to sign in. Enter both player emails and PINs, verify the match, then flip for serve.
            </p>
            {state?.success ? <p className="mt-5 text-sm font-bold text-court">{state.success}</p> : null}
            {state?.error ? <p className="mt-5 text-sm font-bold text-paddle">{state.error}</p> : null}
            <button
              type="button"
              onClick={startCoinFlip}
              className="focus-ring mt-8 inline-flex items-center gap-2 rounded-md bg-court px-7 py-4 text-lg font-black text-night shadow-glow hover:bg-emerald-300"
            >
              <Play className="h-5 w-5 fill-current" />
              Play game
            </button>
          </div>
        </section>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr]">
            <ScoreColumn
              label={playerOne?.displayName ?? "Player 1"}
              score={playerOneScore}
              isServing={serverSide === "playerOne"}
              onAdd={() => bump("playerOne", 1)}
              onSubtract={() => bump("playerOne", -1)}
            />
            <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-court/40 bg-night px-5 py-6 text-ink shadow-glow">
              <p className="text-sm font-black uppercase tracking-[0.16em] text-court">Serving</p>
              <p className="text-center text-2xl font-black">{serverName}</p>
              <p className="text-center text-sm font-bold text-mist">
                {playerOne?.displayName ?? "Player 1"} vs {playerTwo?.displayName ?? "Player 2"}
              </p>
              <p className="max-w-44 text-center text-xs leading-5 text-mist">
                Serve switches every two points, then every point after 10-10.
              </p>
            </div>
            <ScoreColumn
              label={playerTwo?.displayName ?? "Player 2"}
              score={playerTwoScore}
              isServing={serverSide === "playerTwo"}
              onAdd={() => bump("playerTwo", 1)}
              onSubtract={() => bump("playerTwo", -1)}
            />
          </div>

          <div className="rounded-lg border border-line bg-graphite/92 p-5 shadow-panel">
            <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.14em] text-mist">Match status</p>
                <p className="text-xl font-black text-ink">
                  {winnerName ? `${winnerName} wins ${playerOneScore}-${playerTwoScore}` : "First to 11, win by two"}
                </p>
              </div>
              {winner ? (
                <button
                  type="button"
                  onClick={() => setDismissedWinKey(null)}
                  className="focus-ring rounded-md border border-court/40 px-4 py-2 font-black text-court hover:bg-court/10"
                >
                  Show winner
                </button>
              ) : (
                <span className="text-sm font-bold text-mist">Win by two to submit</span>
              )}
            </div>
            {state?.error ? <p className="mt-4 text-sm font-bold text-paddle">{state.error}</p> : null}
            {state?.success ? <p className="mt-4 text-sm font-bold text-court">{state.success}</p> : null}
          </div>
        </>
      )}

      <div
        aria-hidden={!showCoinFlipModal}
        className={cn(
          "fixed inset-0 z-30 place-items-center bg-night/78 px-4 backdrop-blur-sm",
          showCoinFlipModal ? "grid" : "hidden"
        )}
      >
          <section className="relative w-full max-w-md overflow-hidden rounded-lg border border-court/40 bg-graphite p-6 text-center text-ink shadow-glow">
            <button
              type="button"
              onClick={() => setShowCoinFlipModal(false)}
              className="focus-ring absolute right-3 top-3 rounded-md border border-line p-2 text-mist hover:bg-night hover:text-ink"
              aria-label="Close coin flip popup"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-gold/40 bg-gold/10 text-gold">
              <Coins className="h-8 w-8" />
            </div>
            <p className="mt-5 text-sm font-black uppercase tracking-[0.18em] text-court">Match setup</p>
            <h2 className="mt-2 text-4xl font-black">Flip for serve</h2>
            <label className="mt-6 grid gap-2 text-left text-sm font-bold text-mist">
              Player 1 email
              <input
                className={inputClass}
                type="email"
                value={playerOneEmail}
                onChange={(event) => setPlayerOneEmail(event.target.value.toLowerCase())}
                placeholder="player1@example.com"
                required
              />
            </label>
            <label className="mt-4 grid gap-2 text-left text-sm font-bold text-mist">
              Player 2 email
              <input
                className={inputClass}
                type="email"
                value={playerTwoEmail}
                onChange={(event) => setPlayerTwoEmail(event.target.value.toLowerCase())}
                placeholder="player2@example.com"
                required
              />
            </label>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2 text-left text-sm font-bold text-mist">
                Player 1 PIN
                <input
                  className={inputClass}
                  value={playerOnePin}
                  onChange={(event) => setPlayerOnePin(event.target.value)}
                  inputMode="numeric"
                  type="password"
                  required
                />
              </label>
              <label className="grid gap-2 text-left text-sm font-bold text-mist">
                Player 2 PIN
                <input
                  className={inputClass}
                  value={playerTwoPin}
                  onChange={(event) => setPlayerTwoPin(event.target.value)}
                  inputMode="numeric"
                  type="password"
                  required
                />
              </label>
            </div>
            {verificationError ? (
              <p className="mt-4 text-left text-sm font-bold text-paddle">{verificationError}</p>
            ) : null}
            {verifiedPlayers ? (
              <p className="mt-4 text-left text-sm font-bold text-court">
                Verified {verifiedPlayers.playerOne.displayName} vs {verifiedPlayers.playerTwo.displayName}
              </p>
            ) : null}
            <p className="mt-4 text-left text-sm leading-6 text-mist">
              The match starts only after both players are verified on the roster.
            </p>
            <button
              type="button"
              onClick={verifyAndFlipCoin}
              disabled={
                verifying ||
                !playerOneEmail ||
                !playerTwoEmail ||
                !playerOnePin ||
                !playerTwoPin ||
                playerOneEmail === playerTwoEmail
              }
              className="focus-ring mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-gold px-4 py-3 font-black text-night hover:bg-yellow-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            >
              <Coins className="h-5 w-5" />
              {verifying ? "Verifying..." : "Verify, flip, and start"}
            </button>
          </section>
        </div>

      {showWinnerModal ? (
        <div className="fixed inset-0 z-30 grid place-items-center bg-night/78 px-4 backdrop-blur-sm">
          <section
            aria-live="polite"
            className="relative w-full max-w-md overflow-hidden rounded-lg border border-court/40 bg-graphite p-6 text-center text-ink shadow-glow"
          >
            <button
              type="button"
              onClick={() => setDismissedWinKey(winKey)}
              className="focus-ring absolute right-3 top-3 rounded-md border border-line p-2 text-mist hover:bg-night hover:text-ink"
              aria-label="Dismiss winner popup"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-court/40 bg-court/10 text-court">
              <Trophy className="h-8 w-8" />
            </div>
            <p className="mt-5 text-sm font-black uppercase tracking-[0.18em] text-court">Game over</p>
            <h2 className="mt-2 text-4xl font-black">{winnerName} wins</h2>
            <p className="mt-3 text-6xl font-black tabular-nums">
              {playerOneScore}-{playerTwoScore}
            </p>
            <p className="mx-auto mt-4 max-w-xs text-sm leading-6 text-mist">
              The players were verified before the match. Submit to lock this score into rankings.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setDismissedWinKey(winKey)}
                className="focus-ring rounded-md border border-line px-4 py-3 font-bold text-mist hover:bg-night hover:text-ink"
              >
                Keep editing
              </button>
              <SubmitButton disabled={!firstServer || pending} className="py-3">
                <Save className="mr-2 h-4 w-4" />
                {pending ? "Submitting..." : "Submit score"}
              </SubmitButton>
            </div>
          </section>
        </div>
      ) : null}
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
    <section className="rounded-lg border border-line bg-graphite/92 p-5 text-center shadow-panel">
      <div className="flex min-h-10 items-center justify-center gap-2">
        <h2 className="text-xl font-black text-ink">{label}</h2>
        {isServing ? <span className="rounded bg-court px-2 py-1 text-xs font-black text-night shadow-glow">SERVE</span> : null}
      </div>
      <p className="my-8 text-8xl font-black tabular-nums text-ink drop-shadow-[0_0_22px_rgba(46,213,115,0.18)]">{score}</p>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onSubtract}
          className="focus-ring grid h-16 place-items-center rounded-md border border-line bg-night text-ink hover:bg-slate-900"
          aria-label={`Subtract point from ${label}`}
        >
          <Minus className="h-7 w-7" />
        </button>
        <button
          type="button"
          onClick={onAdd}
          className="focus-ring grid h-16 place-items-center rounded-md bg-court text-night shadow-glow hover:bg-emerald-300"
          aria-label={`Add point to ${label}`}
        >
          <Plus className="h-7 w-7" />
        </button>
      </div>
    </section>
  );
}
