export function getColorIdentity(card) {
  if (!card) return [];

  if (Array.isArray(card.colorIdentity)) {
    return card.colorIdentity;
  }

  return [];
}

export function isWithinColorIdentity(deckColors = [], cardColors = []) {
  if (!Array.isArray(cardColors) || cardColors.length === 0) {
    return true; 
  }

  return cardColors.every((c) => deckColors.includes(c));
}
