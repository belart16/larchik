// Opened inside a window of the site's desktop: no own top bar and footer, and links to the
// other pages open their own windows there instead of a second desktop inside this one.
(function () {
  if (window.top === window.self) return;
  var root = document.documentElement;
  root.classList.add("embedded");
  // a document in a window reads at about 88%: more fits, like a page zoomed out (the desktop may already be smaller)
  try { root.style.zoom = String(Math.min(1, 0.88 / (parent.__deskZoom || 1))); } catch (e) {}
  // the theme picked on the desktop (island, settings), kept in step while the window is open
  try {
    var top = parent.document.documentElement;
    var sync = function () { var t = top.getAttribute("data-theme"); if (t) root.setAttribute("data-theme", t); else root.removeAttribute("data-theme"); };
    sync();
    new MutationObserver(sync).observe(top, { attributes: true, attributeFilter: ["data-theme"] });
  } catch (e) {}
  var PAGES = { "": "faq", "index.html": "faq", "ai.html": "ai", "license.html": "license", "privacy.html": "privacy", "feedback.html": "feedback" };
  var here = location.pathname.split("/").pop();
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href]");
    if (!a) return;
    var u = new URL(a.href, location.href);
    if (u.origin !== location.origin) { a.target = "_blank"; a.rel = "noopener"; return; }
    var page = u.pathname.split("/").pop();
    if (page === here || !(page in PAGES)) return;
    e.preventDefault();
    parent.postMessage({ larchik: "open", id: PAGES[page] }, location.origin);
  });
})();
