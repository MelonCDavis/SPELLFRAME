import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DeckImportModal from "../components/deck/DeckImportModal";
import { useAuth } from "../auth/AuthContext";

import Header from "../components/layout/Header";
import CardGrid from "../components/cards/CardGrid";
import { apiGet } from "../services/apiClient";
import { isCommanderLegal } from "../utils/isCommanderLegal";
import { sanitizeSearchQuery } from "../utils/validateSearchQuery";

export default function CommanderSelectPage() {
  const [query, setQuery] = useState("");
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCommander, setSelectedCommander] = useState(null);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showImport, setShowImport] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    const hasText = query.trim().length > 0;
    if (!hasText) return;

    try {
      setLoading(true);

      const data = await apiGet(`/api/cards/search?q=${query}`);

      const annotated = Array.isArray(data.cards)
        ? data.cards.map((card) => ({
            ...card,
            isCommanderLegal: isCommanderLegal(card),
          }))
        : [];

      setCards(annotated);
    } catch (err) {
      console.error("Search failed", err);
      setCards([]);
    } finally {
      setLoading(false);
    }
  }

  function handleCommanderImport(commanders) {
    if (!commanders.length) return;

    navigate("/deck", {
      state: {
        commander: commanders[0],
        partner: commanders[1] ?? null,
        fromImport: true,
      },
    });
  }

  const selectedIds = selectedCommander
    ? new Set([`oracle:${selectedCommander.oracleId}`])
    : new Set();
    
  return (
    <div className="relative text-neutral-100 flex flex-col">
      <div className="commander-bg absolute inset-0" />
      <div className="page-veil absolute inset-0 z-10" />

      <div className="relative z-30 shrink-0">
        <Header />
        <form onSubmit={handleSearch} className="p-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commanders…"
            className="
              text-2xl
              w-full rounded-md px-3 py-2
              bg-neutral-900
              border border-neutral-800
              placeholder-neutral-100
              focus:outline-none
              transition-shadow
              focus:shadow-(--spellframe-glow)
            "
          />
        </form>
        {isAuthenticated && (
          <div className="flex justify-center pb-4">
            <button
              type="button"
              onPointerDown={() => setShowImport(true)}
              className="
                px-6 py-2
                rounded-md
                border border-neutral-800
                bg-neutral-900
                text-md font-semibold
                text-neutral-200
                transition-shadow
                hover:bg-neutral-800
                shadow-(--spellframe-glow)
              "
            >
              Import Decklist
            </button>
          </div>
        )}
      </div>

      <div className="relative z-40 flex-1 overflow-y-auto pt-5">
        <div className="mx-auto max-w-7xl px-4 pb-28">
          <CardGrid
            cards={cards}
            loading={loading}
            selectedIds={selectedIds}
            identityKey={(card) => `oracle:${card.oracleId}`}
            showCommanderRestriction
            onSelect={(card) => {
              setSelectedCommander(card);
            }}
            renderOverlay={() => null}
          />
        </div>
      </div>

      {/* Fixed footer */}
      <div
        className={`w-full py-3 rounded-md z-50 font-semibold transition-shadow ${
          selectedCommander
            ? "bg-indigo-600 hover:bg-indigo-500 shadow-(--spellframe-glow)"
            : "bg-neutral-800 text-neutral-400 cursor-not-allowed"
        }`}
      >
        <button
          onClick={() => {
            if (!selectedCommander) return;
            navigate("/deck", { state: { commander: selectedCommander } });
          }}
          className={`
            w-full py-3 rounded-md font-semibold transition
            ${
              selectedCommander
                ? "bg-indigo-600 hover:bg-indigo-500"
                : "bg-neutral-800 text-neutral-400 cursor-not-allowed"
            }
          `}
          disabled={!selectedCommander}
        >
          {selectedCommander
            ? `Select ${selectedCommander.name}`
            : "Select Commander"}
        </button>
      </div>
      <div className="z-60">
        <DeckImportModal
          isOpen={showImport}
          onClose={() => setShowImport(false)}
          onDeckImport={({ commanders, entries }) => {
            navigate("/deck", {
              state: {
                importedDeck: { commanders, entries },
              },
            });
          }}
        />
      </div>
    </div>
  );

}
