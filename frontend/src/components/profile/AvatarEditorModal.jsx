import { useState, useEffect } from "react";
import AvatarCardPicker from "./AvatarCardPicker";
import AvatarCropper from "./AvatarCropper";
import { apiPatch } from "../../services/apiClient";

export default function AvatarEditorModal({ user, onClose, onSaved }) {
  const [card, setCard] = useState(null);
  const [crop, setCrop] = useState({
    zoom: 1,
    x: 0.5,
    y: 0.5,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSave() {
    if (!card || saving) return;

    console.log("AVATAR SAVE PAYLOAD", {
        source: "card",
        cardId: card.scryfallId,
        zoom: crop.zoom,
        x: crop.x,
        y: crop.y,
    });

    try {
        setSaving(true);

        const res = await apiPatch("/api/users/me/avatar", {
        source: "card",
        cardId: card.scryfallId,
        image: card.image,
        zoom: crop.zoom,
        x: crop.x,
        y: crop.y,
        });

        console.log("AVATAR SAVE RESPONSE", res);

        onSaved?.(res);
        onClose();
    } catch (err) {
        console.error("Avatar save failed", err);
    } finally {
        setSaving(false);
    }
    }


  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4">
      <div className="absolute inset-0 pointer-events-none blur-3xl opacity-40 bg-indigo-500/20" />

      <div
        className="
          relative
          w-full max-w-lg rounded-md bg-neutral-900 p-6 space-y-4
          shadow-(--spellframe-glow)
        "
      >
        <h2 className="text-lg font-semibold">Choose Avatar</h2>

        {!card ? (
          <AvatarCardPicker user={user} onSelect={setCard} />
        ) : (
          <AvatarCropper
            image={card.image}
            value={crop}
            onChange={setCrop}
          />
        )}

        <div className="flex justify-end gap-3">
          <button
             type="button"
             onClick={onClose}
             className="
               text-sm text-neutral-400
               transition
               hover:text-neutral-100
               hover:shadow-(--spellframe-glow)
               rounded px-2 py-1
             "
          >
            Cancel
          </button>


          {card && (
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="rounded bg-indigo-600 px-3 py-1 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
