/**
 * Explicit Commander legality rules
 * This file is intentionally boring and explicit.
 * Update as Wizards adds new exceptions.
 */

module.exports = {
  // ─────────────────────────────────────────────
  // Non-creature commanders explicitly allowed
  // ─────────────────────────────────────────────
  commanderExceptions: new Set([
    // Planeswalkers that can be commanders
    "Teferi, Temporal Archmage",
    "Daretti, Scrap Savant",
    "Freyalise, Llanowar's Fury",
    "Nahiri, the Lithomancer",
    "Ob Nixilis of the Black Oath",
    "Sorin, Lord of Innistrad",
    "Tevesh Szat, Doom of Fools",
    "Jeska, Thrice Reborn",

    // Legendary Vehicles
    "Shorikai, Genesis Engine",
  ]),

  // ─────────────────────────────────────────────
  // Pairing mechanics
  // ─────────────────────────────────────────────
  pairingRules: {
    partner: {
      keyword: "partner",
      max: 2,
    },

    background: {
      keyword: "choose a background",
      max: 2, // creature + background
    },

    doctorsCompanion: {
      keyword: "doctor's companion",
      max: 2,
    },

    friendsForever: {
      keyword: "friends forever",
      max: 2,
    },
  },
};
