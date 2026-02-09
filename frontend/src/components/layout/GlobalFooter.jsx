export default function GlobalFooter() {
    const year = new Date().getFullYear();
    return (
        <footer
          className="
            w-full
            border-t border-Neutral-800
            bg-Neutral-950
            text-neutral-400
            text-sm
            z-20
          "
        >
          <div 
            className="
              max-w-7xl 
              mx-auto 
              px-4 
              py-3 
              text-center
            "
          >
            &copy; {year} Melon Davis -- SPELLFRAME All rights reserved.
          </div>
        </footer>
    )
}