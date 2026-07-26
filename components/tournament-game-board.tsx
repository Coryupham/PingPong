"use client";

import { useMemo, useRef, useState } from "react";
import { Coins, Minus, Play, Plus, Save, Trophy, X } from "lucide-react";
import { SubmitButton, cn } from "@/components/ui";
import { clampScore, getServer, getWinner, type PlayerSide } from "@/lib/scoring";

type FormState = {
  error?: string;
  success?: string;
} | void;

type TournamentGameBoardProps = {
  tournamentId: string;
  tournamentName: string;
  round: number;
  matchId: string;
  gameId: string;
  teamOneName: string;
  teamTwoName: string;
  playerOne: {
    id: string;
    displayName: string;
    rating: number;
  };
  playerTwo: {
    id: string;
    displayName: string;
    rating: number;
  };
  backHref: string;
};

export function TournamentGameBoard({
  tournamentId,
  tournamentName,
  round,
  matchId,
  gameId,
  teamOneName,
  teamTwoName,
  playerOne,
  playerTwo,
  backHref
}: TournamentGameBoardProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, setState] = useState<FormState>(undefined);
  const [pending, setPending] = useState(false);
  const [playerOneScore, setPlayerOneScore] = useState(0);
  const [playerTwoScore, setPlayerTwoScore] = useState(0);
  const [firstServer, setFirstServer] = useState<PlayerSide | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [showCoinFlipModal, setShowCoinFlipModal] = useState(false);
  const [dismissedWinKey, setDismissedWinKey] = useState<string | null>(null);

  const score = { playerOne: playerOneScore, playerTwo: playerTwoScore };
  const winnerSide = getWinner(score);
  const serverSide = getServer(firstServer, score);
  const serverName =
    serverSide === "playerOne"
      ? playerOne.displayName
      : serverSide === "playerTwo"
        ? playerTwo.displayName
        : "Coin toss needed";
  const firstServerId =
    firstServer === "playerOne" ? playerOne.id : firstServer === "playerTwo" ? playerTwo.id : "";
  const winKey = winnerSide ? `${winnerSide}-${playerOneScore}-${playerTwoScore}-${playerOne.id}-${playerTwo.id}` : null;
  const winnerName = useMemo(() => {
    if (winnerSide === "playerOne") {
      return playerOne.displayName;
    }

    if (winnerSide === "playerTwo") {
      return playerTwo.displayName;
    }

    return null;
  }, [playerOne.displayName, playerTwo.displayName, winnerSide]);
  const showWinnerModal = Boolean(winnerName && winKey && dismissedWinKey !== winKey);

  function bump(side: PlayerSide, amount: number) {
    if (side === "playerOne") {
      setPlayerOneScore((score) => clampScore(score + amount));
    } else {
      setPlayerTwoScore((score) => clampScore(score + amount));
    }
  }

  function startCoinFlip() {
    setPlayerOneScore(0);
    setPlayerTwoScore(0);
    setFirstServer(null);
    setDismissedWinKey(null);
    setShowCoinFlipModal(true);
  }

  function flipCoin() {
    setFirstServer(Math.random() > 0.5 ? "playerOne" : "playerTwo");
    setGameStarted(true);
    setShowCoinFlipModal(false);
  }

  async function submitTournamentGame() {
    if (!formRef.current) {
      return;
    }

    setPending(true);
    setState(undefined);

    try {
      const response = await fetch("/admin/tournaments/score-game", {
        method: "POST",
        body: new FormData(formRef.current)
      });
      const result = (await response.json()) as FormState;
      setState(result);

      if (result?.success) {
        setDismissedWinKey(winKey);
      }
    } catch {
      setState({ error: "Could not record tournament game. Refresh and try again." });
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      ref={formRef}
      onSubmit={(event) => {
        event.preventDefault();
        void submitTournamentGame();
      }}
      className="grid gap-5"
    >
      <input type="hidden" name="tournamentId" value={tournamentId} />
      <input type="hidden" name="round" value={round} />
      <input type="hidden" name="matchId" value={matchId} />
      <input type="hidden" name="gameId" value={gameId} />
      <input type="hidden" name="playerOneId" value={playerOne.id} />
      <input type="hidden" name="playerTwoId" value={playerTwo.id} />
      <input type="hidden" name="firstServerId" value={firstServerId} />
      <input type="hidden" name="playerOneScore" value={playerOneScore} />
      <input type="hidden" name="playerTwoScore" value={playerTwoScore} />

      {!gameStarted ? (
        <section className="grid min-h-[420px] place-items-center rounded-lg border border-line bg-graphite/92 p-4 text-center shadow-panel sm:min-h-[460px] sm:p-6">
          <div className="max-w-xl">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-court/40 bg-court/10 text-court shadow-glow">
              <Play className="h-9 w-9 fill-current" />
            </div>
            <p className="mt-6 text-sm font-black uppercase tracking-[0.18em] text-court">
              {tournamentName} · Round {round}
            </p>
            <h2 className="mt-3 text-4xl font-black text-ink sm:text-5xl">Tournament game</h2>
            <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-mist">
              {playerOne.displayName} from {teamOneName} vs {playerTwo.displayName} from {teamTwoName}. Flip the coin to choose first serve.
            </p>
            {state?.success ? <p className="mt-5 text-sm font-bold text-court">{state.success}</p> : null}
            {state?.error ? <p className="mt-5 text-sm font-bold text-paddle">{state.error}</p> : null}
            <button
              type="button"
              onClick={startCoinFlip}
              className="focus-ring mt-8 inline-flex items-center gap-2 rounded-md bg-court px-7 py-4 text-lg font-black text-night shadow-glow hover:bg-emerald-300"
            >
              <Coins className="h-5 w-5" />
              Flip for serve
            </button>
          </div>
        </section>
      ) : (
        <>
          <section className="rounded-lg border border-line bg-graphite/92 p-3 text-ink shadow-panel sm:p-5">
            <div className="rounded-md border border-court/40 bg-night px-3 py-3 text-center shadow-glow sm:px-5 sm:py-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-court sm:text-sm">Serving</p>
              <p className="mt-1 break-words text-xl font-black sm:text-2xl">{serverName}</p>
              <p className="mt-1 text-xs font-bold leading-5 text-mist sm:text-sm">
                Serve switches every two points, then every point after 10-10.
              </p>
            </div>
            <div className="mt-3 rounded-md border border-line bg-night/60 px-3 py-2 text-center">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-mist">
                {tournamentName} · Round {round}
              </p>
              <p className="mt-1 text-sm font-bold text-ink">
                {teamOneName} vs {teamTwoName}
              </p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:mt-5 sm:gap-4">
              <ScorePanel
                label={playerOne.displayName}
                meta={`${teamOneName} · ${playerOne.rating}`}
                score={playerOneScore}
                isServing={serverSide === "playerOne"}
                onAdd={() => bump("playerOne", 1)}
                onSubtract={() => bump("playerOne", -1)}
              />
              <ScorePanel
                label={playerTwo.displayName}
                meta={`${teamTwoName} · ${playerTwo.rating}`}
                score={playerTwoScore}
                isServing={serverSide === "playerTwo"}
                onAdd={() => bump("playerTwo", 1)}
                onSubtract={() => bump("playerTwo", -1)}
              />
            </div>
          </section>

          <section className="rounded-lg border border-line bg-graphite/92 p-4 shadow-panel sm:p-5">
            <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-mist sm:text-sm">Tournament game status</p>
                <p className="text-lg font-black text-ink sm:text-xl">
                  {winnerName ? `${winnerName} wins ${playerOneScore}-${playerTwoScore}` : "First to 11, win by two"}
                </p>
              </div>
              {winnerName ? (
                <button
                  type="button"
                  onClick={() => setDismissedWinKey(null)}
                  className="focus-ring rounded-md border border-court/40 px-4 py-2 font-black text-court hover:bg-court/10"
                >
                  Show winner
                </button>
              ) : (
                <span className="text-sm font-bold text-mist">Win by two to record</span>
              )}
            </div>
            {state?.error ? <p className="mt-4 text-sm font-bold text-paddle">{state.error}</p> : null}
            {state?.success ? (
              <div className="mt-4 rounded-md border border-court/40 bg-court/10 p-3">
                <p className="flex items-center gap-2 text-sm font-bold text-court">
                  <Trophy className="h-4 w-4" />
                  {state.success}
                </p>
                <a className="mt-3 inline-flex font-black text-ink hover:text-court" href={backHref}>
                  Back to bracket
                </a>
              </div>
            ) : null}
          </section>
        </>
      )}

      <div
        aria-hidden={!showCoinFlipModal}
        className={cn(
          "fixed inset-0 z-30 place-items-center bg-night/78 px-4 backdrop-blur-sm",
          showCoinFlipModal ? "grid" : "hidden"
        )}
      >
        <section className="relative max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-lg border border-court/40 bg-graphite p-4 text-center text-ink shadow-glow sm:p-6">
          <button
            type="button"
            onClick={() => setShowCoinFlipModal(false)}
            className="focus-ring absolute right-3 top-3 rounded-md border border-line p-2 text-mist hover:bg-night hover:text-ink"
            aria-label="Close coin toss popup"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-gold/40 bg-gold/10 text-gold">
            <Coins className="h-8 w-8" />
          </div>
          <p className="mt-5 text-sm font-black uppercase tracking-[0.18em] text-court">Match setup</p>
          <h2 className="mt-2 text-4xl font-black">Flip for serve</h2>
          <div className="mt-5 grid gap-3 text-left">
            <PlayerLineup teamName={teamOneName} playerName={playerOne.displayName} rating={playerOne.rating} />
            <PlayerLineup teamName={teamTwoName} playerName={playerTwo.displayName} rating={playerTwo.rating} />
          </div>
          <p className="mt-4 text-left text-sm leading-6 text-mist">
            The coin toss picks the first server. After that, serve tracking follows ping pong scoring rules automatically.
          </p>
          <button
            type="button"
            onClick={flipCoin}
            className="focus-ring mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-gold px-4 py-3 font-black text-night hover:bg-yellow-300"
          >
            <Coins className="h-5 w-5" />
            Flip coin and start
          </button>
        </section>
      </div>

      {showWinnerModal ? (
        <div className="fixed inset-0 z-30 grid place-items-center bg-night/78 px-4 backdrop-blur-sm">
          <section
            aria-live="polite"
            className="relative max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-lg border border-court/40 bg-graphite p-4 text-center text-ink shadow-glow sm:p-6"
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
              Submit to record this tournament game and update league rankings.
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
                {pending ? "Recording..." : "Record game"}
              </SubmitButton>
            </div>
          </section>
        </div>
      ) : null}
    </form>
  );
}

