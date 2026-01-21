const SEARCH_REGEX = /^[A-Za-z0-9'.,\-\/\\:`;& ]{1,40}$/;

function validateSearchQuery(q) {
  if (typeof q !== "string") return false;

  const trimmed = q.trim();
  if (trimmed.length === 0) return false;
  if (trimmed.length > 40) return false;

  return SEARCH_REGEX.test(trimmed);
}

module.exports = {
  validateSearchQuery,
};
