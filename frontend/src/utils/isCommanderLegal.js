export function isCommanderLegal(card) {
  if (!card) return false;

  const type = card.typeLine || "";
  const text = card.oracleText || "";

  if (type.includes("Legendary") && type.includes("Creature")) {
    return true;
  }

  if (
    type.includes("Legendary") &&
    type.includes("Artifact") &&
    (type.includes("Vehicle") || type.includes("Spacecraft"))
  ) {
    return true;
  }

  if (text.toLowerCase().includes("can be your commander")) {
    return true;
  }

  return false;
}
