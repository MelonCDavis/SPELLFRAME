import CardTile from "./CardTile";

function getCardKey(card, index) {
  if (card?._inventoryKey) return card._inventoryKey;
  if (card?.scryfallId) return card.scryfallId;

  const oracle = card?.oracleId ?? "no-oracle";
  const set = card?.setCode ?? "no-set";
  const cn = card?.collectorNumber ?? "no-cn";
  const name = card?.name ?? "no-name";
  const finish = card?.finish ?? "no-finish";

  return `${oracle}:${set}:${cn}:${finish}:${name}:${index}`;
}

function normName(name) {
  return (name ?? "").trim().toLowerCase();
}

function defaultIdentityKey(card) {
  if (!card) return null;
  if (card.oracleId) return `oracle:${card.oracleId}`;
  if (card.name) return `name:${normName(card.name)}`;
  if (card.scryfallId) return `scry:${card.scryfallId}`;
  return null;
}

export default function CardGrid({
  cards = [],
  loading = false,
  selectedIds, 
  onSelect,
  renderOverlay,
  identityKey,
  showCommanderRestriction = false,
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="aspect-63/88 rounded-md bg-neutral-800 border border-neutral-700"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
      {cards.map((card, index) => {
        const key = getCardKey(card, index);
        const keyFn = identityKey ?? defaultIdentityKey;
        const k = keyFn(card);
        const isAlreadySelected = !!(k && selectedIds?.has(k));

        return (
          <div
            key={key}
            className={`relative transition ${
              isAlreadySelected ? "opacity-25 grayscale" : "hover:scale-[1.02]"
            }`}
          >
            <CardTile
              card={card}
              onSelect={(picked) => {
                if (isAlreadySelected) return;
                onSelect?.(picked);
              }}
              showCommanderRestriction={showCommanderRestriction}
            />

            {isAlreadySelected && (
              <div className="absolute top-1 right-1 text-[10px] px-1.5 py-0.5 rounded bg-neutral-950/80 text-neutral-300 border border-neutral-800">
                In Deck
              </div>
            )}

            {renderOverlay?.(card)}
          </div>
        );
      })}
    </div>
  );
}
