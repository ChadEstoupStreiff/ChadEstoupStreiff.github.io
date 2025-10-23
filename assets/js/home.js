(function () {
  function setOpen(details, btn, open) {
    if (open) {
      details.hidden = false; // ensure visible for animation
      requestAnimationFrame(() => {
        details.classList.add("is-open");
        btn.setAttribute("aria-expanded", "true");
        btn.textContent = btn.textContent.replace(
          "Show details",
          "Hide details"
        );
      });
    } else {
      details.classList.remove("is-open");
      btn.setAttribute("aria-expanded", "false");
      btn.textContent = btn.textContent.replace("Hide details", "Show details");
      details.addEventListener("transitionend", function onEnd(e) {
        if (e.propertyName !== "grid-template-rows") return;
        details.hidden = true; // hide after collapse
        details.removeEventListener("transitionend", onEnd);
      });
    }
  }

  document.addEventListener("click", function (e) {
    const btn = e.target.closest(".card-toggle");
    if (!btn) return;
    const targetId = btn.getAttribute("aria-controls");
    const details = document.getElementById(targetId);
    const open = btn.getAttribute("aria-expanded") === "true";
    setOpen(details, btn, !open);
  });

  // Optional: start collapsed & ensure hidden attribute is respected
  document.querySelectorAll(".card-details").forEach((d) => (d.hidden = true));
})();
