import { useState } from "react";
import { apiGet } from "../../services/apiClient";

export default function AvatarCardPicker({ onSelect }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  async function runSearch() {
    if (!query || query.trim().length < 2) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);

      const res = await apiGet(
        `/api/cards/search?q=${encodeURIComponent(query.trim())}`
      );

      setResults((res.cards ?? []).slice(0, 9));
    } catch (err) {
      console.error("Avatar search failed", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      runSearch();
    }
  }

  return (
    <div className="space-y-4">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Search card art and press Enter…"
        className="
          w-full rounded-md bg-neutral-800 border border-neutral-700
          px-3 py-2 text-sm text-neutral-100
          placeholder:text-neutral-500
          focus:outline-none
          focus:ring-2
          focus:ring-indigo-500
          focus:shadow-(--spellframe-glow)
        "
      />

      {loading && (
        <p className="text-xs text-neutral-400">Searching…</p>
      )}

      {results.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {results.map((card) => (
            <button
              key={card.scryfallId}
              onClick={() =>
                onSelect({
                  scryfallId: card.scryfallId,
                  image: card.imageNormal || card.imageSmall,
                  name: card.name,
                })
              }
              className="
                relative rounded-md overflow-hidden border
                border-neutral-800
                transition
                hover:border-indigo-500
                hover:shadow-(--spellframe-glow)
                focus:shadow-(--spellframe-glow)
              "
            >
              <img
                src={card.imageNormal || card.imageSmall}
                alt={card.name}
                className="w-full h-24 object-cover"
              />
              <div className="absolute bottom-0 inset-x-0 bg-black/60 text-xs px-1 py-0.5 truncate">
                {card.name}
              </div>
            </button>
          ))}
        </div>
      )}

      {!loading && query.trim().length >= 2 && results.length === 0 && (
        <p className="text-xs text-neutral-500">
          Press Enter to search.
        </p>
      )}
    </div>
  );
}
