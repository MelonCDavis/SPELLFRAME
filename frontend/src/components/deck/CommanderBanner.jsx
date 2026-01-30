import { useState, useEffect, useRef } from "react";
import BannerArtEditorModal from "./BannerArtEditorModal";

export default function CommanderBanner({
  deckName,
  setDeckName,
  commanders,
  deckColors,
  totalDeckCount,
  ownerName,
  ownerAvatar,
  isOwner = true,
  onColorChange,
  onSave,
  bannerSettings,
  onBannerSettingsChange,
}) {
  const primary = commanders?.[0];

  const artUrl = getArtCrop(primary)
    || primary?.imageLarge
    || primary?.imageNormal
    || null;

  const bannerArt =
  primary?.artCrop ||
  primary?.imageLarge ||
  primary?.imageNormal ||
  null;

  const [editing, setEditing] = useState(false);
  const [editingArt, setEditingArt] = useState(false);

  const [settings, setSettings] = useState({
    zoom: 1.2,
    x: 0.5,
    y: 0.28,
    leftFade: 0.7,
    rightFade: 0.2,
    color: "black",
    ...(bannerSettings || {}),
  });

  const leftA = Math.max(0.1, Math.min(0.85, settings.leftFade));
  const rightA = Math.max(0.1, Math.min(0.85, settings.rightFade));

  const BANNER_COLORS = {
    black: [10, 10, 10],
    white: [245, 245, 245],
    blue: [30, 64, 175],
    red: [153, 27, 27],
    green: [22, 101, 52],
    purple: [88, 28, 135],
    magenta: [140, 0, 120],
    teal: [15, 118, 110],
    gray: [55, 65, 81],
    bronze: [120, 90, 50],
  };

  const [r, g, b] =
    BANNER_COLORS[settings.color] ?? BANNER_COLORS.black;

  const [saveMenuOpen, setSaveMenuOpen] = useState(false);
  const saveMenuRef = useRef(null);

  function getArtCrop(card) {
    if (!card) return null;

    return (
      card.artCrop ||
      card.imageUris?.art_crop ||
      card.card_faces?.[0]?.imageUris?.art_crop ||
      null
    );
  }

  useEffect(() => {
    if (!saveMenuOpen) return;

    function onKey(e) {
        if (e.key === "Escape") {
        setSaveMenuOpen(false);
        }
  }
  function onClick(e) {
      if (
       saveMenuRef.current &&
       !saveMenuRef.current.contains(e.target)
       ) {
       setSaveMenuOpen(false);
       }
    } 
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);

    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [saveMenuOpen]);

   useEffect(() => {
    if (!isOwner && saveMenuOpen) {
      setSaveMenuOpen(false);
    }
  }, [isOwner, saveMenuOpen]);

    useEffect(() => {
    if (bannerSettings) {
      setSettings((prev) => ({ ...prev, ...bannerSettings }));
    }
  }, [bannerSettings]);


  return (
    <section className="relative z-20 w-screen left-1/2 right-1/2 -mx-[50vw] mb-6">
      <div className="relative">
        {/* LG+ — large */}
        <div
          className="hidden lg:block bg-no-repeat"
          style={{
            height: "340px",
            backgroundImage: artUrl ? `url(${artUrl})` : undefined,
            backgroundSize: `${(settings.zoom ?? 1) * 100}%`,
            backgroundPosition: `${(settings.x ?? 0.5) * 100}% ${(settings.y ?? 0.5) * 100}%`,
            WebkitMaskImage: `
              linear-gradient(
                to bottom,
                rgba(0,0,0,1) 0%,
                rgba(0,0,0,1) calc(100% - 15px),
                rgba(0,0,0,0.9) calc(100% - 12px),
                rgba(0,0,0,0.7) calc(100% - 9px),
                rgba(0,0,0,0.5) calc(100% - 6px),
                rgba(0,0,0,0.3) calc(100% - 3px),
                rgba(0,0,0,0) 100%
              )
            `,
            maskImage: `
              linear-gradient(
                to bottom,
                rgba(0,0,0,1) 0%,
                rgba(0,0,0,1) calc(100% - 15px),
                rgba(0,0,0,0.9) calc(100% - 12px),
                rgba(0,0,0,0.7) calc(100% - 9px),
                rgba(0,0,0,0.5) calc(100% - 6px),
                rgba(0,0,0,0.3) calc(100% - 3px),
                rgba(0,0,0,0) 100%
              )
            `,
          }}
        />

        {/* MD — medium */}
        <div
          className="hidden md:block lg:hidden bg-no-repeat"
          style={{
            height: "280px",
            backgroundImage: artUrl ? `url(${artUrl})` : undefined,
            backgroundSize: `${(settings.zoom ?? 1) * 100}%`,
            backgroundPosition: `${(settings.x ?? 0.5) * 100}% ${(settings.y ?? 0.5) * 100}%`,
                        WebkitMaskImage: `
              linear-gradient(
                to bottom,
                rgba(0,0,0,1) 0%,
                rgba(0,0,0,1) calc(100% - 15px),
                rgba(0,0,0,0.9) calc(100% - 12px),
                rgba(0,0,0,0.7) calc(100% - 9px),
                rgba(0,0,0,0.5) calc(100% - 6px),
                rgba(0,0,0,0.3) calc(100% - 3px),
                rgba(0,0,0,0) 100%
              )
            `,
            maskImage: `
              linear-gradient(
                to bottom,
                rgba(0,0,0,1) 0%,
                rgba(0,0,0,1) calc(100% - 15px),
                rgba(0,0,0,0.9) calc(100% - 12px),
                rgba(0,0,0,0.7) calc(100% - 9px),
                rgba(0,0,0,0.5) calc(100% - 6px),
                rgba(0,0,0,0.3) calc(100% - 3px),
                rgba(0,0,0,0) 100%
              )
            `,
          }}
        />

        {/* XS + SM — small */}
        <div
          className="block md:hidden bg-no-repeat"
          style={{
            height: "235px",
            backgroundImage: artUrl ? `url(${artUrl})` : undefined,
            backgroundSize: `${(settings.zoom ?? 1) * 100}%`,
            backgroundPosition: `${(settings.x ?? 0.5) * 100}% ${(settings.y ?? 0.5) * 100}%`,
                        WebkitMaskImage: `
              linear-gradient(
                to bottom,
                rgba(0,0,0,1) 0%,
                rgba(0,0,0,1) calc(100% - 15px),
                rgba(0,0,0,0.9) calc(100% - 12px),
                rgba(0,0,0,0.7) calc(100% - 9px),
                rgba(0,0,0,0.5) calc(100% - 6px),
                rgba(0,0,0,0.3) calc(100% - 3px),
                rgba(0,0,0,0) 100%
              )
            `,
            maskImage: `
              linear-gradient(
                to bottom,
                rgba(0,0,0,1) 0%,
                rgba(0,0,0,1) calc(100% - 15px),
                rgba(0,0,0,0.9) calc(100% - 12px),
                rgba(0,0,0,0.7) calc(100% - 9px),
                rgba(0,0,0,0.5) calc(100% - 6px),
                rgba(0,0,0,0.3) calc(100% - 3px),
                rgba(0,0,0,0) 100%
              )
            `,
          }}
        />
      </div>
      {/* LEFT fade */}
      <div
        className="pointer-events-none absolute inset-0 z-40"
        style={{
          background: `linear-gradient(to right,
            rgba(${r},${g},${b},${leftA}) 0%,
            rgba(${r},${g},${b},${leftA * 0.75}) 40%,
            rgba(${r},${g},${b},${leftA * 0.35}) 65%,
            transparent 80%
          )`,
        }}
      />

      {/* RIGHT fade */}
      <div
        className="pointer-events-none absolute inset-0 z-40"
        style={{
          background: `linear-gradient(to left,
            rgba(${r},${g},${b},${rightA}) 0%,
            rgba(${r},${g},${b},${rightA * 0.75}) 40%,
            rgba(${r},${g},${b},${rightA * 0.35}) 65%,
            transparent 80%
          )`,
        }}
      />

      <div className="absolute inset-0 flex items-end z-50">
        <div className="relative mx-auto w-full max-w-6xl px-4 pb-5 space-y-3">
            {/* Owner (avatar + name) */}
              {ownerName && (
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div
                    className="rounded-full overflow-hidden border border-white/15 bg-neutral-900 shrink-0"
                    style={{
                      width: "clamp(64px, 10vw, 112px)",
                      height: "clamp(64px, 10vw, 112px)",
                      backgroundImage: ownerAvatar?.image
                        ? `url(${ownerAvatar.image})`
                        : undefined,
                      backgroundSize: `${(ownerAvatar?.zoom ?? 1) * 100}%`,
                      backgroundPosition: `${(ownerAvatar?.x ?? 0.5) * 100}% ${(ownerAvatar?.y ?? 0.5) * 100}%`,
                      backgroundRepeat: "no-repeat",
                    }}
                  > 
                    {!ownerAvatar?.image && (
                      <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-white/60">
                        {ownerName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Owner name */}
                  <div
                    className=" font-semibold tracking-tight text-neutral-200 leading-tight"
                    style={{
                      fontSize: "clamp(22px, 4vw, 36px)",
                    }}
                  >
                    {ownerName}
                  </div>
                </div>
              )}
          {/* Deck name */}
          <input
            value={deckName}
            onChange={(e) => setDeckName(e.target.value)}
            disabled={!isOwner}
            className="
              w-full max-w-3xl bg-transparent font-semibold tracking-tight text-neutral-100 placeholder-neutral-400 leading-tight focus:outline-none disabled:cursor-default"
            style={{
              fontSize: "clamp(24px, 5vw, 38px)",
            }}
          />

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-300">
            <span className="truncate">
              {commanders?.map((c) => c.name).join(" / ")}
            </span>

            <div className="flex items-center gap-1">
              {deckColors?.map((c) => (
                <span
                  key={c}
                  className={`h-4 w-4 rounded-full mana mana-${c.toLowerCase()}`}
                />
              ))}
            </div>
            <div ref={saveMenuRef} className="relative inline-block">
                <button
                    type="button"
                    disabled={!isOwner}
                    onClick={() => {
                      if (!isOwner) return;
                      setSaveMenuOpen(v => !v);
                    }}
                    className={`ml-3 px-3 py-1.5 shadow-(--spellframe-glow) rounded-md border text-sm font-medium transition
                      ${
                        !isOwner
                          ? "border-neutral-800 text-neutral-500 opacity-50 cursor-not-allowed"
                          : "border-neutral-700 text-neutral-200 hover:border-neutral-400 hover:bg-neutral-800"
                      }
                    `}
                >
                    Save
                </button>

                {isOwner && saveMenuOpen && (
                    <div
                    className="
                        absolute right-0 mt-2 w-40 shadow-(--spellframe-glow) rounded-md border border-neutral-700 bg-neutral-950 z-50">
                    <button
                      type="button"
                      onClick={() => {
                        setSaveMenuOpen(false);
                        onSave?.("save");
                      }}
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-neutral-800"
                    >
                      Save
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSaveMenuOpen(false);
                        onSave?.("saveAs");
                      }}
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-neutral-800"
                    >
                      Save As…
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSaveMenuOpen(false);
                        onSave?.("saveAndExit");
                      }}
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-neutral-800"
                    >
                      Save & Exit
                    </button>
                    </div>
                )}
            </div>

            <div className="ml-auto flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              {/* XS: count ABOVE edit */}
              <span className="sm:hidden text-xs text-neutral-300/80 text-right">
                {totalDeckCount} / 100
              </span>

              {isOwner && (
                <button
                  type="button"
                  onClick={() => {
                    setSettings({
                      y: settings.y,
                      leftFade: settings.leftFade,
                      rightFade: settings.rightFade,
                      color: settings.color,
                    });
                    setEditing(true);
                  }}
                  className="px-3 py-1.5 shadow-(--spellframe-glow) rounded-md border border-neutral-700 text-sm font-medium text-neutral-200 hover:border-neutral-400 hover:bg-neutral-800 transition"
                >
                  Edit
                </button>
              )}

              {/* SM+: count INLINE */}
              <span className="hidden sm:inline text-neutral-300/80">
                {totalDeckCount} / 100
              </span>
            </div>
          </div>
        </div>
      </div>
      {editing && isOwner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setEditing(false)}
          />

          <div className="relative w-full max-w-md rounded-md border border-neutral-700 bg-neutral-950 p-4 space-y-4 shadow-(--spellframe-glow)">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-neutral-200">
                Edit Banner
              </h3>

              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded border shadow-(--spellframe-glow) border-neutral-500/40 px-2 py-0.5 text-[11px] text-neutral-200/80 hover:border-neutral-300/60 hover:text-neutral-100 transition">
                Done
              </button>
            </div>

            {/* Banner art editor */}
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setEditingArt(true);
                  }}
                  className="
                    px-4 py-2
                    rounded-md
                    border border-neutral-600
                    text-sm font-medium text-neutral-200
                    shadow-(--spellframe-glow)
                    transition
                    hover:border-neutral-400
                    hover:bg-neutral-800
                  "
                >
                  Edit Banner Art…
                </button>
              </div>

            {/* Left fade */}
            <div>
              <label className="block text-xs text-neutral-300/80 mb-1 z-40">
                Left fade strength
              </label>
              <input
                type="range"
                min="10"
                max="85"
                value={Math.round(leftA * 100)}
                onChange={(e) => {
                  const next = { ...settings, leftFade: Number(e.target.value) / 100 };
                  setSettings(next);
                  onBannerSettingsChange?.(next);
                }}

                className="w-full"
              />
            </div>

            {/* Right fade */}
            <div>
              <label className="block text-xs text-neutral-300/80 mb-1 z-40">
                Right fade strength
              </label>
              <input
                type="range"
                min="10"
                max="85"
                value={Math.round(rightA * 100)}
                onChange={(e) => {
                  const next = { ...settings, rightFade: Number(e.target.value) / 100 };
                  setSettings(next);
                  onBannerSettingsChange?.(next);
                }}

                className="w-full"
              />
            </div>

            {/* Color selector */}
            <div>
              <label className="block text-xs text-neutral-300/80 mb-2">
                Banner color
              </label>
              <div className="flex flex-wrap gap-2">
                {Object.keys(BANNER_COLORS).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      const next = { ...settings, color: key };
                      setSettings(next);
                      onBannerSettingsChange?.(next);
                      onColorChange?.(BANNER_COLORS[key]);
                    }}

                    className={`h-5 w-5 rounded-full border ${
                      settings.color === key
                        ? "border-neutral-100"
                        : "border-neutral-600"
                    }`}
                    style={{
                      backgroundColor: `rgb(${BANNER_COLORS[key].join(",")})`,
                    }}
                    title={key}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      {editingArt && (
        <BannerArtEditorModal
          image={bannerArt}
          value={settings}
          onChange={(next) => {
            setSettings(next);
            onBannerSettingsChange?.(next);
          }}
          onClose={() => {
            setEditingArt(false);
            setEditing(true);
          }}
        />
      )}
    </section>
  );
}
