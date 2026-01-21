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

export default function DeckBuilderAdvancedSearch({
  selectedColors,
  setSelectedColors,
  selectedTypes,
  setSelectedTypes,
}) {
  function toggleColor(color) {
    setSelectedColors(prev =>
      prev.includes(color)
        ? prev.filter(c => c !== color)
        : [...prev, color]
    );
  }

  function toggleType(type) {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  }

  return (
    <div className="mt-4 space-y-4 rounded-md border border-neutral-800 bg-neutral-900 p-4">
      {/* Color Identity */}
      <div className="flex flex-wrap gap-2">
        {COLORS.map(c => {
          const active = selectedColors.includes(c);

          return (
            <button
              key={c}
              type="button"
              onClick={() => toggleColor(c)}
              className={`
                flex items-center justify-center
                w-10 h-10 rounded-full border transition
                ${
                  active
                    ? COLOR_STYLES[c]
                    : "border-neutral-700 opacity-70 hover:opacity-100"
                }
              `}
              title={`Filter by ${c.toUpperCase()}`}
            >
              <img src={MANA_ICONS[c]} alt={c} className="w-5 h-5" />
            </button>
          );
        })}
      </div>

      {/* Type Filters */}
      <div className="flex flex-wrap gap-3 text-sm">
        {TYPES.map(type => (
          <label key={type} className="flex items-center gap-1 capitalize">
            <input
              type="checkbox"
              checked={selectedTypes.includes(type)}
              onChange={() => toggleType(type)}
            />
            {type}
          </label>
        ))}
      </div>
    </div>
  );
}
