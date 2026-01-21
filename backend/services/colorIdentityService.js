function getCardColorIdentity(card) {
  const colors = new Set();

  if (typeof card.mana_cost === "string") {
    const matches = card.mana_cost.match(/{([WUBRG])}/g) || [];
    for (const match of matches) {
      colors.add(match.replace(/[{}]/g, ""));
    }
  }

  if (Array.isArray(card.color_identity)) {
    for (const c of card.color_identity) {
      colors.add(c);
    }
  }

  return colors;
}

function expandsColorIdentity(card) {
  const text = card.oracle_text?.toLowerCase() || "";

  return (
    card.type_line?.includes("Legendary") && card.type_line?.includes("Creature") ||
    text.includes("partner") ||
    text.includes("friends forever") ||
    text.includes("choose a background") ||
    text.includes("doctor's companion") ||
    text.includes("can be your commander")
  );
}

function getDeckColorIdentity(deckCards) {
  const identity = new Set();

  for (const dc of deckCards) {
    if (dc.role === "commander" || expandsColorIdentity(dc.card)) {
      const cardColors = getCardColorIdentity(dc.card);
      for (const color of cardColors) {
        identity.add(color);
      }
    }
  }

  return identity;
}

function cardFitsColorIdentity(card, allowedColors) {
  const cardColors = getCardColorIdentity(card);

  for (const color of cardColors) {
    if (!allowedColors.has(color)) {
      return false;
    }
  }

  return true;
}

module.exports = {
  getDeckColorIdentity,
  cardFitsColorIdentity,
};
