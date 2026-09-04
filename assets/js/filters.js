/* Facet filters for the publication and project grids.

   A card's facets come from its data-filters attribute ("A|B"), or, when it has
   none, from its .pub-type badge — so a publication is filtered by the nature
   it already displays and never needs the value written twice. Selection is OR:
   a card shows if it carries any pressed facet, and no selection shows all. */
(function () {
  /* Derived facets are computed from the card instead of declared on it. A
     panel opts in with data-filters-derived, and they are pinned to the front
     of the chip row. */
  var DERIVED = {
    "First author": function (card) {
      var authors = card.querySelector(".authors");
      var me = authors && authors.querySelector(".me");
      if (!me) return false;
      // only whitespace may sit before the highlighted name
      for (var n = authors.firstChild; n && n !== me; n = n.nextSibling) {
        if (n.textContent.trim()) return false;
      }
      return true;
    },
  };

  function facetsOf(card) {
    var explicit = card.dataset.filters;
    if (explicit) {
      return explicit.split("|").map(function (f) {
        return f.trim();
      });
    }
    var badge = card.querySelector(".pub-type");
    // the badge reads "📝 Review"; the label is what we filter on
    return badge ? [badge.textContent.replace(/^[^\p{L}]+/u, "").trim()] : [];
  }

  function build(panel) {
    var grid = document.querySelector(panel.dataset.filtersFor);
    if (!grid) return;

    var pinned = (panel.dataset.filtersDerived || "")
      .split("|")
      .map(function (d) {
        return d.trim();
      })
      .filter(function (d) {
        return DERIVED[d];
      });

    function allFacetsOf(card) {
      return facetsOf(card).concat(
        pinned.filter(function (d) {
          return DERIVED[d](card);
        })
      );
    }

    var cards = Array.from(grid.children).filter(function (el) {
      return facetsOf(el).length;
    });
    if (cards.length < 2) return;

    var counts = new Map();
    cards.forEach(function (card) {
      allFacetsOf(card).forEach(function (facet) {
        counts.set(facet, (counts.get(facet) || 0) + 1);
      });
    });
    if (counts.size < 2) return;

    // derived facets lead; the declared ones follow most-used first
    var facets = Array.from(counts.keys())
      .filter(function (f) {
        return pinned.indexOf(f) === -1;
      })
      .sort(function (a, b) {
        return counts.get(b) - counts.get(a) || a.localeCompare(b);
      });
    facets = pinned
      .filter(function (d) {
        return counts.has(d);
      })
      .concat(facets);

    var row = panel.querySelector(".filters__row");
    var status = panel.querySelector(".filters__count");
    var noun = panel.dataset.filtersNoun || "items";
    var active = new Set();

    var all = document.createElement("button");
    all.type = "button";
    all.className = "filter-chip filter-chip--all";
    all.setAttribute("aria-pressed", "true");
    all.textContent = "All";
    row.appendChild(all);

    facets.forEach(function (facet) {
      var chip = document.createElement("button");
      chip.type = "button";
      chip.className = "filter-chip";
      chip.setAttribute("aria-pressed", "false");
      chip.dataset.facet = facet;
      chip.append(facet);
      var n = document.createElement("span");
      n.className = "filter-chip__n";
      n.textContent = counts.get(facet);
      chip.appendChild(n);
      row.appendChild(chip);
    });

    function apply() {
      var shown = 0;
      cards.forEach(function (card) {
        var match =
          active.size === 0 ||
          allFacetsOf(card).some(function (f) {
            return active.has(f);
          });
        card.hidden = !match;
        if (match) shown++;
      });

      all.setAttribute("aria-pressed", String(active.size === 0));
      status.textContent =
        active.size === 0
          ? "Showing all " + cards.length + " " + noun
          : "Showing " + shown + " of " + cards.length + " " + noun;
    }

    row.addEventListener("click", function (e) {
      var chip = e.target.closest(".filter-chip");
      if (!chip) return;
      if (chip === all) {
        active.clear();
        row.querySelectorAll("[data-facet]").forEach(function (c) {
          c.setAttribute("aria-pressed", "false");
        });
      } else {
        var on = chip.getAttribute("aria-pressed") !== "true";
        chip.setAttribute("aria-pressed", String(on));
        if (on) active.add(chip.dataset.facet);
        else active.delete(chip.dataset.facet);
      }
      apply();
    });

    panel.hidden = false;
    apply();
  }

  document.querySelectorAll("[data-filters-for]").forEach(build);
})();
