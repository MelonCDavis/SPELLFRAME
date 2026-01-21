const HEADER_WORDS = new Set([
  "commander",
  "companions",
  "creatures",
  "instants",
  "sorceries",
  "enchantments",
  "artifacts",
  "planeswalkers",
  "lands",
  "land",
  "sideboard",
  "maybeboard",
  "considering",
]);

function isSectionHeader(line) {
  const raw = line.trim().toLowerCase();

  if (!raw) return true;

  if (HEADER_WORDS.has(raw)) return true;
  if (raw.startsWith("#")) return true;
  if (raw.startsWith("//")) return true;
  if (raw.startsWith("==")) return true;
  if (raw.endsWith(":") && HEADER_WORDS.has(raw.slice(0, -1).trim())) return true;

  const headerLike = raw.replace(/\(\d+\)/g, "").trim();
  if (HEADER_WORDS.has(headerLike)) return true;

  return false;
}

function cleanCardName(name) {
  let n = name.trim();

  n = n.split("//")[0].trim();

  n = n.replace(/^(sb|sideboard|mb|maybeboard)\s*:\s*/i, "").trim();

  n = n.replace(/\s*\([A-Za-z0-9]+\)\s*\d+\s*$/g, "").trim();

  n = n.replace(/\s+\d+\s*$/g, "").trim();

  n = n.replace(/^"+|"+$/g, "").trim();

  return n;
}

function detectRole(line, currentRole) {
  const raw = line.trim().toLowerCase();

  if (/^(sb|sideboard)\s*:/i.test(line)) return "sideboard";
  if (/^(mb|maybeboard)\s*:/i.test(line)) return "mainboard";

  if (raw === "commander" || raw === "commanders") return "commander";
  if (raw === "sideboard") return "sideboard";
  if (raw === "maybeboard" || raw === "considering") return "mainboard";

  return currentRole;
}

export function parseDecklistText(text) {
  const lines = (text || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  let currentRole = "mainboard";

  const entries = [];
  const skipped = []; 

  for (const line of lines) {
    const nextRole = detectRole(line, currentRole);

    if (isSectionHeader(line)) {
      currentRole = nextRole;
      continue;
    }

    currentRole = nextRole;

    const normalized = line.replace(/^[-*]\s+/, "").trim();

    const m = normalized.match(/^(\d+)\s*x?\s+(.+)$/i);

    let quantity = 1;
    let namePart = normalized;

    if (m) {
      quantity = Number(m[1]);
      namePart = m[2];
    } else {
      quantity = 1;
      namePart = normalized;
    }

    const cardName = cleanCardName(namePart);

    if (!cardName) {
      skipped.push({ line, reason: "empty_after_clean" });
      continue;
    }

    if (isSectionHeader(cardName)) {
      skipped.push({ line, reason: "header_like" });
      continue;
    }

    entries.push({
      quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
      cardName,
      role: currentRole,
      rawLine: line,
    });
  }

  return { entries, skipped };
}