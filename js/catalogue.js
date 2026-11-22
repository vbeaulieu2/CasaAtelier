/* Catalogue des plans : cartes, filtres, fiche détaillée (dialog), lien profond plans.html#03. */
(function () {
  "use strict";
  var PLANS = window.PLANS || [];
  var grid = document.getElementById("grille");
  if (!grid || !window.drawFacade) return;

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var THEMES = ["Petit budget", "Avec garage", "Sans sous-sol", "Avec vue", "Terrain en pente", "Nouveauté"];
  var ROOF = {
    "pignon": "Pignon", "pignon-raide": "Pignon à forte pente", "appentis": "Appentis (monopente)",
    "plat": "Plat", "a-frame": "A-frame", "croupe": "Croupe (4 versants)"
  };

  // ---------- Formats ----------
  function nf(n) { return Number(n).toLocaleString("fr-CA").replace(/ | /g, " "); }
  function half(n) { var i = Math.floor(n); return n - i >= 0.5 ? (i ? i : "") + "½" : String(i); }
  function etg(n) { return n === 1 ? "Plain-pied" : n === 1.5 ? "1½ étage" : n + " étages"; }
  function etgShort(n) { return n === 1 ? "plain-pied" : n === 1.5 ? "1½ étage" : n + " étages"; }
  function gar(n) { return !n ? "Aucun" : n === 1 ? "Simple, attenant" : "Double, attenant"; }
  function esc(t) { return String(t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function spec(p) {
    return [nf(p.superficie) + " pi²", p.chambres + " ch", half(p.sdb) + " sdb", etgShort(p.etages)]
      .map(function (x) { return "<span>" + x + "</span>"; }).join(" · ");
  }
  function tagClass(t) {
    return { "Nouveauté": "tag--tangerine", "Petit budget": "tag--mustard", "Avec vue": "tag--teal", "Terrain en pente": "tag--avocado" }[t] || "";
  }
  function tags(p) {
    return p.themes.map(function (t) { return '<li class="tag ' + tagClass(t) + '">' + esc(t) + "</li>"; }).join("");
  }

  // ---------- Cartes ----------
  grid.innerHTML = PLANS.map(function (p, i) {
    var isNew = p.themes.indexOf("Nouveauté") > -1;
    return (
      '<li class="plan-card" data-id="' + p.id + '" style="--acc:' + p.accent + ";--i:" + i + '">' +
        '<div class="plan-card__visual">' +
          '<span class="plan-card__num" aria-hidden="true"><small>N°</small>' + p.id + "</span>" +
          (isNew ? '<span class="burst plan-card__burst" aria-hidden="true"><span>Nou&shy;veau!</span></span>' : "") +
          window.drawFacade(p) +
        "</div>" +
        '<div class="plan-card__body">' +
          '<p class="plan-card__style">' + esc(p.style) + "</p>" +
          '<h2 class="plan-card__name"><button type="button" class="plan-card__open" aria-haspopup="dialog">' +
            '<span class="sr-only">Modèle N° ' + p.id + " — </span>" + esc(p.nom) + "</button></h2>" +
          '<p class="plan-card__pitch">' + esc(p.pitch) + "</p>" +
          '<p class="plan-card__spec">' + spec(p) + "</p>" +
          '<ul class="plan-card__tags" role="list">' + tags(p) + "</ul>" +
          '<div class="plan-card__foot"><span>Prix sur demande</span><span class="plan-card__go" aria-hidden="true">Voir la fiche <span class="arrow">→</span></span></div>' +
        "</div>" +
      "</li>"
    );
  }).join("");
  var cards = Array.prototype.slice.call(grid.children);
  requestAnimationFrame(function () { grid.classList.add("is-ready"); });
  // Fin de l'entrée en cascade : les filtres prennent ensuite le relais (FLIP)
  setTimeout(function () { grid.classList.add("is-settled"); }, 1700);

  grid.addEventListener("click", function (e) {
    var card = e.target.closest(".plan-card");
    if (card) openPlan(card.getAttribute("data-id"), card.querySelector(".plan-card__open"));
  });

  // ---------- Filtres ----------
  var styleBox = document.getElementById("chips-style");
  var themeBox = document.getElementById("chips-theme");
  var styles = [];
  PLANS.forEach(function (p) { if (styles.indexOf(p.style) < 0) styles.push(p.style); });
  styleBox.insertAdjacentHTML("beforeend", styles.map(function (s) {
    return '<button type="button" class="chip" data-val="' + esc(s) + '" aria-pressed="false">' + esc(s) + "</button>";
  }).join(""));
  var usedThemes = THEMES.filter(function (t) { return PLANS.some(function (p) { return p.themes.indexOf(t) > -1; }); });
  themeBox.innerHTML = usedThemes.map(function (t) {
    return '<button type="button" class="chip chip--theme" data-val="' + esc(t) + '" aria-pressed="false">' + esc(t) + "</button>";
  }).join("");

  var state = { ch: "", et: "", pi: "", style: "", theme: [] };
  var counter = document.getElementById("compte");
  var resetBtn = document.getElementById("reinit");
  var empty = document.getElementById("vide");

  function readQuery() {
    var q = new URLSearchParams(location.search);
    state.ch = q.get("ch") || "";
    state.et = q.get("et") || "";
    state.pi = q.get("pi") || "";
    state.style = q.get("style") || "";
    state.theme = (q.get("theme") || "").split(",").filter(function (t) { return usedThemes.indexOf(t) > -1; });
  }
  function writeQuery() {
    var q = new URLSearchParams();
    ["ch", "et", "pi", "style"].forEach(function (k) { if (state[k]) q.set(k, state[k]); });
    if (state.theme.length) q.set("theme", state.theme.join(","));
    var qs = q.toString();
    try { history.replaceState(null, "", location.pathname + (qs ? "?" + qs : "") + location.hash); } catch (err) { /* file:// */ }
  }
  function syncChips() {
    document.querySelectorAll(".fgroup").forEach(function (fs) {
      var key = fs.getAttribute("data-key");
      fs.querySelectorAll(".chip").forEach(function (c) {
        var v = c.getAttribute("data-val");
        var on = key === "theme" ? state.theme.indexOf(v) > -1 : state[key] === v;
        c.setAttribute("aria-pressed", String(on));
      });
    });
    var active = state.ch || state.et || state.pi || state.style || state.theme.length;
    resetBtn.hidden = !active;
  }
  function match(p) {
    if (state.ch) { var c = +state.ch; if (c >= 4 ? p.chambres < 4 : p.chambres !== c) return false; }
    if (state.et && p.etages !== +state.et) return false;
    if (state.pi) {
      var a = p.superficie;
      if (state.pi === "s" && a >= 1500) return false;
      if (state.pi === "m" && (a < 1500 || a > 2000)) return false;
      if (state.pi === "l" && a <= 2000) return false;
    }
    if (state.style && p.style !== state.style) return false;
    for (var i = 0; i < state.theme.length; i++) if (p.themes.indexOf(state.theme[i]) < 0) return false;
    return true;
  }

  var visibleIds = PLANS.map(function (p) { return p.id; });
  function apply(animate) {
    var first = new Map();
    if (animate && !reduce) cards.forEach(function (c) { if (!c.hidden) first.set(c, c.getBoundingClientRect()); });
    visibleIds = [];
    cards.forEach(function (c, i) {
      var ok = match(PLANS[i]);
      c.hidden = !ok;
      if (ok) visibleIds.push(PLANS[i].id);
    });
    var n = visibleIds.length;
    counter.textContent = n ? (n < 10 ? "0" : "") + n + (n > 1 ? " modèles" : " modèle") : "Aucun modèle";
    empty.hidden = n > 0;
    syncChips();
    if (!animate || reduce || !Element.prototype.animate) return;
    cards.forEach(function (c) {
      if (c.hidden) return;
      var r = c.getBoundingClientRect(), f = first.get(c);
      if (f) {
        var dx = f.left - r.left, dy = f.top - r.top;
        if (dx || dy) c.animate([{ transform: "translate(" + dx + "px," + dy + "px)" }, { transform: "none" }], { duration: 520, easing: "cubic-bezier(.22,1,.36,1)" });
      } else {
        c.animate([{ opacity: 0, transform: "scale(.94)" }, { opacity: 1, transform: "none" }], { duration: 420, easing: "cubic-bezier(.22,1,.36,1)" });
      }
    });
  }

  document.querySelector(".filters__form").addEventListener("click", function (e) {
    var chip = e.target.closest(".chip");
    if (!chip) return;
    var key = chip.closest(".fgroup").getAttribute("data-key");
    var v = chip.getAttribute("data-val");
    if (key === "theme") {
      var k = state.theme.indexOf(v);
      if (k > -1) state.theme.splice(k, 1); else state.theme.push(v);
    } else {
      state[key] = state[key] === v ? "" : v;
    }
    writeQuery();
    apply(true);
  });
  function resetAll() {
    state = { ch: "", et: "", pi: "", style: "", theme: [] };
    writeQuery();
    apply(true);
  }
  resetBtn.addEventListener("click", resetAll);
  document.querySelectorAll("[data-reset]").forEach(function (b) { b.addEventListener("click", resetAll); });

  readQuery();
  apply(false);

  // ---------- Fiche (dialog) ----------
  var dlg = document.getElementById("fiche");
  var box = document.getElementById("fiche-contenu");
  var lastFocus = null;
  var hasDialog = dlg && typeof dlg.showModal === "function";

  function row(k, v) { return "<div><dt>" + k + "</dt><dd>" + v + "</dd></div>"; }

  function render(p) {
    var list = visibleIds.indexOf(p.id) > -1 ? visibleIds : PLANS.map(function (q) { return q.id; });
    var pos = list.indexOf(p.id);
    var prev = list[(pos - 1 + list.length) % list.length], next = list[(pos + 1) % list.length];
    var href = "sur-mesure.html?plan=" + encodeURIComponent(p.id);
    box.style.setProperty("--acc", p.accent);
    box.innerHTML =
      '<button type="button" class="plan-dlg__close" data-close aria-label="Fermer la fiche"><span aria-hidden="true">×</span></button>' +
      '<div class="plan-dlg__visual">' +
        '<span class="plan-dlg__num" aria-hidden="true"><small>N°</small>' + p.id + "</span>" +
        window.drawFacade(p, { label: "Élévation avant" }) +
        (window.drawPlanMini ? '<div class="plan-dlg__mini">' + window.drawPlanMini(p) + "</div>" : "") +
      "</div>" +
      '<div class="plan-dlg__text">' +
        '<p class="kicker">Modèle N° ' + p.id + " · " + esc(p.style) + "</p>" +
        '<h2 id="fiche-titre" class="plan-dlg__name">' + esc(p.nom) + "</h2>" +
        '<p class="plan-dlg__pitch">' + esc(p.pitch) + "</p>" +
        '<ul class="plan-card__tags" role="list">' + tags(p) + "</ul>" +
        '<h3 class="plan-dlg__h">Fiche technique</h3>' +
        '<dl class="fiche">' +
          row("Superficie habitable", nf(p.superficie) + " pi²") +
          row("Largeur × profondeur", p.largeur + " × " + p.profondeur + " pi") +
          row("Étages", etg(p.etages)) +
          row("Chambres", p.chambres) +
          row("Salles de bain", half(p.sdb)) +
          row("Garage", gar(p.garage)) +
          row("Sous-sol", esc(p.sousSol)) +
          row("Toit", ROOF[p.roof] || esc(p.roof)) +
          row("Prix", "Sur demande") +
        "</dl>" +
        '<h3 class="plan-dlg__h">Points forts</h3>' +
        '<ul class="points">' + p.points.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>" +
        '<div class="inclus">' +
          '<p class="inclus__t">Inclus dans le plan</p>' +
          "<p>Plans pour permis : vues en plan, élévations, coupe type et détails de construction.</p>" +
        "</div>" +
        '<div class="plan-dlg__cta">' +
          '<a class="btn btn--accent" href="' + href + '&amp;mode=modele">Demander ce plan <span class="arrow" aria-hidden="true">→</span></a>' +
          '<a class="btn btn--ghost" href="' + href + '&amp;mode=modifier">Le modifier</a>' +
        "</div>" +
        '<p class="plan-dlg__fine">Données d\'exemple : dimensions et superficies à confirmer.</p>' +
        '<nav class="plan-dlg__nav" aria-label="Autres modèles">' +
          '<button type="button" class="plan-dlg__step" data-go="' + prev + '"><span aria-hidden="true">←</span> N° ' + prev + "</button>" +
          '<span class="mono">' + (pos + 1) + " / " + list.length + "</span>" +
          '<button type="button" class="plan-dlg__step" data-go="' + next + '">N° ' + next + ' <span aria-hidden="true">→</span></button>' +
        "</nav>" +
      "</div>";
  }

  function find(id) { for (var i = 0; i < PLANS.length; i++) if (PLANS[i].id === id) return PLANS[i]; return null; }

  function openPlan(id, from) {
    var p = find(id);
    if (!p) return;
    if (!hasDialog) { location.href = "sur-mesure.html?plan=" + id + "&mode=modele"; return; }
    render(p);
    if (!dlg.open) {
      lastFocus = from || document.activeElement;
      dlg.showModal();
      document.documentElement.classList.add("has-dlg");
    }
    dlg.scrollTop = 0;
    box.scrollTop = 0;
    var closeBtn = box.querySelector(".plan-dlg__close");
    if (closeBtn) closeBtn.focus({ preventScroll: true });
    if (location.hash !== "#" + id) {
      try { history.replaceState(null, "", location.pathname + location.search + "#" + id); } catch (err) { /* file:// */ }
    }
  }

  if (hasDialog) {
    dlg.addEventListener("click", function (e) {
      if (e.target === dlg || e.target.closest("[data-close]")) { dlg.close(); return; }
      var go = e.target.closest("[data-go]");
      if (go) openPlan(go.getAttribute("data-go"));
    });
    dlg.addEventListener("close", function () {
      document.documentElement.classList.remove("has-dlg");
      if (/^#\d{2}$/.test(location.hash)) {
        try { history.replaceState(null, "", location.pathname + location.search); } catch (err) { /* file:// */ }
      }
      var back = lastFocus;
      if (!back || !document.contains(back)) back = grid.querySelector(".plan-card__open");
      if (back) back.focus({ preventScroll: true });
    });
    dlg.addEventListener("keydown", function (e) {
      if (e.target.closest("input, textarea")) return;
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        var b = box.querySelectorAll("[data-go]")[e.key === "ArrowLeft" ? 0 : 1];
        if (b) { e.preventDefault(); openPlan(b.getAttribute("data-go")); }
      }
    });
  }

  function fromHash() {
    var m = /^#(\d{1,2})$/.exec(location.hash);
    if (!m) return;
    var id = m[1].length === 1 ? "0" + m[1] : m[1];
    var card = grid.querySelector('[data-id="' + id + '"]');
    openPlan(id, card && card.querySelector(".plan-card__open"));
  }
  window.addEventListener("hashchange", fromHash);
  fromHash();
})();
