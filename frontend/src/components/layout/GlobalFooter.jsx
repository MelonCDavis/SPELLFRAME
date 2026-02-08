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
                    flex 
                    flex-col
                    sm:flex-row 
                    justify-between 
                    items-center
                    gap-2
                "
            >
                {/* Left */}
                <div>
                    &copy; {year} Melon Davis -- SPELLFRAME All rights reserved.
                </div>
                {/* Right */}
                <div className= "flex gap-4 text-neutral-500">
                    <a 
                      href="https://github.com/MelonCDavis/SPELLFRAME"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-neutral-200 transition"
                    >
                        GitHub
                    </a>
                    <a
                      href="https://spellframe-rho.vercel.app/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-neutral-200 transition"
                    >
                        Live App
                    </a>
                </div>
            </div>
        </footer>
    )
}