// Light/dark theme toggle.
// No stored preference => the browser/OS preference wins (handled in CSS by
// prefers-color-scheme). Clicking the toggle stamps data-theme on <html> and
// remembers the choice in localStorage.
(function () {
  var root = document.documentElement;
  var dark = window.matchMedia("(prefers-color-scheme: dark)");

  function stored() {
    try {
      var t = localStorage.getItem("theme");
      return t === "light" || t === "dark" ? t : null;
    } catch (e) {
      return null;
    }
  }

  function current() {
    return root.getAttribute("data-theme") || (dark.matches ? "dark" : "light");
  }

  function label(theme) {
    return theme === "dark" ? "Switch to light mode" : "Switch to dark mode";
  }

  function sync() {
    var theme = current();
    document.querySelectorAll(".theme-switch").forEach(function (btn) {
      btn.setAttribute("aria-checked", String(theme === "dark"));
      btn.setAttribute("aria-label", label(theme));
      btn.setAttribute("title", label(theme));
    });
    document.dispatchEvent(
      new CustomEvent("themechange", { detail: { theme: theme } })
    );
  }

  function set(theme) {
    root.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("theme", theme);
    } catch (e) {}
    sync();
  }

  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".theme-switch");
    if (!btn) return;
    set(current() === "dark" ? "light" : "dark");
  });

  // Follow the OS while the visitor has not picked a theme themselves.
  dark.addEventListener("change", function () {
    if (!stored()) sync();
  });

  sync();
})();
