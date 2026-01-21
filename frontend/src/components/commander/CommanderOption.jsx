export default function CommanderOption({
  label,
  card,
  onClear,
  onAdd,
  disabled = false,
}) {
  return (
    <div className="rounded-md border border-neutral-800 bg-neutral-900 p-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-neutral-400">
            {label}
          </div>

          {card ? (
            <div className="mt-1 text-sm font-medium text-neutral-100">
              {card.name}
            </div>
          ) : (
            <div className="mt-1 text-sm text-neutral-500">
              None selected
            </div>
          )}
        </div>

        {!disabled && (
          <div className="flex gap-2">
            {card && (
              <button
                type="button"
                onClick={onClear}
                className="text-xs text-neutral-400 hover:text-neutral-200"
              >
                Clear
              </button>
            )}

            {!card && onAdd && (
              <button
                type="button"
                onClick={onAdd}
                className="rounded-md shadow-(--spellframe-glow) bg-neutral-800 px-2 py-1 text-xs text-neutral-200 hover:bg-neutral-700"
              >
                Add
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
