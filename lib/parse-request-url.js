/**
 * WHATWG URL replacement for deprecated `url.parse(url, true)` (Node DEP0169).
 * Produces the shape Next.js `handle(req, res, parsedUrl)` expects.
 * @param {string} urlString
 */
function parseRequestUrl(urlString) {
  const u = new URL(urlString || "/", "http://localhost");
  /** @type {import("querystring").ParsedUrlQuery} */
  const query = {};
  u.searchParams.forEach((value, key) => {
    if (Object.prototype.hasOwnProperty.call(query, key)) {
      const existing = query[key];
      query[key] = Array.isArray(existing)
        ? [...existing, value]
        : [existing, value];
    } else {
      query[key] = value;
    }
  });
  const path = u.pathname + u.search;
  // Fields mirror legacy `url.parse()` so Next.js `handle()` typing accepts the object.
  return {
    protocol: null,
    slashes: null,
    auth: null,
    host: null,
    port: null,
    hostname: null,
    hash: u.hash || "",
    pathname: u.pathname,
    query,
    search: u.search || null,
    path,
    href: path,
  };
}

module.exports = { parseRequestUrl };
