import { useState } from "react";
import { apiGet } from "../../services/apiClient";
import { parseDecklistText } from "../../utils/decklistImport";
import { validateDeckImport } from "../../utils/validateDeckImport";

async function lookupExact(cardName) {
  try {
    const q = `!"${cardName.replace(/"/g, '\\"')}"`;
    const data = await apiGet(
      `/api/cards/search?q=${encodeURIComponent(q)}`
    );
    return data?.cards?.[0] ?? null;
  } catch {
    return null;
  }
}

export default function DeckImportModal({
  isOpen,
  onClose,
  onDeckImport, 
}) {
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState(null);
  const [selectingCommander, setSelectingCommander] = useState(false);
  const [selectedCommanders, setSelectedCommanders] = useState([]);
  const [loading, setLoading] = useState(false);
  const BASIC_LANDS = new Set([
    "Plains",
    "Island",
    "Swamp",
    "Mountain",
    "Forest",
    "Wastes",
    "Snow-Covered Plains",
    "Snow-Covered Island",
    "Snow-Covered Swamp",
    "Snow-Covered Mountain",
    "Snow-Covered Forest",
    "Snow-Covered Wastes",
  ]);


  if (!isOpen) return null;

  function handleContinue() {
    const result = validateDeckImport(text);
    if (!result.ok) {
      alert(result.error);
      return;
    }

    const parsedDeck = parseDecklistText(text);

    if (!parsedDeck.entries.length) {
      alert("Decklist is empty.");
      return;
    }

    setParsed(parsedDeck);
    setSelectingCommander(true);
  }

  async function finalizeImport() {
    if (!parsed || selectedCommanders.length === 0) {
      alert("Select at least one commander.");
      return;
    }

    setLoading(true);

    const resolvedCommanders = [];

    for (const name of selectedCommanders) {
      const card = await lookupExact(name);
      if (card) resolvedCommanders.push(card);
    }

    if (!resolvedCommanders.length) {
      alert("Unable to resolve selected commander cards.");
      setLoading(false);
      return;
    }

    onDeckImport({
      commanders: resolvedCommanders,
      entries: parsed.entries,
    });

    setLoading(false);
    onClose();
  }

  const aggregatedEntries = parsed
    ? Object.values(
        parsed.entries.reduce((acc, entry) => {
          if (!entry?.cardName) return acc;

          const name = entry.cardName;

          if (!acc[name]) {
            acc[name] = {
              cardName: name,
              quantity: entry.quantity ?? 1,
            };
          } else {
            acc[name].quantity += entry.quantity ?? 1;
          }

          return acc;
        }, {})
      )
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-3xl rounded-xl border border-neutral-800 bg-neutral-950 shadow-2xl">

        {/* HEADER */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-800">
          <h2 className="text-lg font-semibold text-neutral-100">
            Import Decklist
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-200"
          >
            ✕
          </button>
        </div>

        {!selectingCommander && (
          <div className="p-5 space-y-4">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Paste a Moxfield / Archidekt decklist here\n\nExample:\n1 Sol Ring\n1 Arcane Signet\n2 Forest`}
              className="
                w-full h-48 rounded-md
                bg-neutral-900 border border-neutral-800
                p-3 text-sm text-neutral-100
                focus:outline-none
              "
            />

            <div className="flex justify-end">
              <button
                onClick={handleContinue}
                disabled={!text.trim()}
                className="
                  rounded-md px-5 py-2
                  bg-indigo-600 text-sm font-semibold
                  hover:bg-indigo-500
                  disabled:opacity-50
                  shadow-(--spellframe-glow)
                "
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {selectingCommander && parsed && (
          <div className="p-5 space-y-4">
            <h3 className="text-sm font-semibold shadow-(--spellframe-glow) text-neutral-200">
              Select Commander(s)
            </h3>

            <ul className="max-h-64 overflow-y-auto rounded border border-neutral-800 divide-y divide-neutral-800">
              {aggregatedEntries.map(({ cardName, quantity }) => {
                const active = selectedCommanders.includes(cardName);
                const isBasic = BASIC_LANDS.has(cardName);

                return (
                  <li
                    key={cardName}
                    onClick={() =>
                      setSelectedCommanders((prev) =>
                        active
                          ? prev.filter((n) => n !== cardName)
                          : [...prev, cardName]
                      )
                    }
                    className={`
                      cursor-pointer px-3 py-2 text-sm
                      flex items-center justify-between
                      ${
                        active
                          ? "bg-indigo-600/20 text-indigo-300 border-l-4 border-indigo-500"
                          : "hover:bg-neutral-800 text-neutral-300"
                      }
                    `}
                  >
                    <span>{cardName}</span>

                    {isBasic && (
                      <span className="text-xs text-neutral-400">
                        ×{quantity}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => {
                  setSelectingCommander(false);
                  setSelectedCommanders([]);
                }}
                className="text-sm text-neutral-400 hover:text-neutral-200 shadow-(--spellframe-glow)"
              >
                Back
              </button>

              <button
                onClick={finalizeImport}
                disabled={loading || selectedCommanders.length === 0}
                className="
                  rounded-md px-5 py-2
                  bg-indigo-600 text-sm font-semibold
                  hover:bg-indigo-500
                  disabled:opacity-50
                "
              >
                {loading ? "Importing…" : "Import Deck"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
