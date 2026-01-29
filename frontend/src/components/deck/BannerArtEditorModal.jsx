import { useEffect, useRef, useState } from "react";

export default function BannerArtEditorModal({
  image,
  value,
  onChange,
  onClose,
}) {
  const containerRef = useRef(null);
  const lastPos = useRef(null);
  const [dragging, setDragging] = useState(false);

  const zoom = value.zoom ?? 1;
  const x = value.x ?? 0.5;
  const y = value.y ?? 0.5;

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function startDrag(e) {
    e.preventDefault();
    setDragging(true);
    lastPos.current = { x: e.clientX, y: e.clientY };
  }

  function stopDrag() {
    setDragging(false);
    lastPos.current = null;
  }

  function onMove(e) {
    if (!dragging || !lastPos.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const dx = (e.clientX - lastPos.current.x) / rect.width;
    const dy = (e.clientY - lastPos.current.y) / rect.height;

    lastPos.current = { x: e.clientX, y: e.clientY };

    onChange({
      ...value,
      x: Math.min(1, Math.max(0, x - dx)),
      y: Math.min(1, Math.max(0, y - dy)),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div
        ref={containerRef}
        onMouseDown={startDrag}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
        onMouseMove={onMove}
        className="
          relative
          w-full max-w-5xl
          rounded-md
          overflow-hidden
          cursor-grab active:cursor-grabbing
          shadow-(--spellframe-glow)
        "
        style={{ height: "275px" }}
      >
        <div
          className="absolute inset-0 bg-no-repeat"
          style={{
            backgroundImage: image ? `url(${image})` : undefined,
            backgroundSize: `${zoom * 100}%`,
            backgroundPosition: `${x * 100}% ${y * 100}%`,
          }}
        />

        {/* readability fade */}
        <div className="pointer-events-none absolute inset-0 `bg-linear-to-t` from-black/70 via-black/30 to-transparent" />
      </div>

      {/* Controls */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full max-w-xl rounded-md border border-neutral-700 bg-neutral-950 p-4 space-y-4 shadow-(--spellframe-glow)">
        <div>
          <label className="block text-xs text-neutral-300 mb-1">
            Zoom
          </label>
          <input
            type="range"
            min="1"
            max="2.5"
            step="0.01"
            value={zoom}
            onChange={(e) =>
              onChange({ ...value, zoom: Number(e.target.value) })
            }
            className="w-full"
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-neutral-400 hover:text-neutral-100 transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
