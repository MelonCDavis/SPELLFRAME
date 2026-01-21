export default function FoilSticker({ className = "" }) {
  return (
    <div
      className={`
        pointer-events-none
        absolute
        right-3
        top-[45%]
        z-30
        flex
        items-center
        justify-center
        h-5
        w-5
        rounded-full
        bg-yellow-100
        ${className}
      `}
      title="Foil"
    >
      <span className="text-[13px] leading-none text-white font-bold">
        ✨
      </span>
    </div>
  );
}
