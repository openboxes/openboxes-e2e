/**
 * Parses a URL based on a given pattern and extracts parameters.
 *
 * @param {string} url - The full URL to parse.
 * @param {string} pattern - The pattern to match the URL against, with placeholders prefixed by '$'.
 * @returns {Record<string, string>} An object containing the extracted parameters.
 *
 * @throws {Error} Throws an error if the URL does not match the pattern in terms of segment count or content.
 *
 * @example
 * const url = 'http://localhost:8080/openboxes/inventoryItem/showStockCard/ff808181907d311101907d3964940000';
 * const pattern = '/openboxes/inventoryItem/showStockCard/$id';
 * const result = parseUrl(url, pattern);
 * // result is { id: 'ff808181907d311101907d3964940000' }
 */
const parseUrl = (url: string, pattern: string) => {
  const parsedUrl = new URL(url);

  // Split pattern and URL into segments
  const splitPattern = pattern.split('/').filter(Boolean);
  const splitUrl = parsedUrl.pathname.split('/').filter(Boolean);

  // Initialize the response object
  const response: Record<string, string> = {};

  // Check if pattern and URL have the same length
  if (splitPattern.length !== splitUrl.length) {
    throw new Error('URL does not match the pattern (segment count mismatch)');
  }

  // Iterate over the pattern segments
  for (let i = 0; i < splitPattern.length; i++) {
    const patternSegment = splitPattern[i];
    const urlSegment = splitUrl[i];

    if (patternSegment.includes('$')) {
      // Extract the parameter name
      const key = patternSegment.replace('$', '');
      response[key] = urlSegment;
    } else if (patternSegment !== urlSegment) {
      throw new Error(
        `URL segment "${urlSegment}" does not match pattern segment "${patternSegment}"`
      );
    }
  }

  return response;
};

export { parseUrl };
