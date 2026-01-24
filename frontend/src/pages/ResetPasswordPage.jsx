import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { apiPost } from "../services/apiClient";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const token = params.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <div className="min-h-dvh flex items-center justify-center text-neutral-300">
        Invalid or missing reset token.
      </div>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await apiPost(
        `/api/auth/reset-password?token=${encodeURIComponent(token)}`,
        { password }
      );

      navigate("/login?reset=1");
    } catch (err) {
      setError(err.message || "Password reset failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-dvh">
      <div className="mainpage-bg" />
      <div className="page-veil" />

      <div className="relative z-20 max-w-md mx-auto mt-16">
        <div className="rounded-xl bg-neutral-950 border border-neutral-800 p-8">
          <h1 className="text-2xl font-bold mb-4">Reset Password</h1>

          {error && <p className="text-red-500 mb-3">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 bg-neutral-900 border border-neutral-700"
              required
            />

            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-2 bg-neutral-900 border border-neutral-700"
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 py-2 disabled:opacity-60"
            >
              {loading ? "Resetting…" : "Reset Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
