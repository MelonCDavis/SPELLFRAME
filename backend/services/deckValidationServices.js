const DeckCard = require("../models/DeckCard");
const {
  commanderExceptions,
  pairingRules,
} = require("/config/commanderRules");

/**
 * Cards that explicitly allow multiple copies in Commander
 * (authoritative list – edit freely)
 */
const RELENTLESS_CARDS = new Set([
  "Relentless Rats",
  "Shadowborn Apostle",
  "Persistent Petitioners",
  "Rat Colony",
  "Dragon's Approach",
  "Nazgûl",
  "Slime Against Humanity",
  "Hare Apparent",
  "Seven Dwarves",
  "Templar Knight",
]);

const {
  getDeckColorIdentity,
  cardFitsColorIdentity,
} = require("/services/colorIdentityService");

/**
 * ─────────────────────────────────────────────
 * Helper functions
 * ─────────────────────────────────────────────
 */

function isBasicLand(card) {
  return card.type_line?.includes("Basic Land");
}

function allowsMultiple(card) {
  return isBasicLand(card) || RELENTLESS_CARDS.has(card.name);
}

function isLegendaryCreature(card) {
  return (
    card.type_line?.includes("Legendary") &&
    card.type_line?.includes("Creature")
  );
}

function isCommanderException(card) {
  return commanderExceptions.has(card.name);
}

function getPairingKeyword(card) {
  const text = card.oracle_text?.toLowerCase() || "";
  for (const rule of Object.values(pairingRules)) {
    if (text.includes(rule.keyword)) {
      return rule.keyword;
    }
  }
  return null;
}

/**
 * ─────────────────────────────────────────────
 * Commander deck validation
 * ─────────────────────────────────────────────
 */

async function validateCommanderDeck(deckId) {
  const deckCards = await DeckCard.find({ deck: deckId }).populate("card");

  if (!deckCards.length) {
    throw new Error("Deck has no cards");
  }

  // ─────────────────────────────────────────────
  // Commander validation
  // ─────────────────────────────────────────────
  const commanders = deckCards.filter(
    (dc) => dc.role === "commander"
  );

  if (commanders.length === 0) {
    throw new Error("Deck must have at least one commander");
  }

  for (const dc of commanders) {
    const card = dc.card;

    if (!isLegendaryCreature(card) && !isCommanderException(card)) {
      throw new Error(`"${card.name}" is not a legal commander`);
    }
  }

  // ─────────────────────────────────────────────
  // Color identity validation
  // ─────────────────────────────────────────────
  const deckColorIdentity = getDeckColorIdentity(deckCards);

  for (const dc of deckCards) {
    if (dc.role === "commander") continue;

    if (!cardFitsColorIdentity(dc.card, deckColorIdentity)) {
      throw new Error(
        `Card "${dc.card.name}" violates deck color identity`
      );
    }
  }

  if (commanders.length > 1) {
    const pairingKeywords = new Set(
      commanders
        .map((dc) => getPairingKeyword(dc.card))
        .filter(Boolean)
    );

    if (pairingKeywords.size !== 1) {
      throw new Error("Commander pairing types must match");
    }

    const pairingKey = [...pairingKeywords][0];
    const rule = Object.values(pairingRules).find(
      (r) => r.keyword === pairingKey
    );

    if (!rule) {
      throw new Error("Invalid commander pairing");
    }

    if (commanders.length > rule.max) {
      throw new Error(
        `Too many commanders for pairing rule (${pairingKey})`
      );
    }
  }

  // ─────────────────────────────────────────────
  // Mainboard validation (commanders NOT counted)
  // ─────────────────────────────────────────────
  const mainboardCards = deckCards.filter(
    (dc) => dc.role === "mainboard"
  );

  const mainboardCount = mainboardCards.reduce(
    (sum, dc) => sum + dc.quantity,
    0
  );

  if (mainboardCount !== 99) {
    throw new Error(
      `Mainboard must contain exactly 99 cards (found ${mainboardCount})`
    );
  }

  for (const dc of mainboardCards) {
    if (!allowsMultiple(dc.card) && dc.quantity !== 1) {
      throw new Error(
        `Card "${dc.card.name}" violates singleton rules`
      );
    }
  }

  // ─────────────────────────────────────────────
  // Sideboard validation
  // ─────────────────────────────────────────────
  const sideboardCards = deckCards.filter(
    (dc) => dc.role === "sideboard"
  );

  const sideboardCount = sideboardCards.reduce(
    (sum, dc) => sum + dc.quantity,
    0
  );

  if (sideboardCount > 10) {
    throw new Error("Sideboard may not exceed 10 cards");
  }

  return true;
}



module.exports = {
  validateCommanderDeck,
};