function PlayerLineup({ teamName, playerName, rating }: { teamName: string; playerName: string; rating: number }) {
  return (
    <div className="rounded-md border border-line bg-night/70 p-3">
      <p className="font-black text-ink">{playerName}</p>
      <p className="text-xs font-bold text-mist">
        {teamName} · {rating}
      </p>
    </div>
  );
}

function ScorePanel({
  label,
  meta,
  score,
  isServing,
  onAdd,
  onSubtract
}: {
  label: string;
  meta: string;
  score: number;
  isServing: boolean;
  onAdd: () => void;
  onSubtract: () => void;
}) {
  return (
    <div className="min-w-0 rounded-md border border-line bg-graphite p-3 text-center sm:p-5">
      <div className="flex min-h-16 flex-col items-center justify-center gap-1">
        <h2 className="max-w-full break-words text-base font-black leading-tight text-ink sm:text-xl">{label}</h2>
        {isServing ? (
          <span className="rounded bg-court px-2 py-1 text-[0.65rem] font-black leading-none text-night shadow-glow sm:text-xs">
            SERVE
          </span>
        ) : null}
        <p className="text-xs font-bold text-mist">{meta}</p>
      </div>
      <p className="my-4 text-6xl font-black tabular-nums leading-none text-ink drop-shadow-[0_0_22px_rgba(46,213,115,0.18)] sm:my-7 sm:text-8xl">
        {score}
      </p>
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onSubtract}
          className="focus-ring grid h-12 place-items-center rounded-md border border-line bg-night text-ink hover:bg-slate-900 sm:h-16"
          aria-label={`Subtract point from ${label}`}
        >
          <Minus className="h-6 w-6 sm:h-7 sm:w-7" />
        </button>
        <button
          type="button"
          onClick={onAdd}
          className="focus-ring grid h-12 place-items-center rounded-md bg-court text-night shadow-glow hover:bg-emerald-300 sm:h-16"
          aria-label={`Add point to ${label}`}
        >
          <Plus className="h-6 w-6 sm:h-7 sm:w-7" />
        </button>
      </div>
    </div>
  );
}
