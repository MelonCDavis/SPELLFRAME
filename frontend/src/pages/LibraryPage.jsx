import { useEffect, useState, useRef } from "react";
import { apiGet, apiPost } from "../services/apiClient";
import CardGrid from "../components/cards/CardGrid";
import CardQuantityOverlay from "../components/cards/CardQuantityOverlay";
import { sanitizeSearchQuery } from "../utils/validateSearchQuery";

export default function LibraryPage() {
  const [query, setQuery] = useState("");
  const [searchMode, setSearchMode] = useState("all");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Inspector
  const [detailList, setDetailList] = useState([]);
  const [detailIndex, setDetailIndex] = useState(null);
  const inspectorScrollRef = useRef(null);
  // Inspector extended data (match DeckBuilderPage)
  const [cardPrintings, setCardPrintings] = useState(null);
  const [cardRulings, setCardRulings] = useState(null);
  const [activePrinting, setActivePrinting] = useState(null);

  // Collection state
  const [ownedMap, setOwnedMap] = useState({});
  const [libraryTotal, setLibraryTotal] = useState(null);
  const [allSets, setAllSets] = useState([]);
  const [activeSet, setActiveSet] = useState(null);
  const [setDropdownOpen, setSetDropdownOpen] = useState(false);
  const setDropdownRef = useRef(null);

  // Pagination
  const PAGE_SIZE = 40;
  const [currentPage, setCurrentPage] = useState(1);

  // Filters
  const effectivePrices =
    activePrinting?.prices ??
    cardPrintings?.find(p =>
      p.prices?.usd ||
      p.prices?.usd_foil ||
      p.prices?.eur ||
      p.prices?.eur_foil
    )?.prices ??
    null;

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
  const COLORS = ["w", "u", "b", "r", "g", "c"];
  const TYPES = [
    "creature",
    "enchantment",
    "instant",
    "sorcery",
    "artifact",
    "land",
    "planeswalker",
  ];
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedSet, setSelectedSet] = useState("");

  /* ---------------------------------- */
  /* Derived Data                       */
  /* ---------------------------------- */
  function expandByFinish(cards) {
    return cards.flatMap(card => {
      if (!Array.isArray(card.finishes) || card.finishes.length === 0) {
        return [{
          ...card,
          finish: "nonfoil",
          _inventoryKey: `${card.scryfallId}:nonfoil`,
        }];
      }

      return card.finishes.map(finish => ({
        ...card,
        finish,
        _inventoryKey: `${card.scryfallId}:${finish}`,
      }));
    });
  }

  const expandedResults = expandByFinish(results);
  const filteredResults = expandedResults.filter(card => {

    if (selectedSet && card.setCode !== selectedSet) return false;

    if (
      selectedColors.length > 0 &&
      !selectedColors.every(c => 
        c === "c"
          ? !card.colorIdentity || card.colorIdentity.length === 0
          : card.colorIdentity?.includes(c.toUpperCase())
      )
    ) {
      return false;
    }

    if (
      selectedTypes.length > 0 &&
      !selectedTypes.some(t =>
        card.typeLine?.toLowerCase().includes(t)
      )
    ) {
      return false;
    }

    return true;
  });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredResults.length / PAGE_SIZE)
  );

  const paginatedResults = filteredResults.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const availableSets = Array.from(
    new Map(
      results
        .filter(c => c.setCode && c.setName)
        .map(c => [c.setCode, c.setName])
    )
  );

  /* ---------------------------------- */
  /* Search                             */
  /* ---------------------------------- */

  async function searchLibrary(e) {
    e.preventDefault();

    const hasText = query.trim().length > 0;
    const hasFilters =
      selectedColors.length > 0 ||
      selectedTypes.length > 0 ||
      selectedSet;

    try {
      setLoading(true);
      setCurrentPage(1);

      if (searchMode === "owned") {
        const res = await apiGet("/api/collection?limit=5000");

        let cards = (res.entries || [])
          .filter(e => e.card && e.qtyOwned > 0)
          .map(e => e.card);


        if (selectedColors.length > 0) {
          cards = cards.filter(card =>
            selectedColors.every(c =>
              (card.colorIdentity || []).includes(c.toUpperCase())
            )
          );
        }

        if (selectedTypes.length > 0) {
          cards = cards.filter(card =>
            selectedTypes.some(t =>
              card.typeLine?.toLowerCase().includes(t)
            )
          );
        }

        if (selectedSet) {
          cards = cards.filter(card => card.setCode === selectedSet);
        }

        if (hasText) {
          const q = query.toLowerCase();
          cards = cards.filter(card =>
            card.name.toLowerCase().includes(q)
          );
        }
        setResults(cards);
        setActiveSet(null);
        setSelectedSet("");
        await hydrateOwnedMap();
        return;
      }

      const parts = [];

      if (hasText) {
        parts.push(query.trim());
      }

      if (selectedTypes.length > 0) {
        parts.push(
          `(${selectedTypes.map(t => `t:${t}`).join(" or ")})`
        );
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

      setResults(Array.isArray(res.cards) ? res.cards : []);
      setActiveSet(null);
      setSelectedSet("");
      await hydrateOwnedMap();
    } catch (err) {
      console.error("Library search failed", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  /* ---------------------------------- */
  /* Collection Helpers                 */
  /* ---------------------------------- */

  async function hydrateOwnedMap() {
    try {
      const res = await apiGet("/api/collection?limit=5000");
      const map = {};

      for (const entry of res.entries || []) {
        if (entry.card?.scryfallId) {
          map[entry.card.scryfallId] =
            (map[entry.card.scryfallId] || 0) + (entry.qtyOwned || 0);
        }
      }

      setOwnedMap(map);
    } catch (err) {
      console.error("Failed to hydrate owned map", err);
    }
  }

  async function updateQuantity(card, delta) {
  const current = ownedMap[card.scryfallId] || 0;
  const next = Math.max(0, current + delta);

  setOwnedMap(prev => {
    const updated = { ...prev };

    if (next === 0) {
      delete updated[card.scryfallId];
    } else {
      updated[card.scryfallId] = next;
    }

    return updated;
  });

  if (searchMode === "owned" && next === 0) {
    setResults(prev =>
      prev.filter(c => c.scryfallId !== card.scryfallId)
    );
  }

  try {
    await apiPost("/api/collection", {
      cardId: card._id ?? card.scryfallId,
      qtyOwnedDelta: delta,
    });

    const totalRes = await apiGet("/api/collection/total");
    setLibraryTotal(totalRes.totalOwned);
  } catch (err) {
    console.error("Failed to update collection", err);
  }
}

  async function searchBySet(set) {
    setActiveSet(set);
    setSelectedSet(set.code);
    setQuery("");
    setCurrentPage(1);
    setSetDropdownOpen(false);

    if (searchMode === "owned") {
      const res = await apiGet("/api/collection?limit=5000");

      let cards = (res.entries || [])
        .filter(e => e.card)
        .map(e => e.card);

      if (selectedColors.length > 0) {
        cards = cards.filter(card =>
          selectedColors.every(c =>
            (card.colorIdentity || []).includes(c.toUpperCase())
          )
        );
      }

      if (selectedTypes.length > 0) {
        cards = cards.filter(card =>
          selectedTypes.some(t =>
            card.typeLine?.toLowerCase().includes(t)
          )
        );
      }

      cards = cards.filter(card => card.setCode === set.code);

      setResults(cards);
      await hydrateOwnedMap();
      return;
    }

    try {
      setLoading(true);

      const parts = [`set:${set.code}`];

      if (selectedTypes.length > 0) {
        parts.push(
          `(${selectedTypes.map(t => `t:${t}`).join(" or ")})`
        );
      }

      if (selectedColors.length > 0) {
        parts.push(`ci=${selectedColors.join("")}`);
      }

      const finalQuery = parts.join(" ");

      const res = await apiGet(
        `/api/cards/search?q=${encodeURIComponent(finalQuery)}&unique=prints`
      );

      setResults(res.cards || []);
      await hydrateOwnedMap();
    } catch (err) {
      console.error("Set search failed", err);
    } finally {
      setLoading(false);
    }
  }


  /* ---------------------------------- */
  /* UI Helpers                         */
  /* ---------------------------------- */
  const ROSE_ACTIVE_SHADOW =
    `
    0 0 0 2px rgba(190,18,60,0.95),
    0 0 8px rgba(190,18,60,0.85),
    0 0 13px rgba(190,18,60,0.75)
    `;

  function toggleColor(color) {
    setSelectedColors(prev =>
      prev.includes(color)
        ? prev.filter(c => c !== color)
        : [...prev, color]
    );
  }

  function ManaCost({ manaCost }) {
    if (!manaCost) return null;

    const symbols = manaCost.match(/\{[^}]+\}/g);
    if (!symbols) return null;

    return (
      <span className="flex items-center gap-0.5">
        {symbols.map((sym, i) => {
          const key = sym
            .replace(/[{}]/g, "")
            .replace(/\//g, "-")
            .toLowerCase();

          return (
            <span
              key={i}
              className={`mana mana-${key}`}
              aria-hidden
            />
          );
        })}
      </span>
    );
  }

  function toggleType(type) {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  }

 


  function getInspectorKey(c) {
    return c?._inventoryKey ?? c?.scryfallId ?? c?.oracleId ?? c?.name;
  }

  function openInspector(clickedCard) {
    // IMPORTANT: resolve against what the user can actually click
    // Use the same array you pass into CardGrid (paginatedResults)
    const list = paginatedResults;

    const clickedKey = getInspectorKey(clickedCard);
    const index = list.findIndex((c) => getInspectorKey(c) === clickedKey);

    // If we can't find it for any reason, do NOT silently default to first.
    if (index === -1) return;

    setDetailList(list);
    setDetailIndex(index);
  }



  function closeInspector() {
    setDetailIndex(null);
    setDetailList([]);
  }

  function nextInspector() {
    setDetailIndex(i =>
      i === detailList.length - 1 ? 0 : i + 1
    );
  }

  function prevInspector() {
    setDetailIndex(i =>
      i === 0 ? detailList.length - 1 : i - 1
    );
  }

  /* ---------------------------------- */
  /* Effects                            */
  /* ---------------------------------- */

  useEffect(() => {
    if (detailIndex === null) return;

    const card = detailList[detailIndex];
    if (!card) return;

    async function loadInspectorData() {
      try {
        setCardPrintings(null);
        setCardRulings(null);

       // PRINTINGS (by oracle_id)
      if (card.oracleId) {
        const printingsRes = await apiGet(
          `/api/cards/oracle/${card.oracleId}/printings`
        );

        //  correct: API returns { printings: [...] }
        setCardPrintings(printingsRes?.printings ?? []);
      } else {
        setCardPrintings([]);
      }

        // RULINGS (by scryfallId)
        if (card.scryfallId) {
          const rulingsRes = await apiGet(
            `/api/cards/${card.scryfallId}/rulings`
          );
          setCardRulings(rulingsRes?.rulings ?? []);
        }

        // Default image
        setActivePrinting({
          image: card.imageLarge || card.imageNormal || null,
          prices: card.prices ?? null,
        });


      } catch (err) {
        console.error("Failed to load inspector data", err);
      }
    }

    loadInspectorData();
  }, [detailIndex, detailList]);

  useEffect(() => {
    if (!cardPrintings || cardPrintings.length === 0) return;

    // ONLY set default printing if user has not selected one
    setActivePrinting(prev => {
      if (prev) return prev;

      const firstPriced = cardPrintings.find(p =>
        p.prices?.usd ||
        p.prices?.usd_foil ||
        p.prices?.eur ||
        p.prices?.eur_foil
      );

      if (!firstPriced) return prev;

      return {
        image: firstPriced.imageLarge || firstPriced.imageNormal || null,
        prices: firstPriced.prices ?? null,
      };
    });
  }, [cardPrintings]);



  useEffect(() => {
  if (!cardPrintings) return;
}, [cardPrintings]);

  useEffect(() => {
    async function loadSets() {
      try {
        const res = await apiGet("/api/cards/sets");
        setAllSets(res);
      } catch (err) {
        console.error("Failed to load sets", err);
      }
    }

    loadSets();
  }, []);


  useEffect(() => {
    async function fetchLibraryTotal() {
      try {
        const res = await apiGet("/api/collection/total");
        setLibraryTotal(res.totalOwned);
      } catch {}
    }
    fetchLibraryTotal();
  }, []);

  useEffect(() => {
    if (detailIndex === null) return;
    inspectorScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [detailIndex]);

  useEffect(() => {
    if (!setDropdownOpen) return;

    function handleClickOutside(e) {
      if (
        setDropdownRef.current &&
        !setDropdownRef.current.contains(e.target)
      ) {
        setSetDropdownOpen(false);
      }
    }

    function handleEscape(e) {
      if (e.key === "Escape") {
        setSetDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [setDropdownOpen]);

  const canUseSetFilter =
  selectedColors.length > 0 || selectedTypes.length > 0;

  const card = detailList?.[detailIndex];

  /* ---------------------------------- */
  /* Render                             */
  /* ---------------------------------- */

  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* FULL-BLEED BACKGROUND */}
      <div className="library-bg fixed inset-0 z-0" />
        <div className="relative z-20 h-full overflow-y-auto">
        {/* PAGE CONTENT */}
        <div
        className="
          rounded-2xl
          pt-27
          min-h-dvh
          bg-linear-to-b
          from-neutral-400/10
          via-neutral-500/20
          to-neutral-700/60
        "
      >
          <div className="mx-auto max-w-6xl px-4 py-6">
            <div className="space-y-6">
              {/* Header */}
              <header>
                <h1 className="text-5xl font-buda text-neutral-100">
                  THE SPELLFRAME COMPENDIUM
                  {libraryTotal !== null && ` (${libraryTotal})`}
                </h1>
                <p className="text-sm text-neutral-200">
                  Search the entire Magic The Gathering database and manage your collection.
                </p>
              </header>

              
            
              <div className="flex flex-col gap-4 items-center md:items-stretch order-2 lg:order-0 lg:grid lg:grid-cols-3 lg:gap-x-6 lg:gap-y-4">
                {/* Type Filter */}
                <div className="w-full flex justify-center lg:col-span-2">
                  <div
                    className="
                      inline-flex flex-wrap gap-4
                      px-4 py-3
                      rounded-xl
                      h-13
                      bg-neutral-900/60
                      backdrop-blur-sm
                      border border-neutral-700/50
                      shadow-[0_0_20px_rgba(0,0,0,0.35)]
                      text-m
                    "
                  >
                    {TYPES.map(type => (
                      <label
                        key={type}
                        className="flex items-center gap-2 text-neutral-200"
                      >
                        <input
                          type="checkbox"
                          checked={selectedTypes.includes(type)}
                          onChange={() => toggleType(type)}
                        />
                        <span className="capitalize">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
                {/* EMPTY RIGHT CELL — keeps column alignment */}
                <div />
                {/* SEARCH MODE — ROW 2 / LEFT */}
                <div className="w-full flex justify-center lg:col-span-1">
                  <div
                    className="
                      inline-flex gap-6
                      px-4 py-3
                      h-13
                      items-center
                      rounded-xl
                      bg-neutral-900/60
                      backdrop-blur-md
                      border border-neutral-700/60
                      shadow-[0_0_30px_rgba(0,0,0,0.55)]
                      text-m
                    "
                  >
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={searchMode === 'all'}
                        onChange={() => setSearchMode('all')}
                      />
                      All Cards
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={searchMode === 'owned'}
                        onChange={() => setSearchMode('owned')}
                      />
                      My Compendium
                    </label>
                  </div>
                </div>
                {/* MANA FILTER — ROW 2 / RIGHT */}
                <div className="w-full flex justify-center lg:col-span-1">
                  <div
                    className="
                      inline-flex items-center
                      px-4 py-3
                      h-13
                      rounded-xl
                      bg-neutral-900/60
                      backdrop-blur-md
                      border border-neutral-700/60
                      shadow-[0_0_30px_rgba(0,0,0,0.55)]
                    "
                  >
                    <div className="flex gap-2">
                      {COLORS.map(c => {
                        const isActive = selectedColors.includes(c);

                        return (
                          <button
                            key={c}
                            onClick={() => toggleColor(c)}
                            className={`
                              flex items-center justify-center
                              w-9 h-9 rounded-full border transition
                              ${
                                isActive
                                  ? COLOR_STYLES[c]
                                  : 'border-neutral-700 opacity-70 hover:opacity-100'
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
              {/* Search + Set Browser */}
              <div className="flex gap-3 items-center order-1 lg:order-0">
                {/* Search input (form ONLY wraps input) */}
                <form onSubmit={searchLibrary} className="flex-1">
                  <input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search cards by name, type…"
                    className="
                    w-full 
                    rounded-md 
                    px-4 py-3
                    bg-neutral-900 
                    border
                    border-neutral-800
                    focus:outline-none
                    "
                    onFocus={e => {
                      e.currentTarget.style.boxShadow = ROSE_ACTIVE_SHADOW;
                      e.currentTarget.style.borderColor = "rgb(190,18,60)";
                    }}
                    onBlur={e => {
                      e.currentTarget.style.boxShadow = "none";
                      e.currentTarget.style.borderColor = "";
                    }}
                  />
                </form>

                {allSets.length > 0 && (
                  <div ref={setDropdownRef} className="relative">
                    <button
                      type="button"
                      onClick={() => setSetDropdownOpen(o => !o)}
                      className="
                        min-w-64
                        px-3
                        py-3
                        rounded-md
                        border
                        border-neutral-800
                        bg-neutral-900
                        text-sm
                        text-left
                        transition
                      "
                      style={{
                        borderColor: "rgb(190,18,60)",
                        boxShadow: ROSE_ACTIVE_SHADOW,
                      }}
                    >
                      {activeSet ? activeSet.name : "Browse by Set"}
                    </button>

                    {setDropdownOpen && (
                      <div
                        className="
                          absolute right-0 mt-2 z-50
                          w-80 max-h-96 overflow-y-auto
                          rounded-md
                          border
                          bg-neutral-950
                        "
                        style={{
                          borderColor: "rgb(190,18,60)",
                          boxShadow: ROSE_ACTIVE_SHADOW,
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setActiveSet(null);
                            setSelectedSet("");
                            setCurrentPage(1);
                            setSetDropdownOpen(false);
                          }}
                          className="
                            w-full
                            px-4 py-2
                            text-left
                            text-sm
                            text-neutral-300
                            hover:bg-neutral-800
                            border-b
                            border-neutral-800
                          "
                        >
                          Clear set filter
                        </button>
                        {allSets.map(set => (
                          <button
                            key={set.code}
                            type="button"
                            onClick={() => searchBySet(set)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-800"
                          >
                            {set.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {searchMode === "all" &&
                selectedColors.length === 0 &&
                selectedTypes.length === 0 && (
                  <div className="text-xs text-neutral-200 max-w-3xl">
                    Set searches are limited to ~200 cards per request by the Scryfall API.
                    For best results, narrow your search using color or type filters.
                  </div>
              )}

                <CardGrid
                  cards={paginatedResults}
                  loading={loading}
                  onSelect={openInspector}
                  renderOverlay={card => (
                    <CardQuantityOverlay
                      quantity={ownedMap[card.scryfallId] ?? 0}
                      onIncrement={() => updateQuantity(card, +1)}
                      onDecrement={() => updateQuantity(card, -1)}
                    />
                  )}
                />

              {filteredResults.length > PAGE_SIZE && (
                <div className="flex justify-center gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                  >
                    ←
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={p === currentPage ? "text-indigo-400" : ""}
                    >
                      {p}
                    </button>
                  ))}

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                  >
                    →
                  </button>
                </div>
              )}

              {detailIndex !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pt-27">
                  <div
                    className="absolute inset-0 bg-black/70"
                    onClick={closeInspector}
                  />

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
                           "  
                        >
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
                           "  
                        >
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
                           "  
                        >
                        ✕ Close
                      </button>
                    </div>

                    <div
                      ref={inspectorScrollRef}
                      className="flex-1 overflow-y-auto"
                    >
                      {!card ? (
                        <div className="p-6 text-neutral-500">Loading…</div>
                      ) : (
                        <div className="p-6 grid grid-cols-1 md:grid-cols-[320px_1fr] gap-8">

                          <div className="space-y-3">
                            {activePrinting ? (
                              <img
                                src={activePrinting?.image ||
                                  card.imageLarge ||
                                  card.imageNormal
                                }
                                className="w-full max-w-[320px] rounded border border-neutral-800"
                                alt={detailList[detailIndex].name}
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
                              <h2 className="text-3xl font-semibold">
                                {detailList[detailIndex].name}
                              </h2>

                              <div className="text-sm text-neutral-400">
                                {detailList[detailIndex].typeLine}
                              </div>

                              <ManaCost manaCost={detailList[detailIndex].manaCost} />

                              <p className="whitespace-pre-line text-neutral-200">
                                {detailList[detailIndex].oracleText}
                              </p>

                              {detailList[detailIndex].flavorText && (
                                <p className="italic text-neutral-400">
                                  {detailList[detailIndex].flavorText}
                                </p>
                              )}
                            </section>

                            <hr className="border-neutral-800" />

                            <section className="space-y-2">
                              <h3 className="text-sm font-semibold uppercase tracking-wide">
                                Printings
                              </h3>

                              {cardPrintings ? (
                                <ul className="space-y-1 text-sm text-neutral-400">
                                  {cardPrintings.map((p, i) => (
                                    <li key={i}>
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
                              <h3 className="text-sm font-semibold uppercase tracking-wide">
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

                            <div
                              className="pointer-events-none sticky bottom-0 z-10 h-10"
                              style={{
                                background: "linear-gradient(to top, #0a0a0a, transparent)",
                              }}
                            />
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
    </div>
  );
}
