import { useEffect, useRef } from "react";

export default function DeckVisibilityModal({
  step = "choice",
  onMakePublic,
  onChoosePrivate,
  onConfirmPrivate,
}) {
  const formRef = useRef(null);

  useEffect(() => {
    formRef.current?.focus();
  }, []);

  return (
    <div className="fixed inset-0 z-999 flex items-center justify-center bg-black/70 px-4">
      
        <form
          ref={formRef}
          tabIndex={-1}
          onSubmit={(e) => {
            e.preventDefault();
            onMakePublic();
          }}
          className="w-full max-w-sm rounded-md border border-neutral-800 bg-neutral-900 p-5 space-y-4"
        >

          {step === "choice" ? (
            <>
              <h3 className="text-lg font-semibold text-neutral-200">
                Your deck is complete!
              </h3>

              <p className="text-sm text-neutral-400">
                Would you like this deck to be Public or Private?
              </p>

              <div className="flex flex-col gap-2">
                <button
                  type="submit"
                  className="rounded bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                >
                  🌐 Make Public
                </button>

                <button
                  type="button"
                  onClick={onChoosePrivate}
                  className="rounded border border-neutral-700 py-2 text-sm text-neutral-300 hover:bg-neutral-800"
                >
                  🔒 Keep Private
                </button>
              </div>
            </>
          ) : (
            <>
              <h3 className="text-lg font-semibold text-neutral-200">
                Awww c’mon 😏
              </h3>

              <p className="text-sm text-neutral-400">
                All the cool kids are showing off their decks!
              </p>

              <div className="flex flex-col gap-2">
                <button
                  type="submit"
                  className="rounded bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                >
                  😎 Fine, make it Public
                </button>

                <button
                  type="button"
                  onClick={onConfirmPrivate}
                  className="rounded border border-neutral-700 py-2 text-sm text-neutral-300 hover:bg-neutral-800"
                >
                  🙈 Still Private
                </button>
              </div>
            </>
          )}
        </form>

    </div>
  );
}
