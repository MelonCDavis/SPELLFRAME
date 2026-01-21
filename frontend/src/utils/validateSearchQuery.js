const SEARCH_REGEX = /^[A-Za-z0-9'.,:\-\/\\`;& ]{1,40}$/;

export function sanitizeSearchQuery(raw) {
  if (typeof raw !== "string") return "";

  const cleaned = raw
    .trim()
    .replace(/\s+/g, " ");

  if (cleaned.length === 0) return "";
  if (cleaned.length > 40) return "";

  if (!SEARCH_REGEX.test(cleaned)) return "";

  return cleaned;
}
