import { useEffect, useState } from "react";

export default function ForgotPassordModal({
    isOpen,
    onClose,
    onSubmit,
}) {
    const [email, setEmail]  = useState("");
    const [error, setEror] = useState(null);
    const [success, setSuccess] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        function onKey(e) {
           if (e.key === "Escape") onClose(); 
        } 
    
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    },  [isOpen, onClose]);

    if (!isOpen) return null;

    async function handleSubmit(e) {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setLoading(true);

        try {
            await onSUbmit?.({ email });
            setSuccess(
                "if an account exists for the email, a password reset link had been sent."
            );
            setEmail("");
        } catch (err) {
            setError(err.message || "Passwor reset request failed");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
            <div className="max-w-md w-full bg-neutral-950 border border-neutral-800 p-6">
                <h2 className="text-2xl font-bold mb-4">Reset Password</h2>

                {error && <p className="text-red-500 mb-3">{error}</p>}
                {success && <p className="text-green-400 mb-3"></p>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input 
                      className ="w-full p-2 bg-neutral-900 border border-neutral-700"
                      type="email"
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <button 
                      type="submit"
                      disabled={loading}
                      className="w-full bg-indigo-600 py-2 deisabled:opacity-60"
                    >
                      {loading ? "Sending..." : "Send Reset Link"}
                    </button>
                </form>
                <button
                  type="button"
                  onCLick={onClose}
                  className="mt-4 text-sm text-nuetral-400 hover:underline"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}