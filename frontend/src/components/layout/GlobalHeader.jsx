import { Link } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../auth/AuthContext";

export default function GlobalHeader({
  globalQuery,
  setGlobalQuery,
  onSearch,
}) {
  const { user, isAuthenticated, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-800 bg-neutral-950">
      <div className="mx-auto max-w-screen-2xl px-4 py-3 flex flex-wrap items-center justify-center gap-3 md:justify-between min-w-0">
        <div className="text-2xl font-buda text-neutral-100 shrink-0 ml-0 sm:ml-0 md:ml-17">
          <Link to="/">SPELLFRAME</Link>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm shrink-0 mr-0 sm:mr-0 md:mr-17">
          {!isAuthenticated ? (
            <>
              {/* Desktop auth */}
              <div className="hidden md:flex items-center gap-3">
                <Link to="/login" className="text-neutral-300 hover:text-white">
                  Log in
                </Link>

                <Link
                  to="/register"
                  className="rounded bg-indigo-600 px-3 py-1 text-white hover:bg-indigo-500"
                >
                  Sign up
                </Link>
              </div>

              {/* Mobile auth */}
              <div className="flex md:hidden pb-1.5 items-center gap-3">
                <button
                  onClick={() => setMenuOpen(v => !v)}
                  className="text-2xl leading-none text-neutral-300 hover:text-white"
                  aria-label="Open menu"
                >
                  ☰
                </button>
                <Link
                  to="/login"
                  className="text-sm text-neutral-300 hover:text-white"
                >
                  Log in
                </Link>
              </div>
            </>
          ) : (
            <>
              <span className="flex items-center gap-2 text-neutral-400 min-w-0">
                <span>Welcome,</span>
                <div className="h-5 w-5 rounded-full overflow-hidden border border-neutral-700 bg-neutral-800 shrink-0">
                  {user?.avatar?.image ? (
                    <div
                      className="h-full w-full"
                      style={{
                        backgroundImage: `url(${user.avatar.image})`,
                        backgroundSize: `${(user.avatar.zoom ?? 1) * 100}%`,
                        backgroundPosition: `${(user.avatar.x ?? 0.5) * 100}% ${
                          (user.avatar.y ?? 0.5) * 100
                        }%`,
                        backgroundRepeat: "no-repeat",
                      }}
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-[10px] text-neutral-500">
                      ?
                    </div>
                  )}
                </div>
                <span className="text-neutral-200 font-medium truncate">
                  {user?.username || "Commander"}
                </span>
              </span>
              <div className="hidden md:flex items-center gap-3">
                <Link
                  to="/profile"
                  className="text-indigo-400 hover:text-indigo-300"
                >
                  Profile
                </Link>

                <button
                  onClick={logout}
                  className="text-neutral-400 hover:text-red-400"
                >
                  Logout
                </button>
              </div>
              <button
                onClick={() => setMenuOpen(v => !v)}
                className="md:hidden text-neutral-300 hover:text-white"
                aria-label="Open menu"
              >
                ☰
              </button>
            </>
          )}
        </div>
      </div>
      {menuOpen && (
        <div className="md:hidden border-t border-neutral-800 bg-neutral-950 px-4 py-3 flex flex-col gap-3 text-sm text-neutral-300">
          {!isAuthenticated ? (
            <>
              <Link to="/login">Log in</Link>
              <Link to="/register">Sign up</Link>
            </>
          ) : (
            <>
              <Link to="/profile">Profile</Link>
              <button onClick={logout} className="text-left">
                Logout
              </button>
            </>
          )}

          <hr className="border-neutral-800" />

          <Link to="/">Search Cards & Decks</Link>
          <Link to="/commander">Build a Deck</Link>
          <Link to="/faq">Commander FAQ</Link>
        </div>
      )}
      <nav className="hidden md:block border-t border-neutral-800">
        <div className="mx-auto max-w-screen-2xl px-4 py-2 flex flex-wrap gap-4 text-sm text-neutral-400">
          <Link to="/" className="hover:text-neutral-100">
            Search Cards & Decks
          </Link>
          <Link to="/commander" className="hover:text-neutral-100">
            Build a Deck
          </Link>
          <Link
            to="/faq"
            className="hover:text-neutral-100"
          >
            Commander FAQ
          </Link>
        </div>
      </nav>
    </header>
  );
}
