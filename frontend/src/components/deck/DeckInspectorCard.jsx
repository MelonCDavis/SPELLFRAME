import { useNavigate } from "react-router-dom";

export default function DeckInspectorCard({
  deck,
  onClose,
  onToggleLike,
  isLiked,
}) {
  const navigate = useNavigate();

  if (!deck) return null;

  const commander = deck.commanders?.[0];
  const rgb = Array.isArray(deck.bannerRGB) ? deck.bannerRGB : [168, 85, 247];
  const y =
    typeof deck.bannerSettings?.y === "number"
      ? deck.bannerSettings.y
      : 25;

  const artUrl =
    commander?.imageLarge ||
    commander?.imageNormal ||
    commander?.imageSmall ||
    null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />

      {/* CARD */}
      <div className="relative w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950 shadow-2xl flex flex-col">

        <div className="relative h-44 overflow-hidden">
          {artUrl && (
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${artUrl})`,
                backgroundSize: "auto 520%",
                backgroundPosition: `right ${y}%`,
              }}
            />
          )}

          {/* dark fade */}
          <div
            className="absolute inset-0"
            style={{
              background: `
                linear-gradient(
                  to bottom,
                  rgba(0,0,0,0.15),
                  rgba(0,0,0,0.85)
                )
              `,
            }}
          />

          {/* color tint */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(
                to right,
                rgba(${rgb.join(",")},0.35),
                rgba(0,0,0,0.85)
              )`,
            }}
          />

          {/* HEADER CONTENT */}
          <div className="relative z-10 p-5 space-y-1">
            <h2 className="text-2xl font-semibold text-white">
              {deck.name}
            </h2>
            <div className="text-sm text-neutral-200">
              {deck.commanders?.map((c) => c.name).join(", ")}
            </div>
          </div>

          {/* LIKE BUTTON */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleLike(deck._id);
            }}
            className="
              absolute
              top-4
              right-4
              z-20
              flex
              items-center
              gap-1
              px-3
              py-1.5
              rounded-full
              bg-black/60
              text-sm
              text-neutral-200
              hover:bg-black/80
            "
          >
            👍 {deck.likes ?? 0}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <h3 className="text-sm uppercase tracking-wide text-neutral-400">
            Decklist
          </h3>

          {Array.isArray(deck.deckCards) && deck.deckCards.length > 0 ? (
            <ul className="space-y-1 text-sm">
              {deck.deckCards.map((entry, i) => (
                <li
                  key={i}
                  className="flex justify-between text-neutral-200"
                >
                  <span>{entry.card?.name}</span>
                  <span className="text-neutral-400">
                    x{entry.quantity}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-neutral-500">
              Deck list unavailable.
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-neutral-800 px-5 py-4">
          <button
            onClick={onClose}
            className="text-sm text-neutral-400 hover:text-neutral-200"
          >
            Close
          </button>

          <button
            onClick={() => navigate(`/decks/${deck._id}`)}
            className="
              rounded-md
              px-4
              py-2
              text-sm
              font-semibold
              text-white
              bg-indigo-600
              hover:bg-indigo-500
            "
          >
            View Full Deck
          </button>
        </div>
      </div>
    </div>
  );
}
