const COLORS = {
  W: "bg-yellow-100 text-black",
  U: "bg-blue-500",
  B: "bg-neutral-800",
  R: "bg-red-500",
  G: "bg-green-500",
};

export default function ColorIdentityBar({ colors = [] }) {
  if (!colors.length) {
    return (
      <div className="mt-2 text-xs text-neutral-400">
        Colorless
      </div>
    );
  }

  return (
    <div className="mt-2 flex gap-1">
      {colors.map((c) => (
        <div
          key={c}
          className={`
            h-6 w-6 rounded-full
            flex items-center justify-center
            text-xs font-bold
            ${COLORS[c]}
          `}
        >
          {c}
        </div>
      ))}
    </div>
  );
}
