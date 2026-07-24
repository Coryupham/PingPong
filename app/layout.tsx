import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { logoutAction } from "@/app/actions/auth";
import { getCurrentProfile } from "@/lib/data";

export const metadata: Metadata = {
  title: "Ping Pong League",
  description: "Score matches, confirm opponents, and track league rankings.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🏓</text></svg>"
  }
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  return (
    <html lang="en">
      <body>
        <header className="sticky top-0 z-20 border-b border-line bg-night/88 backdrop-blur">
          <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
            <Link href="/" className="flex items-center gap-2 font-black text-ink">
              <span className="grid h-9 w-9 place-items-center rounded-md bg-court text-sm font-black text-night shadow-glow">
                🏓
              </span>
              <span>Ping Pong League</span>
            </Link>
            <div className="flex flex-wrap items-center justify-end gap-2 text-sm font-bold text-mist">
              <Link className="rounded-md px-3 py-2 hover:bg-graphite hover:text-ink" href="/game">
                Game
              </Link>
              <Link className="rounded-md px-3 py-2 hover:bg-graphite hover:text-ink" href="/rankings">
                Rankings
              </Link>
              <Link className="rounded-md px-3 py-2 hover:bg-graphite hover:text-ink" href="/tournaments">
                Tournaments
              </Link>
              {profile?.is_admin ? (
                <>
                  <Link className="rounded-md px-3 py-2 hover:bg-graphite hover:text-ink" href="/admin">
                    Admin
                  </Link>
                  <Link className="rounded-md px-3 py-2 hover:bg-graphite hover:text-ink" href="/admin/tournaments">
                    Manage tournaments
                  </Link>
                </>
              ) : null}
              {profile ? (
                <>
                  <span className="hidden rounded-md border border-line bg-graphite px-3 py-2 text-ink sm:inline">
                    {profile.display_name}
                  </span>
                  <form action={logoutAction}>
                    <button className="rounded-md border border-line px-3 py-2 font-bold text-mist hover:bg-graphite hover:text-ink">
                      Logout
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link className="rounded-md bg-court px-3 py-2 font-black text-night shadow-glow hover:bg-emerald-300" href="/login">
                    Admin login
                  </Link>
                </>
              )}
            </div>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
