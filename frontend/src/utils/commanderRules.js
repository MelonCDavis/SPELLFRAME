export function supportsPartner(card) {
  if (!card) return false;

  const text = card.oracleText ?? "";
  return (
    text.includes("Partner") ||
    text.includes("Friends forever")
  );
}

export function supportsDoctorsCompanion(card) {
  if (!card) return false;

  return card.typeLine?.includes("Doctor");
}

export function supportsBackground(card) {
  if (!card) return false;

  return card.oracleText?.includes("Choose a Background");
}
