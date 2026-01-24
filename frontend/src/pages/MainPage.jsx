import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet, apiPost } from "../services/apiClient";
import CardGrid from "../components/cards/CardGrid";
import { useNavigate, useLocation } from "react-router-dom";
import MiniDeckBanner from "../components/profile/MiniDeckBanner";

function normName(name) {
  return (name ?? "").trim().toLowerCase();
}

function identityKey(card) {
  if (!card) return null;
  if (card.oracleId) return `oracle:${card.oracleId}`;
  if (card.name) return `name:${normName(card.name)}`;
  if (card.scryfallId) return `scry:${card.scryfallId}`;
  return null;
}

export default function MainPage() {
  // "cards" | "decks" | "users"
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState("cards");
  const [query, setQuery] = useState("");

  // cards-only filters
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedSet, setSelectedSet] = useState("");

  // cards results
  const [cardResults, setCardResults] = useState([]);
  const [deckResults, setDeckResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // sets dropdown
  const [allSets, setAllSets] = useState([]);
  const [setDropdownOpen, setSetDropdownOpen] = useState(false);
  const setDropdownRef = useRef(null);

  // inspector (read-only)
  const [detailList, setDetailList] = useState([]);
  const [detailIndex, setDetailIndex] = useState(null);
  const inspectorScrollRef = useRef(null);
  const [cardPrintings, setCardPrintings] = useState(null);
  const [cardRulings, setCardRulings] = useState(null);
  const [activePrinting, setActivePrinting] = useState(null);
  // Deck inspector (public decks)
  const [activeDeckId, setActiveDeckId] = useState(null);

  const COLORS = ["w", "u", "b", "r", "g", "c"];
  const COLOR_STYLES = {
    w: "border-neutral-300 text-neutral-200 shadow-[0_0_8px_rgba(255,255,255,0.35)]",
    u: "border-blue-500 text-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.6)]",
    b: "border-purple-500 text-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.6)]",
    r: "border-red-500 text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.6)]",
    g: "border-green-500 text-green-400 shadow-[0_0_8px_rgba(34,197,94,0.6)]",
    c: "border-yellow-500 text-yellow-400 shadow-[0_0_8px_rgba(234,179,8,0.6)]",
  };
  const MANA_ICONS = {
    w: "/mana/W.svg",
    u: "/mana/U.svg",
    b: "/mana/B.svg",
    r: "/mana/R.svg",
    g: "/mana/G.svg",
    c: "/mana/C.svg",
  };
  const TYPES = [
    "creature",
    "enchantment",
    "instant",
    "sorcery",
    "artifact",
    "land",
    "planeswalker",
  ];

  const card = detailList?.[detailIndex];

  const effectivePrices = useMemo(() => {
    const fromActive = activePrinting?.prices ?? null;
    if (fromActive) return fromActive;

    const fromAnyPrinting =
      cardPrintings?.find(
        (p) =>
          p.prices?.usd ||
          p.prices?.usd_foil ||
          p.prices?.eur ||
          p.prices?.eur_foil
      )?.prices ?? null;

    return fromAnyPrinting;
  }, [activePrinting, cardPrintings]);

  useEffect(() => {
    apiGet("/api/cards/sets")
      .then((res) => setAllSets(Array.isArray(res) ? res : []))
      .catch(() => setAllSets([]));
  }, []);

  useEffect(() => {
    if (!setDropdownOpen) return;

    function handleClickOutside(e) {
      if (setDropdownRef.current && !setDropdownRef.current.contains(e.target)) {
        setSetDropdownOpen(false);
      }
    }
    function handleEscape(e) {
      if (e.key === "Escape") setSetDropdownOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [setDropdownOpen]);

  useEffect(() => {
    setCardResults([]);
    setDeckResults([]);
    closeInspector();
    setSelectedColors([]);
    setSelectedTypes([]);
    setSelectedSet("");
  }, [mode]);

  function toggleColor(color) {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  }

  function toggleType(type) {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }

  function getInspectorKey(c) {
    return c?._inventoryKey ?? c?.scryfallId ?? c?.oracleId ?? c?.name;
  }

  function openInspector(clickedCard) {
    if (!clickedCard) return;
    const list = [...cardResults]; 
    const clickedKey = getInspectorKey(clickedCard);
    const index = list.findIndex((c) => getInspectorKey(c) === clickedKey);
    if (index === -1) return;

    setDetailList(list);
    setDetailIndex(index);
  }

  function closeInspector() {
    setDetailIndex(null);
    setDetailList([]);
    setCardPrintings(null);
    setCardRulings(null);
    setActivePrinting(null);
  }

  function nextInspector() {
    setDetailIndex((i) => (i === detailList.length - 1 ? 0 : i + 1));
  }

  function prevInspector() {
    setDetailIndex((i) => (i === 0 ? detailList.length - 1 : i - 1));
  }

  useEffect(() => {
    if (detailIndex === null) return;
    const c = detailList[detailIndex];
    if (!c) return;

    setCardPrintings(null);
    setCardRulings(null);
    setActivePrinting({
      image: c.imageLarge || c.imageNormal || null,
      prices: c.prices ?? null,
    });

    requestAnimationFrame(() => {
      inspectorScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    });

    (async () => {
      try {
        if (c.oracleId) {
          const printingsRes = await apiGet(
            `/api/cards/oracle/${c.oracleId}/printings`
          );
          setCardPrintings(printingsRes?.printings ?? []);
        } else {
          setCardPrintings([]);
        }

        if (c.scryfallId) {
          const rulingsRes = await apiGet(`/api/cards/${c.scryfallId}/rulings`);
          setCardRulings(rulingsRes?.rulings ?? []);
        } else {
          setCardRulings([]);
        }
      } catch {
        setCardPrintings([]);
        setCardRulings([]);
      }
    })();
  }, [detailIndex, detailList]);

  async function handleSearch(e) {
    e.preventDefault();

    if (mode === "decks") {
        await searchPublicDecks();
        return;
    }

    if (mode !== "cards") {
      setCardResults([]);
      return;
    }

    const hasText = query.trim().length > 0;
    const hasFilters =
      selectedColors.length > 0 || selectedTypes.length > 0 || !!selectedSet;

    if (!hasText && !hasFilters) return;

    try {
      setLoading(true);

      const parts = [];

      if (hasText) parts.push(query.trim());

      if (selectedTypes.length > 0) {
        parts.push(`(${selectedTypes.map((t) => `t:${t}`).join(" or ")})`);
      }

      if (selectedColors.length > 0) {
        parts.push(`ci=${selectedColors.join("")}`);
      }

      if (selectedSet) {
        parts.push(`set:${selectedSet}`);
      }

      const finalQuery = parts.join(" ");
      const res = await apiGet(
        `/api/cards/search?q=${encodeURIComponent(finalQuery)}&unique=prints`
      );

      setCardResults(Array.isArray(res?.cards) ? res.cards : []);
    } catch (err) {
      console.error("MainPage card search failed", err);
      setCardResults([]);
    } finally {
      setLoading(false);
    }
  }

  async function searchPublicDecks() {
    try {
        setLoading(true);

        const params = new URLSearchParams();

        if (query.trim()) {
        params.append("q", query.trim());
        }

        if (selectedColors.length > 0) {
        params.append("colors", selectedColors.join(""));
        }

        const res = await apiGet(`/api/decks/public?${params.toString()}`);

        setDeckResults(Array.isArray(res?.decks) ? res.decks : []);
    } catch (err) {
        console.error("Public deck search failed", err);
        setDeckResults([]);
    } finally {
        setLoading(false);
    }
  }

  useEffect(() => {
    if (detailIndex === null) return;

    function handleKeyDown(e) {
      if (e.key === "Escape") {
        closeInspector();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [detailIndex]);

  return (
    <>
      <div className="mainpage-bg" />
      <div className="page-veil" />
        <div className="fixed inset-0 overflow-hidden z-10 flex pt-27 flex-col">
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-screen-2xl px-4 py-8 space-y-6">
              <div className="mx-auto max-w-6xl px-4 space-y-10">
                <header className="space-y-3 text-center">
                    <h1 className="text-8xl font-buda tracking-tight">
                    SPELLFRAME
                    </h1>
                    <p className="text-neutral-200 max-w-3xl mx-auto">
                    Explore Magic cards, discover public Commander decks, find users, and
                    build your next masterpiece.
                    </p>
                </header>

                <div className="flex justify-center gap-3">
                    {[
                        { key: "cards", label: "Cards" },
                        { key: "decks", label: "Public Decks" },
                    ].map((m) => (
                        <button
                        key={m.key}
                        type="button"
                        onClick={() => setMode(m.key)}
                        className={`px-5 py-2 rounded-full text-sm transition ${
                            mode === m.key
                            ? "bg-indigo-600 text-white focus:shadow-(--spellframe-glow)"
                            : "bg-neutral-900 text-neutral-400 hover:text-neutral-200 hover:shadow-(--spellframe-glow)"
                        }`}
                        >
                        {m.label}
                        </button>
                    ))}
                </div>

                <section className="space-y-4">
                    <form onSubmit={handleSearch} className="space-y-2 mx-auto max-w-5xl">
                      <input
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          placeholder={
                          mode === "cards"
                              ? "Search cards by name, type, mana…"
                              : mode === "decks"
                              ? "See what other tinkerers are tinkering with..."
                              : "Search users (coming next)…"
                          }
                          className="
                          w-full
                          rounded-md px-4 py-3
                          bg-neutral-900 border border-neutral-800
                          text-neutral-100
                          focus:outline-none
                          focus:shadow-(--spellframe-glow)
                          transition-shadow
                          "
                      />

                      {(mode === "cards" || mode === "decks") && (
                      <div className="space-y-4">

                      {mode === "cards" && (
                        <div className="flex items-center gap-6">
                            <div className="flex flex-wrap gap-3 text-sm text-neutral-300">
                              {TYPES.map((type) => (
                                  <label 
                                  key={type} 
                                  className="flex items-center gap-2">
                                  <input
                                      type="checkbox"
                                      checked={selectedTypes.includes(type)}
                                      onChange={() => toggleType(type)}
                                  />
                                  <span className="capitalize">{type}</span>
                                  </label>
                              ))}
                            </div>

                            <div className="flex-1" />

                            {allSets.length > 0 && (
                            <div ref={setDropdownRef} className="relative">
                                <button
                                type="button"
                                onClick={() => setSetDropdownOpen((o) => !o)}
                                className="
                                    min-w-64 px-3 py-2 rounded-md
                                    border border-neutral-800 bg-neutral-900
                                    text-sm text-left text-neutral-200 
                                    hover:shadow-(--spellframe-glow)
                                    transition-shadow
                                "
                                >
                                {selectedSet
                                    ? allSets.find((s) => s.code === selectedSet)?.name ??
                                    `Set: ${selectedSet}`
                                    : "Browse by Set"}
                                </button>

                                {setDropdownOpen && (
                                <div className="absolute right-0 mt-2 z-50 w-80 max-h-96 overflow-y-auto rounded-md border border-neutral-800 bg-neutral-950 shadow-lg">
                                    <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedSet("");
                                        setSetDropdownOpen(false);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-800 text-neutral-300"
                                    >
                                    Clear set filter
                                    </button>

                                    <div className="h-px bg-neutral-800" />

                                    {allSets.map((set) => (
                                    <button
                                        key={set.code}
                                        type="button"
                                        onClick={() => {
                                        setSelectedSet(set.code);
                                        setSetDropdownOpen(false);
                                        }}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-800 text-neutral-200"
                                    >
                                        {set.name}
                                    </button>
                                    ))}
                                </div>
                                )}
                            </div>
                            )}
                        </div>
                      )}

                      {mode === "cards" &&
                      selectedColors.length === 0 &&
                      selectedTypes.length === 0 &&
                      !selectedSet &&
                      query.trim().length === 0 && (
                        <div className="flex justify-center">
                          <div className=" text-xs text-neutral-300 text-center px-3 py-2 rounded-md bg-neutral-900/40 backdrop-blur-sm">
                          Tip: enter a search term or use filters (color/type/set) to avoid a maxed search of 200.
                          </div>
                        </div>
                      )}
                      {mode === "decks" && query.trim().length === 0 && (
                        <div className="flex justify-center pt-6">
                          <div className="text-xs text-neutral-300 text-center px-3 py-2 rounded-md bg-neutral-900/40 backdrop-blur-sm">
                            Tip: even an empty search can have a result!
                          </div>
                        </div>
                      )}

                      <div className="flex justify-center pt-2">
                          <div
                              className="
                                  inline-flex
                                  flex-col
                                  gap-4
                                  rounded-xl
                                  px-2
                                  py-1
                                  bg-neutral-950/55
                                  backdrop-blur-sm
                                  border
                                  border-neutral-700/50
                                  shadow-[0_0_30px_rgba(0,0,0,0.35)]
                              "
                              >
                                <div className="flex gap-2">
                                  {COLORS.map((c) => {
                                      const isActive = selectedColors.includes(c);
                                      return (
                                      <button
                                          key={c}
                                          type="button"
                                          onClick={() => toggleColor(c)}
                                          className={`
                                          flex items-center justify-center
                                          w-9 h-9 rounded-full border transition
                                          ${
                                              isActive
                                              ? c === "w"
                                                  ? "border-neutral-300 shadow-[0_0_12px_rgba(255,255,255,0.7)]"
                                                  : c === "u"
                                                  ? "border-blue-500 shadow-[0_0_14px_rgba(59,130,246,0.9)]"
                                                  : c === "b"
                                                  ? "border-purple-500 shadow-[0_0_14px_rgba(168,85,247,0.9)]"
                                                  : c === "r"
                                                  ? "border-red-500 shadow-[0_0_14px_rgba(239,68,68,0.9)]"
                                                  : c === "g"
                                                  ? "border-green-500 shadow-[0_0_14px_rgba(34,197,94,0.9)]"
                                                  : "border-yellow-500 shadow-[0_0_14px_rgba(234,179,8,0.9)]"
                                              : "border-neutral-700 opacity-70 hover:opacity-100"
                                            }
                                          `}
                                      >
                                        <img src={MANA_ICONS[c]} alt={c} className="w-5 h-5" />
                                      </button>
                                      );
                                  })}
                                </div>
                          </div>
                      </div>
                          
                      </div>
                      )}
                    </form>
                </section>
                  
                <section className="flex flex-col sm:flex-row gap-4 pt-0">
                    <Link
                        to="/commander"
                        className="
                            block
                            w-full
                            max-w-lg
                            mx-auto
                            rounded-xl
                            px-10
                            py-4
                            text-center
                            text-lg
                            font-semibold
                            tracking-wide
                            text-neutral-100
                            bg-indigo-600
                            shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_8px_30px_rgba(79,70,229,0.35)]
                            hover:bg-indigo-500
                            transition-shadow-colors
                            hover:shadow-(--spellframe-glow)
                        "
                        >
                        BUILD A DECK
                        </Link>

                </section>

                <section className="space-y-4 px-4">
                  <div className="mx-auto max-w-screen-2xl">
                    {mode === "decks" ? (
                        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {deckResults.map((deck) => (
                            <li key={deck._id} className="rounded-md hover:shadow-(--spellframe-glow) transition-shadow">
                        <MiniDeckBanner
                                deck={deck}
                                to={`/decks/${deck._id}`}
                                onUpdateLikes={(id, likes) => {
                                    setDeckResults(prev =>
                                    prev.map(d => d._id === id ? { ...d, likes } : d)
                                    );
                                }}
                                />
                            </li>
                        ))}
                        </ul>
                    ) : mode === "cards" ? (
                        <CardGrid
                        cards={cardResults}
                        loading={loading}
                        onSelect={openInspector}
                        identityKey={identityKey}
                        />
                    ) : null}
                  </div>
                </section>

                {detailIndex !== null && mode === "cards" && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pt-27">
                      <div className="absolute inset-0 bg-black/70" onClick={closeInspector} />

                        <div className="relative w-full max-w-4xl h-[90vh] bg-neutral-950 border border-neutral-800 rounded-md shadow-2xl flex flex-col">
                            <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-800">
                              <div className="flex gap-2">
                                  <button
                                  onClick={prevInspector}
                                  className="
                                    px-3 py-1 rounded
                                    border border-neutral-700
                                    text-sm text-neutral-200
                                    shadow-(--spellframe-glow)
                                    transition-colors
                                    hover:bg-indigo-600/30
                                    hover:border-indigo-400
                                    hover:text-white
                                    "                                  >
                                  ← Prev
                                  </button>
                                  <button
                                  onClick={nextInspector}
                                  className="
                                    px-3 py-1 rounded
                                    border border-neutral-700
                                    text-sm text-neutral-200
                                    shadow-(--spellframe-glow)
                                    transition-colors
                                    hover:bg-indigo-600/30
                                    hover:border-indigo-400
                                    hover:text-white
                                    "                                  >
                                  Next →
                                  </button>
                              </div>

                              <button
                                  onClick={closeInspector}
                                  className="
                                    px-3 py-1 rounded
                                    border border-neutral-700
                                    text-sm text-neutral-200
                                    shadow-(--spellframe-glow)
                                    transition-colors
                                    hover:bg-indigo-600/30
                                    hover:border-indigo-400
                                    hover:text-white
                                    "                               >
                                  ✕ Close
                              </button>
                            </div>

                            <div ref={inspectorScrollRef} className="flex-1 overflow-y-auto">
                              {!card ? (
                                  <div className="p-6 text-neutral-500">Loading…</div>
                              ) : (
                                  <div className="p-6 grid grid-cols-1 md:grid-cols-[320px_1fr] gap-8">
                                    <div
                                      className="
                                        space-y-3
                                        max-h-full
                                        overflow-y-auto
                                        pr-2
                                      "
                                    >
                                        {activePrinting ? (
                                        <img
                                            src={
                                            activePrinting?.image ||
                                            card.imageLarge ||
                                            card.imageNormal
                                            }
                                            className="w-full max-w-[320px] rounded border border-neutral-800"
                                            alt={card.name}
                                        />
                                        ) : (
                                        <div
                                            className="w-full max-w-[320px] rounded border border-neutral-800 bg-neutral-900"
                                            style={{ aspectRatio: "63 / 88" }}
                                        />
                                        )}

                                        {effectivePrices && (
                                        <div className="mt-3 rounded-md border border-neutral-800 bg-neutral-900/60 px-3 py-3 text-center">
                                            <div className="text-xs uppercase tracking-wide text-neutral-400 mb-1">
                                            Current Average Price
                                            </div>

                                            <div className="flex items-center justify-center gap-2 text-lg font-semibold text-neutral-100">
                                            {effectivePrices.usd_foil ? (
                                                <>
                                                <span>${effectivePrices.usd_foil}</span>
                                                <span className="text-xs font-normal text-neutral-400">
                                                    Foil
                                                </span>
                                                </>
                                            ) : effectivePrices.usd ? (
                                                <>
                                                <span>${effectivePrices.usd}</span>
                                                <span className="text-xs font-normal text-neutral-400">
                                                    Non-foil
                                                </span>
                                                </>
                                            ) : effectivePrices.eur_foil ? (
                                                <>
                                                <span>€{effectivePrices.eur_foil}</span>
                                                <span className="text-xs font-normal text-neutral-400">
                                                    Foil
                                                </span>
                                                </>
                                            ) : effectivePrices.eur ? (
                                                <>
                                                <span>€{effectivePrices.eur}</span>
                                                <span className="text-xs font-normal text-neutral-400">
                                                    Non-foil
                                                </span>
                                                </>
                                            ) : (
                                                <span className="text-sm text-neutral-500">
                                                No pricing data
                                                </span>
                                            )}
                                            </div>
                                        </div>
                                        )}
                                    </div>

                                    <div className="space-y-6">
                                        <section className="space-y-3">
                                          <h2 className="text-3xl font-semibold text-neutral-100">
                                              {card.name}
                                          </h2>
                                          <div className="text-sm text-neutral-400">{card.typeLine}</div>
                                          <p className="whitespace-pre-line text-neutral-200">
                                              {card.oracleText}
                                          </p>
                                          {card.flavorText && (
                                              <p className="italic text-neutral-400">{card.flavorText}</p>
                                          )}
                                        </section>

                                        <hr className="border-neutral-800" />

                                        <section className="space-y-2">
                                          <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-200">
                                              Printings
                                          </h3>

                                            {cardPrintings ? (
                                            <ul className="space-y-1 text-sm text-neutral-400">
                                            {cardPrintings.map((p) => (
                                                <li key={p.scryfallId}>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                    setActivePrinting({
                                                        image: p.imageLarge || p.imageNormal || null,
                                                        prices: p.prices ?? null,
                                                    })
                                                    }
                                                    className="text-left hover:underline hover:text-white transition"
                                                >
                                                    {p.setName} ({p.collectorNumber})
                                                </button>
                                                </li>
                                            ))}
                                            </ul>
                                        ) : (
                                            <p className="text-sm text-neutral-500">Loading…</p>
                                        )}
                                        </section>

                                        <hr className="border-neutral-800" />

                                        <section className="space-y-2">
                                        <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-200">
                                            Rulings
                                        </h3>

                                        {cardRulings ? (
                                            <ul className="space-y-2 text-sm text-neutral-400">
                                            {cardRulings.map((r, i) => (
                                                <li key={i}>
                                                <span className="block text-neutral-500 text-xs">
                                                    {r.publishedAt}
                                                </span>
                                                {r.comment}
                                                </li>
                                            ))}
                                            </ul>
                                        ) : (
                                            <p className="text-sm text-neutral-500">Loading…</p>
                                        )}
                                        </section>
                                    </div>
                                  </div>
                              )}
                            </div>
                        </div>
                    </div>
                      
                )}
              </div>
            </div>
          </div>
        </div>
    </>
  );
}
