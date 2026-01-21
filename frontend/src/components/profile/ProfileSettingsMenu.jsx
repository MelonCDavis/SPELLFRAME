import { useEffect, useRef, useState } from "react";

export default function ProfileSettingsMenu({
  onAccount,
  onPassword,
  onDelete,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="
          p-2
          rounded-md
          border border-neutral-800
          bg-neutral-900
          hover:bg-neutral-800
          transition
        "
        aria-label="Profile settings"
      >
        ⚙
      </button>

      {open && (
        <div
          className="
            absolute
            right-0
            mt-2
            w-48
            rounded-md
            border border-neutral-800
            bg-neutral-950
            shadow-xl
            z-50
          "
        >
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-800"
            onClick={() => {
              setOpen(false);
              onAccount();
            }}
          >
            Account Settings
          </button>

          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-800"
            onClick={() => {
              setOpen(false);
              onPassword();
            }}
          >
            Change Password
          </button>

          <div className="my-1 border-t border-neutral-800" />

          <button
            className="
              w-full
              px-4 py-2
              text-left
              text-sm
              text-red-400
              hover:bg-red-900/20
            "
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
          >
            Delete Account
          </button>
        </div>
      )}
    </div>
  );
}
