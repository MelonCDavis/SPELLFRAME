export default function GlobalFooter() {
    const year = new Date().getFullYear();
    return (
        <footer
          className="
            w-full
            border-t border-Neutreal-800
            bg-Neutreal-950
            text-neutral-400
            text-sm
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