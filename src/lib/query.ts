const STOPWORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "of",
  "to",
  "for",
  "in",
  "on",
  "at",
  "by",
  "with",
  "from",
  "as",
  "is",
  "are",
  "be",
  "vs",
  "via",
  "into",
  "about",
  "over",
  "under",
  "than",
  "then",
  "that",
  "this",
  "these",
  "those",
  "what",
  "when",
  "where",
  "which",
  "how",
  "why",
]);

/** Content-bearing tokens from an instructor query. */
export function contentTerms(query: string): string[] {
  return query
    .trim()
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t));
}

/**
 * Terms that must appear for a document to count as a real hit.
 * Single-term queries (e.g. "DiL") always require that term.
 * Multi-term queries require every term of length >= 4 (so "race engineer"
 * needs both; a lone "race" match is not enough).
 */
export function requiredTerms(query: string): string[] {
  const terms = contentTerms(query);
  if (terms.length <= 1) return terms;
  const long = terms.filter((t) => t.length >= 4);
  return long.length > 0 ? long : terms;
}

export function phraseOf(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, " ");
}

/** How many required terms are missing from haystack. */
export function missingRequired(haystack: string, query: string): string[] {
  const hay = haystack.toLowerCase();
  return requiredTerms(query).filter((t) => !hay.includes(t));
}
