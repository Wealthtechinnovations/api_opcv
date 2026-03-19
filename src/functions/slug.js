/**
 * Generates a URL-friendly slug from text.
 * Handles French accented characters and special chars.
 * @param {string} text - The text to slugify
 * @returns {string} - URL-friendly slug
 */
function generateSlug(text) {
  if (!text) return '';

  return text
    .toString()
    .normalize('NFD')                   // Decompose accented chars
    .replace(/[\u0300-\u036f]/g, '')    // Remove diacritical marks
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')      // Remove non-alphanumeric chars
    .replace(/\s+/g, '-')              // Replace spaces with hyphens
    .replace(/-+/g, '-')              // Collapse multiple hyphens
    .replace(/^-+|-+$/g, '');         // Trim leading/trailing hyphens
}

/**
 * Generates a unique fund slug: nom-du-fond-code-isin-id
 * @param {string} nomFond - Fund name
 * @param {string} codeISIN - ISIN code
 * @param {number} id - Fund ID
 * @returns {string} - Unique SEO slug
 */
function generateFundSlug(nomFond, codeISIN, id) {
  const nameSlug = generateSlug(nomFond);
  const isinSlug = codeISIN ? generateSlug(codeISIN) : '';
  const parts = [nameSlug, isinSlug, id].filter(Boolean);
  return parts.join('-');
}

/**
 * Extracts the numeric ID from the end of a fund slug.
 * @param {string} slug - Fund slug (e.g., "nom-du-fond-isin-123")
 * @returns {number|null} - Extracted ID or null
 */
function extractIdFromSlug(slug) {
  if (!slug) return null;
  const match = slug.match(/-(\d+)$/);
  return match ? parseInt(match[1], 10) : parseInt(slug, 10) || null;
}

module.exports = { generateSlug, generateFundSlug, extractIdFromSlug };
