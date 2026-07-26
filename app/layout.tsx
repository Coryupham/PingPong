import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";
import { logoutAction } from "@/app/actions/auth";
import { getCurrentProfile } from "@/lib/data";

export const metadata: Metadata = {
  title: "Ping Pong League",
  description: "Score matches, confirm opponents, and track league rankings.",
  icons: {
    icon: [{ url: "/ping-pong-logo.svg", type: "image/svg+xml" }]
  }
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  return (
    <html lang="en">
      <body>
        <header className="sticky top-0 z-20 border-b border-line bg-night/88 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 py-2.5 sm:px-4 sm:py-3">
            <Link href="/" className="flex min-h-11 min-w-0 items-center gap-2 font-black text-ink">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-court text-sm font-black text-night shadow-glow">
                <Image src="/ping-pong-logo.svg" alt="" width={28} height={28} priority />
              </span>
              <span className="truncate text-sm sm:text-base">Ping Pong League</span>
            </Link>
            {profile ? (
              <div className="flex shrink-0 items-center gap-2 text-sm font-bold">
                <span className="hidden max-w-40 truncate rounded-md border border-line bg-graphite px-3 py-2 text-ink sm:inline">
                  {profile.display_name}
                </span>
                <form action={logoutAction}>
                  <button className="min-h-11 rounded-md border border-line px-3 font-bold text-mist hover:bg-graphite hover:text-ink">
                    Logout
                  </button>
                </form>
              </div>
            ) : (
              <Link
                className="flex min-h-11 shrink-0 items-center rounded-md bg-court px-3 text-sm font-black text-night shadow-glow hover:bg-emerald-300"
                href="/login"
              >
                Admin login
              </Link>
            )}
          </div>
          <div className="border-t border-line/70">
            <nav
              aria-label="Primary navigation"
              className="mobile-scroll mx-auto flex max-w-6xl gap-1 overflow-x-auto px-3 py-2 text-sm font-bold text-mist sm:px-4"
            >
              <Link className="flex min-h-11 shrink-0 items-center rounded-md px-3 hover:bg-graphite hover:text-ink" href="/game">
                Game
              </Link>
              <Link className="flex min-h-11 shrink-0 items-center rounded-md px-3 hover:bg-graphite hover:text-ink" href="/rankings">
                Rankings
              </Link>
              <Link className="flex min-h-11 shrink-0 items-center rounded-md px-3 hover:bg-graphite hover:text-ink" href="/tournaments">
                Tournaments
              </Link>
              {profile?.is_admin ? (
                <>
                  <Link className="flex min-h-11 shrink-0 items-center rounded-md px-3 hover:bg-graphite hover:text-ink" href="/admin">
                    Admin
                  </Link>
                  <Link className="flex min-h-11 shrink-0 items-center rounded-md px-3 hover:bg-graphite hover:text-ink" href="/admin/tournaments">
                    Manage tournaments
                  </Link>
                </>
              ) : null}
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
