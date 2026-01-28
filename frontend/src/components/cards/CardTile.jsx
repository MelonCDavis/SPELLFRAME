import { useState } from "react";
import FoilSticker from "../ui/FoilSticker";

export default function CardTile({
  card,
  onSelect,
  isSelected,
  showCommanderRestriction = false,
}) {
  // Support both direct Card objects AND wrapper shapes (e.g. deckCard.card)
  const c = card?.card ?? card;

  // 1) printing is intrinsically foil
  const printingIsFoil =
    (c?.nonfoil === false && c?.foil === true) ||
    (Array.isArray(c?.finishes) && c.finishes.length === 1 && c.finishes[0] === "foil");

  // 2) instance explicitly marked foil (deck / inventory)
  const instanceIsFoil =
    card?.isFoil === true ||
    card?.finish === "foil";

  // FINAL decision
  const showFoil = printingIsFoil || instanceIsFoil;

  // Support backend-normalized "cardFaces" AND raw Scryfall "card_faces"
  const faces = Array.isArray(c?.cardFaces)
    ? c.cardFaces
    : Array.isArray(c?.card_faces)
      ? c.card_faces
      : null;

  const hasFaceImages =
    Array.isArray(faces) &&
    faces.length > 1 &&
    faces.every((f) =>
      f?.imageNormal ||
      f?.image_uris?.normal ||
      f?.imageLarge ||
      f?.imageSmall ||
      f?.image_uris?.small
    );

  const [showBack, setShowBack] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);

  const faceImg = (f) =>
    f?.imageNormal ||
    f?.image_uris?.normal ||
    f?.imageLarge || 
    f?.imageSmall ||
    f?.image_uris?.small ||
    null;

  const rootImg =
    c?.imageLarge ||
    c?.imageNormal ||
    c?.image_uris?.normal ||
    c?.imageSmall ||
    c?.image_uris?.small ||
    null;

  const img = hasFaceImages
    ? showBack
      ? faceImg(faces[1])
      : faceImg(faces[0])
    : rootImg;


  const name = c?.name || "Unknown Card";
  const isLegal = c?.isCommanderLegal;

  const isBlocked = showCommanderRestriction && !isLegal;

  return (
    <div
      className={`
        relative aspect-63/88 overflow-hidden rounded-md border bg-neutral-900 transition
        ${
          isSelected
            ? "border-indigo-500 ring-2 ring-indigo-500 ring-offset-2 ring-offset-neutral-950"
            : isBlocked
              ? "border-neutral-800 opacity-50 cursor-not-allowed"
              : "border-neutral-700 cursor-pointer hover:outline-2 hover:outline-indigo-400 hover:shadow-[0_0_0_2px_rgba(99,102,241,0.95),0_0_24px_8px_rgba(99,102,241,0.6)]"
        }
      `}
      title={isBlocked ? `${name} — Not a legal commander` : name}
      onClick={() => {
        if (isBlocked) return;
        onSelect?.(card); // keep EXACT original selection payload
      }}
    >
      {img ? (
        <>
          <img
            src={img}
            alt={name}
            loading="lazy"
            className={`
              h-full w-full object-cover pointer-events-none
              transition-transform duration-300 ease-in-out
              origin-center
              ${isFlipping ? "scale-x-0" : "scale-x-100"}
            `}
          />
        </>
      ) : (
        <div className="flex h-full w-full items-center justify-center p-3 text-center text-xs text-neutral-400">
          No image for:
          <br />
          <span className="mt-1 block text-neutral-200">{name}</span>
        </div>
      )}

      {showFoil && <FoilSticker />}
      
      {/* Flip badge */}
      {hasFaceImages && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();

            if (isFlipping) return;

            setIsFlipping(true);

            // Collapse
            setTimeout(() => {
              setShowBack((v) => !v);
            }, 150);

            // Expand
            setTimeout(() => {
              setIsFlipping(false);
            }, 300);
          }}
          title="Flip card"
          className="
            absolute bottom-8 right-6 z-40
            h-12 w-12
            flex items-center justify-center
            rounded-full
            bg-black/40 backdrop-blur-sm
            border border-indigo-400/60
            text-2xl font-bold
            text-indigo-200
            hover:bg-black/55
            hover:text-indigo-100
            shadow-[0_0_0_2px_rgba(99,102,241,0.45),0_0_24px_10px_rgba(99,102,241,0.55)]
            transition
          "
        >
          ↺
        </button>
      )}

      {isBlocked && (
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="
              absolute top-1/2 left-1/2 w-[140%]
              -translate-x-1/2 -translate-y-1/2 -rotate-12
              bg-neutral-900/90 border-y border-neutral-700
              py-1.5 text-xs font-bold uppercase tracking-widest
              text-neutral-200 text-center
            "
          >
            Not a Commander
          </div>
        </div>
      )}
    </div>
  );
}
