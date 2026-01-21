export default function CommanderFaqPage() {
  return (
      <div className="faq-bg min-h-dvh pt-11">
        <div className="max-w-4xl mx-auto space-y-12 faq">

          <details className="group rounded-lg border-5 border-neutral-800 bg-neutral-700 p-6">
            <summary className="cursor-pointer list-none text-2xl rounded font-semibold text-neutral-100 flex items-center justify-between">
              Commander Rules
              <span className="text-neutral-400 group-open:rotate-180 transition">▾</span>
            </summary>

            <div className="mt-6 space-y-6 text-neutral-200 leading-relaxed">

              <p>
                Before reading the rules below, please read the philosophy of Commander.
                Simply following the rules is not sufficient to ensure a good play experience.
              </p>

              <section className="space-y-2">
                <h3 className="text-lg font-semibold text-neutral-100">
                  Deck Construction
                </h3>

                <ul className="list-disc list-inside space-y-1">
                  <li>Players choose a legendary creature as the commander for their deck.</li>

                  <li>
                    A card’s color identity includes its color and any mana symbols in its
                    rules text. Cards in a deck may not include colors outside the commander’s
                    color identity.
                  </li>

                  <li>
                    A Commander deck contains exactly 100 cards, including the commander.
                    Companions must obey all deck-building rules and effectively act as a
                    101st card.
                  </li>

                  <li>
                    With the exception of basic lands, no two cards may share the same English
                    name. Some cards (such as <em>Relentless Rats</em>) override this rule.
                  </li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-lg font-semibold text-neutral-100">
                  Gameplay
                </h3>

                <ul className="list-disc list-inside space-y-1">
                  <li>Players begin the game with 40 life.</li>

                  <li>
                    Commanders begin in the command zone and may be cast normally.
                    Each time a commander is cast from the command zone, it costs an
                    additional {`{2}`} for each previous cast.
                  </li>

                  <li>
                    If a commander would move to a graveyard, exile, hand, or library,
                    its owner may return it to the command zone instead.
                  </li>

                  <li>
                    Commander status is tied to the physical card and cannot be copied,
                    removed, or overwritten.
                  </li>

                  <li>
                    A player dealt 21 combat damage by the same commander over the course
                    of the game loses the game.
                  </li>

                  <li>
                    Effects that bring cards from outside the game (such as Wishes) do not
                    function in Commander.
                  </li>
                </ul>
              </section>
            </div>
          </details>

          <details className="group rounded-lg border-5 border-neutral-800 bg-neutral-700 p-6">
            <summary className="cursor-pointer list-none text-2xl font-semibold text-neutral-100 flex items-center justify-between">
              Philosophy of Commander
              <span className="text-neutral-400 group-open:rotate-180 transition">▾</span>
            </summary>

            <div className="mt-6 space-y-6 text-neutral-200 leading-relaxed">

              <p>
                Commander is not a traditional Magic format. While other formats emphasize
                optimization and zero-sum competition, Commander prioritizes expression,
                experience, and social play.
              </p>

              <section className="space-y-2">
                <h3 className="text-lg font-semibold text-neutral-100">
                  Social
                </h3>

                <p>
                  Commander is a shared experience. While Magic is inherently competitive,
                  Commander prioritizes social interaction whenever competition conflicts
                  with enjoyment.
                </p>

                <ul className="list-disc list-inside space-y-1">
                  <li>Encourage positive, communal play experiences</li>
                  <li>Help players communicate expectations before games</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-lg font-semibold text-neutral-100">
                  Creative
                </h3>

                <p>
                  Commander is a format for creative expression, using nearly the entire
                  history of Magic to build decks that tell stories or explore mechanics.
                </p>

                <ul className="list-disc list-inside space-y-1">
                  <li>Encourage diverse deckbuilding approaches</li>
                  <li>Maximize the usable card pool</li>
                  <li>Incorporate new Magic content organically</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-lg font-semibold text-neutral-100">
                  Stable
                </h3>

                <p>
                  Commander players invest emotionally in their decks. Stability ensures
                  those investments remain meaningful over time.
                </p>

                <ul className="list-disc list-inside space-y-1">
                  <li>Avoid unnecessary or reactionary changes</li>
                  <li>Minimize maintenance burdens on players</li>
                </ul>

                <p className="pt-2 text-neutral-400">
                  The Rules Committee balances these principles whenever they come into
                  conflict.
                </p>
              </section>
            </div>
          </details>

          <section className="space-y-6">
            <h2 className="text-3xl font-semibold text-neutral-100">
              Frequently Asked Questions
            </h2>

            <ul className="space-y-2 text-amber-100">
              <li><a href="#official-rules">What does it mean for these to be the “official rules”?</a></li>
              <li><a href="#who-makes-rules">Who makes the official rules?</a></li>
              <li><a href="#rule-zero">What is Rule Zero? Can I break the rules?</a></li>
              <li><a href="#social-contract">What is the Social Contract?</a></li>
              <li><a href="#hybrid-mana">Why does hybrid mana work the way it does?</a></li>
              <li><a href="#planeswalkers">Why can’t all planeswalkers be commanders?</a></li>
              <li><a href="#infect">Why is infect still 10?</a></li>
              <li><a href="#wishboard">Does Commander have a wishboard?</a></li>
              <li><a href="#proxies">Are silver-bordered or proxy cards allowed?</a></li>
              <li><a href="#mld">Is mass land destruction allowed?</a></li>
              <li><a href="#companions">Can my deck have a Companion?</a></li>
              <li><a href="#tournaments">How should I run a Commander tournament?</a></li>
            </ul>
          </section>

          <section id="official-rules" className="space-y-3 scroll-mt-24">
            <h3 className="text-xl font-semibold">
              What does it mean for these to be the “official rules”?
            </h3>
            <p className="text-neutral-200">
              These rules are used by most of the Commander community, including
              Wizards of the Coast, CommandFests, and major events.
            </p>
            <p className="text-neutral-200">
              Commander exists to help players find others looking for the same
              experience. The rules provide a shared baseline for discussion.
            </p>
          </section>

          <section id="who-makes-rules" className="space-y-3 scroll-mt-24">
            <h3 className="text-xl font-semibold">
              Who makes the official rules?
            </h3>
            <p className="text-neutral-200">
              The Commander Rules Committee (RC) sets the rules, with input from the
              Commander Advisory Group (CAG).
            </p>
          </section>

          <section id="rule-zero" className="space-y-3 scroll-mt-24">
            <h3 className="text-xl font-semibold">
              What is Rule Zero? Can I break the rules?
            </h3>
            <p className="text-neutral-200">
              Rule Zero is the understanding that playgroups can modify rules by
              mutual agreement to maximize fun.
            </p>
            <p className="text-neutral-200">
              Rule Zero is about consensus — not unilateral changes.
            </p>
          </section>

          <section id="social-contract" className="space-y-3 scroll-mt-24">
            <h3 className="text-xl font-semibold">
              What is the Social Contract?
            </h3>
            <p className="text-neutral-200">
              The social contract emphasizes shared enjoyment over winning. Games
              should be fun for everyone involved.
            </p>
          </section>

          <section id="hybrid-mana" className="space-y-3 scroll-mt-24">
            <h3 className="text-xl font-semibold">
              Why does hybrid mana work the way it does?
            </h3>
            <p className="text-neutral-200">
              Hybrid mana contributes all of its colors to a card’s color identity,
              preserving deck diversity and rules clarity.
            </p>
          </section>

          <section id="planeswalkers" className="space-y-3 scroll-mt-24">
            <h3 className="text-xl font-semibold">
              Why can’t all planeswalkers be commanders?
            </h3>
            <p className="text-neutral-200">
              Planeswalkers as commanders would lead to longer, less interactive,
              more repetitive games.
            </p>
          </section>

          <section id="infect" className="space-y-3 scroll-mt-24">
            <h3 className="text-xl font-semibold">
              Why is infect still 10?
            </h3>
            <p className="text-neutral-200">
              Increasing the infect threshold would make the strategy non-viable and
              add complexity without benefit.
            </p>
          </section>

          <section id="wishboard" className="space-y-3 scroll-mt-24">
            <h3 className="text-xl font-semibold">
              Does Commander have a wishboard?
            </h3>
            <p className="text-neutral-200">
              No. Wishes do not function by default due to ambiguity and balance
              concerns.
            </p>
          </section>

          <section id="proxies" className="space-y-3 scroll-mt-24">
            <h3 className="text-xl font-semibold">
              Are silver-bordered or proxy cards allowed?
            </h3>
            <p className="text-neutral-200">
              Only official Magic cards are allowed unless the group agrees otherwise.
            </p>
          </section>

          <section id="mld" className="space-y-3 scroll-mt-24">
            <h3 className="text-xl font-semibold">
              Is mass land destruction allowed?
            </h3>
            <p className="text-neutral-200">
              Yes — but moderation and communication are key.
            </p>
          </section>

          <section id="companions" className="space-y-3 scroll-mt-24">
            <h3 className="text-xl font-semibold">
              Can my deck have a Companion?
            </h3>
            <p className="text-neutral-200">
              Yes, if the deck meets the companion’s criteria. Some companions are
              excluded due to format constraints.
            </p>
          </section>

          <section id="tournaments" className="space-y-3 scroll-mt-24">
            <h3 className="text-xl font-semibold">
              How should I run a Commander tournament?
            </h3>
            <p className="text-neutral-200">
              Commander is poorly suited for competitive tournaments. Open play and
              minimal prizing work best.
            </p>
          </section>
        </div>
      </div>
  );
}
