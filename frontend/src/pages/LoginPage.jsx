import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const emailVerified = searchParams.get("verified") === "1";

  const AUTH_GLOW = [34, 211, 238];
  const [r, g, b] = AUTH_GLOW;

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login({ email, password });
      navigate("/");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-dvh">
      <div className="mainpage-bg" />
      <div className="page-veil" />
          <div className="relative z-20 max-w-md mx-auto mt-12">
            <div className="flex justify-center mb-10">
              <h1
                className="
                  text-6xl
                  sm:text-7xl
                  md:text-8xl
                  font-light
                  tracking-widest
                  text-neutral-100
                  text-center
                "
                style={{ fontFamily: "var(--font-buda)" }}
              >
                SPELLFRAME
              </h1>
            </div>
            <div
              className="
                relative
                rounded-xl
                bg-neutral-950
                border
                p-8
              "
              style={{
                borderColor: `rgba(${r},${g},${b},0.55)`,
                boxShadow: `
                  0 0 0 1px rgba(${r},${g},${b},0.45),
                  0 0 40px rgba(${r},${g},${b},0.55),
                  0 0 120px rgba(${r},${g},${b},0.35)
                `,
              }}
            >
              <h1 className="text-2xl font-bold mb-4">Login</h1>

              {emailVerified && (
                <p className="mb-3 text-green-400">
                  Email verified successfully. You can now log in.
                </p>
              )}

              {error && <p className="text-red-500 mb-3">{error}</p>}

              <form noValidate onSubmit={handleSubmit} className="space-y-4">
                <input
                  className="w-full p-2 bg-neutral-900 border border-neutral-700"
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <input
                  className="w-full p-2 bg-neutral-900 border border-neutral-700"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 py-2 disabled:opacity-60"
                >
                  {loading ? "Logging in…" : "Login"}
                </button>
              </form>

              <div className="mt-6 text-sm text-neutral-400">
                <p>
                  Don’t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/register")}
                    className="text-indigo-400 hover:underline"
                  >
                    Sign up here
                  </button>
                </p>
              </div>
            </div>  
          </div>
    </div>
  );
}
