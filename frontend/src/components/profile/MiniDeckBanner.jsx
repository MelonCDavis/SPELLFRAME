import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { apiPost } from "../../services/apiClient";

export default function MiniDeckBanner({ deck, to, onToggleVisibility, onUpdateLikes }) {
  const commander = deck.commanders?.[0];
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  async function handleToggleLike(e) {
    e.stopPropagation();

    if (!isAuthenticated) return;

    try {
      const res = await apiPost(`/api/decks/${deck._id}/like`);

      onUpdateLikes?.(deck._id, res.likes);
    } catch (err) {
      console.error("Failed to toggle like", err);
    }
  }
  const isPublic = Boolean(deck.isPublic);

  const y = typeof deck.bannerSettings?.y === "number" ? deck.bannerSettings.y : 25;
  const rgb = Array.isArray(deck.bannerRGB) ? deck.bannerRGB : [168, 85, 247];

  const artUrl =
    commander?.imageLarge ||
    commander?.imageNormal ||
    commander?.imageSmall ||
    null;

  return (
    <div className="relative h-20 rounded-md overflow-hidden border border-neutral-800">
      <div
        className="absolute inset-0 z-0 bg-no-repeat"
        style={{
          backgroundImage: artUrl ? `url(${artUrl})` : undefined,
          backgroundSize: "auto 555%",
          backgroundPosition: `right ${y}%`,
        }}
      />

      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background: `
            linear-gradient(
              to right,
              rgba(10,10,10,0.95) 28%,
              rgba(10,10,10,0.65) 36%,
              rgba(10,10,10,0.35) 44%,
              rgba(10,10,10,0.15) 52%,
              transparent 65%
            )
          `,
        }}
      />

      <div
        className="pointer-events-none absolute inset-0 z-20"
        style={{
          background: `linear-gradient(
            to right,
            rgba(${rgb.join(",")},0.35) 0%,
            rgba(${rgb.join(",")},0.18) 45%,
            rgba(0,0,0,0.55) 80%
          )`,
        }}
      />

      <button
        type="button"
        onClick={() => to && navigate(to)}
        className="absolute inset-0 z-30 cursor-pointer"
        aria-label="Open deck"
      />

      <div className="relative z-40 px-4 py-3 pointer-events-none">
        <div className="font-semibold text-sm text-white truncate">
          {deck.name}
        </div>
        <div className="text-xs text-neutral-200 truncate">
          {deck.commanders?.map((c) => c.name).join(", ")}
        </div>
        <div className="text-[11px] text-neutral-300 truncate">
          by {deck.user?.username ?? "Unknown"}
        </div>
      </div>

      <div className="absolute right-3 bottom-2 z-50 flex gap-2">
        <div
          className="
            flex items-center gap-1
            text-xs
            px-2
            py-1
            rounded
            bg-black/50
            text-neutral-200
          "
        >
          <button
            type="button"
            onClick={handleToggleLike}
            className="
              hover:scale-110
              transition-transform
              cursor-pointer
            "
            aria-label="Like deck"
          >
            👍
          </button>

          <span className="select-none">
            {deck.likes ?? 0}
          </span>
        </div>

        {onToggleVisibility && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleVisibility(deck._id, !isPublic);
            }}
            className="
              text-xs
              px-2
              py-1
              rounded
              bg-black/50
              hover:bg-black/70
              text-neutral-200
            "
          >
            {isPublic ? "Public" : "Private"}
          </button>
        )}
      </div>
    </div>
  );
}
