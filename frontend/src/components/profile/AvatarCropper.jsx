import { useRef, useState } from "react";

export default function AvatarCropper({ image, value, onChange }) {
  const containerRef = useRef(null);
  const lastPos = useRef(null);
  const [dragging, setDragging] = useState(false);

  const { zoom, x, y } = value;

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
    if (!dragging || !lastPos.current) return;

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
    <div className="space-y-4">
      <div
        ref={containerRef}
        onMouseDown={startDrag}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
        onMouseMove={onMove}
        className="
          mx-auto h-40 w-40 rounded-full overflow-hidden
          border border-neutral-700 cursor-grab active:cursor-grabbing
        "
      >
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `url(${image})`,
            backgroundSize: `${zoom * 100}%`,
            backgroundPosition: `${x * 100}% ${y * 100}%`,
            backgroundRepeat: "no-repeat",
          }}
        />
      </div>

      <div>
        <label className="block text-xs text-neutral-400 mb-1">
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
    </div>
  );
}
