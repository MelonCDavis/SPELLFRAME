const IMPORT_REGEX = /^[\p{L}\p{N}\s:'"(),:.\-!\/\\&\n]{1,6000}$/u;

function validateDeckImport(raw) {
  if (typeof raw !== "string") {
    return { ok: false, error: "Invalid import data." };
  }

  const normalized = raw.replace(/\r\n/g, "\n").trim();

  if (normalized.length === 0) {
    return { ok: false, error: "Deck list is empty." };
  }

  if (normalized.length > 6000) {
    return { ok: false, error: "Deck list too long." };
  }

  if (!IMPORT_REGEX.test(normalized)) {
    return {
      ok: false,
      error: "Deck list contains unsupported characters.",
    };
  }

  const lines = normalized
    .split("\n")
    .map(l => l.trim())
    .filter(Boolean);

  if (lines.length > 110) {
    return {
      ok: false,
      error: "Deck import limited to 110 cards.",
    };
  }

  return {
    ok: true,
    lines,
  };
}

module.exports = {
  validateDeckImport,
};
