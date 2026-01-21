import { useEffect, useState } from "react";

export default function DeleteAccountModal({
  isOpen,
  onClose,
  onSubmit,
}) {
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    function onKey(e) {
      if (e.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (confirmText !== "DELETE") {
      setError('You must type "DELETE" to confirm.');
      return;
    }

    setLoading(true);

    try {
      await onSubmit?.({ password });

      setPassword("");
      setConfirmText("");
      onClose();
    } catch (err) {
      setError(err.message || "Account deletion failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="max-w-md w-full bg-neutral-950 border border-red-800 p-6">
        <h2 className="text-2xl font-bold mb-2 text-red-400">
          Delete Account
        </h2>

        <p className="text-sm text-neutral-400 mb-4">
          This action is <strong className="text-red-400">permanent</strong>.
          All decks, collections, and profile data will be deleted.
        </p>

        {error && <p className="text-red-500 mb-3">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            className="w-full p-2 bg-neutral-900 border border-neutral-700"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <input
            className="w-full p-2 bg-neutral-900 border border-neutral-700"
            type="text"
            placeholder='Type "DELETE" to confirm'
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="
              w-full
              bg-red-700
              py-2
              disabled:opacity-60
              hover:bg-red-600
            "
          >
            {loading ? "Deleting…" : "Delete Account"}
          </button>
        </form>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 text-sm text-neutral-400 hover:underline"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
