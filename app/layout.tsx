import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { logoutAction } from "@/app/actions/auth";
import { getCurrentProfile } from "@/lib/data";

export const metadata: Metadata = {
  title: "Ping Pong League",
  description: "Score matches, invite opponents, and track league rankings."
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  return (
    <html lang="en">
      <body>
        <header className="border-b border-slate-200/80 bg-white/85 backdrop-blur">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2 font-semibold text-ink">
              <span className="grid h-9 w-9 place-items-center rounded-md bg-court text-sm font-black text-white">
                PP
              </span>
              <span>Ping Pong League</span>
            </Link>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <Link className="rounded-md px-3 py-2 hover:bg-slate-100" href="/game">
                Game
              </Link>
              <Link className="rounded-md px-3 py-2 hover:bg-slate-100" href="/rankings">
                Rankings
              </Link>
              <Link className="rounded-md px-3 py-2 hover:bg-slate-100" href="/invites">
                Invites
              </Link>
              {profile?.is_admin ? (
                <Link className="rounded-md px-3 py-2 hover:bg-slate-100" href="/admin">
                  Admin
                </Link>
              ) : null}
              {profile ? (
                <>
                  <span className="hidden rounded-md bg-slate-100 px-3 py-2 text-slate-600 sm:inline">
                    {profile.display_name}
                  </span>
                  <form action={logoutAction}>
                    <button className="rounded-md border border-slate-300 px-3 py-2 font-bold hover:bg-slate-100">
                      Logout
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link className="rounded-md px-3 py-2 hover:bg-slate-100" href="/login">
                    Login
                  </Link>
                  <Link className="rounded-md bg-ink px-3 py-2 font-bold text-white hover:bg-slate-700" href="/sign-up">
                    Sign up
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
