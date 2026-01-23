import { useState } from "react";
import { useAuth } from "../auth/AuthContext";

export default function RegisterPage() {
  const { register } = useAuth();

  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const AUTH_GLOW = [34, 211, 238];
  const [r, g, b] = AUTH_GLOW;

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await register(form);
      setMessage(res.message);
    } catch (err) {
      setError(err.message || "Registration failed");
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
            <h1 className="text-2xl font-bold mb-4">Register</h1>

            {message && <p className="text-green-500 mb-2">{message}</p>}
            {error && <p className="text-red-500 mb-2">{error}</p>}

            <form noValidate onSubmit={handleSubmit} className="space-y-4">
              <input
                className="w-full p-2 bg-neutral-900 border border-neutral-700"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />

              <input
                className="w-full p-2 bg-neutral-900 border border-neutral-700"
                placeholder="Username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
              />

             <div className="relative">
              <input
                className="w-full p-2 pr-10 bg-neutral-900 border border-neutral-700"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="
                  absolute
                  inset-y-0
                  right-2
                  flex
                  items-center
                  text-neutral-400
                  hover:text-neutral-200
                  transition
                  hover:drop-shadow-[0_0_6px_rgba(34,211,238,0.6)]
                "
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>

              <button
                type="submit"
                disabled={loading}
                className="
                  w-full
                  bg-indigo-600
                  py-2
                  font-semibold
                  disabled:opacity-60
                  disabled:cursor-not-allowed
                  transition
                "
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="
                        h-4 w-4
                        animate-spin
                        rounded-full
                        border-2 border-white/30
                        border-t-white
                      "
                    />
                    Registering…
                  </span>
                ) : (
                  "Register"
                )}
              </button>
            </form>
          </div>  
        </div>
    </div>
  );
}
