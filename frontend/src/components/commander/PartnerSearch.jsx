import { useState } from "react";
import { apiGet } from "../../services/apiClient";
import CardGrid from "../cards/CardGrid";

export default function PartnerSearch({ onSelect, disabled }) {
  const [query, setQuery] = useState("");
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();

    try {
      setLoading(true);

      const q = query.trim()
        ? `${query.trim()} oracle:Partner`
        : "oracle:Partner";

      const data = await apiGet(
        `/api/cards/search?q=${encodeURIComponent(q)}`
      );

      setCards(data.cards ?? []);
    } catch (err) {
      console.error("Partner search failed", err);
      setCards([]);
    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="space-y-3">
      <form onSubmit={handleSearch}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search partner…"
          disabled={disabled}
          className="
            w-full rounded-md px-3 py-2
            bg-neutral-900
            border border-neutral-800
            placeholder-neutral-500
            focus:outline-none focus:ring-2 focus:ring-indigo-500
            disabled:opacity-50
          "
        />
      </form>

      <CardGrid
        cards={cards}
        loading={loading}
        onSelect={onSelect}
      />
    </div>
  );
}
