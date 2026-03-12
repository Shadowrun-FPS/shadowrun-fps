// Minimal no-op service worker – stops 404 when browser/extensions request /sw.js.
// Does not cache or control the page; registers and stays idle.
self.addEventListener("install", function () {
  self.skipWaiting();
});
self.addEventListener("activate", function () {
  self.clients.claim();
});
