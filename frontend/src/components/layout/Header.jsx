export default function Header() {
  return (
    <header className="
      flex items-center justify-between
      px-4 py-3
      border-b border-neutral-800
      bg-neutral-950
    ">
      <h1 className="text-lg font-semibold">
        Commander Builder
      </h1>

      <button
        className="
          text-xl
          hover:opacity-80
        "
        aria-label="Toggle theme"
      >
        🌙
      </button>
    </header>
  );
}
