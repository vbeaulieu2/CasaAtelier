/* Formulaire de conception résidentielle — assistant en étapes.
   Reproduit les 13 sections du formulaire PDF de BT, plus une étape 0 « Point de départ ».
   Aucune donnée n'est envoyée par le site : on compose un courriel (mailto:) que la
   personne envoie elle-même depuis son application. Brouillon gardé dans ce navigateur. */
(function () {
  "use strict";

  const BT = window.BT || {};
  const DEST = BT.courriel || "";
  const STORE_KEY = "bt-sur-mesure-v1";
  const MAILTO_MAX = 1800;

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------- Catalogue (fourni par plans-data.js, s'il existe) ---------- */
  const PLANS = Array.isArray(window.PLANS) ? window.PLANS : [];
  const planById = (id) => PLANS.find((p) => String(p.id) === String(id));
  const planLabel = (p) => (p ? `N° ${p.id}${p.nom ? " " + p.nom : ""}` : "");
  const fmtNum = (n) => (typeof n === "number" ? n.toLocaleString("fr-CA") : n);
  function fmtEtages(e) {
    if (typeof e !== "number") return e || "";
    if (e <= 1) return "Plain-pied";
    if (e === 1.5) return "1½ étage";
    return String(e).replace(".", ",") + " étages";
  }
  function facadeSvg(p) {
    if (!p || typeof window.drawFacade !== "function") return "";
    try { return window.drawFacade(p) || ""; } catch (e) { return ""; }
  }

  const DEPART = {
    zero: "Plan sur mesure (à partir de zéro)",
    modifier: "Modifier un plan du catalogue",
    modele: "Ce plan du catalogue, tel quel",
  };

  /* ---------- Pictogrammes de style (petites silhouettes) ---------- */
  const PICTO = {
    "Farmhouse": '<path d="M6 30V16L18 6l12 10v14M30 20h12v10M2 30h44M14 30v-8h8v8"/><path d="M30 20l6-5 6 5"/>',
    "Moderne": '<path d="M4 30V14h22v16M26 30V8h18v22M2 30h44M10 20h8M32 14h8"/>',
    "Contemporain": '<path d="M4 30V16l26-8v22M30 30V18h14v12M2 30h44M12 22h8"/>',
    "Scandinave": '<path d="M12 30V14L22 2l10 12v16M2 30h44M19 30v-7h6v7M18 15h8"/>',
    "Champêtre": '<path d="M4 30V17L24 6l20 11v13M2 30h44M13 17v-4h6v3M29 16v-3h6v4M21 30v-7h6v7"/>',
    "Traditionnel": '<path d="M6 30V16h36v14M2 30h44M6 16l8-9h20l8 9M20 30v-7h8v7M11 21h5M32 21h5"/>',
    "Chalet": '<path d="M6 30L24 4l18 26M2 30h44M14 30l10-15 10 15M20 24h8"/>',
    "Industriel": '<path d="M4 30V14l10 6v-6l10 6v-6l10 6v-6l10 6v10M2 30h44M10 30v-5h6v5M30 24h8"/>',
    "Transitionnel": '<path d="M4 30V15L15 6l11 9v15M26 30V18h18v12M2 30h44M11 30v-7h8v7M31 23h8"/>',
    "Autre": '<path d="M2 30h44M6 30V12h36v18"/><path d="M19 17a5 5 0 1 1 6 5v3M25 28v.5"/>',
  };
  const picto = (k) => (PICTO[k] ? `<svg class="fm-picto" viewBox="0 0 48 32" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${PICTO[k]}</g></svg>` : "");

  /* ---------- Schéma : sections du PDF ---------- */
  const PRIORITES = ["Budget", "Efficacité énergétique", "Design", "Luminosité", "Entretien", "Flexibilité", "Valeur de revente", "Rangement"];

  const SECTIONS = [
    { n: 0, t: "Point de départ", tone: "ink", fields: [
      { id: "depart", l: "Comment voulez-vous commencer?", ml: "Point de départ", type: "radio", tiles: true,
        o: [
          { v: DEPART.zero, l: "Plan sur mesure", s: "À partir de zéro, selon vos besoins." },
          { v: DEPART.modifier, l: "Modifier un plan", s: "Un modèle du catalogue, ajusté pour vous." },
          { v: DEPART.modele, l: "Ce plan, tel quel", s: "Un modèle du catalogue, sans changement." },
        ] },
      { id: "plan", l: "Plan du catalogue", type: "plan", show: (d) => d.depart === DEPART.modifier || d.depart === DEPART.modele },
      { id: "planModifs", l: "Ce que vous aimeriez changer", type: "textarea", rows: 3, ph: "Ex. : une chambre de plus, garage double, cuisine plus grande…", show: (d) => d.depart === DEPART.modifier },
    ] },
    { n: 1, t: "Informations générales", tone: "tangerine", fields: [
      { id: "nom", l: "Nom", type: "text", req: true, ac: "name" },
      { id: "telephone", l: "Téléphone", type: "tel", ac: "tel", half: true, hint: "Courriel ou téléphone : au moins un des deux." },
      { id: "courriel", l: "Courriel", type: "email", ac: "email", half: true },
      { id: "municipalite", l: "Municipalité du projet", type: "text", req: true, ac: "address-level2", ph: "Ex. : Victoriaville" },
      { id: "terrainAchete", l: "Terrain acheté", type: "radio", o: ["Oui", "Non", "En démarche"] },
      { id: "terrainLargeur", l: "Largeur", unit: "pi", type: "num", third: true },
      { id: "terrainProfondeur", l: "Profondeur", unit: "pi", type: "num", third: true },
      { id: "terrainSuperficie", l: "Superficie du terrain", unit: "pi²", type: "num", third: true, hint: "Calculée pour vous : largeur × profondeur." },
      { id: "terrain", l: "Terrain", type: "check", o: ["Plat", "Pente légère", "Pente forte", "Boisé", "Bord de l'eau", "Vue à mettre en valeur"] },
    ] },
    { n: 2, t: "Type de résidence", tone: "teal", fields: [
      { id: "projet", l: "Projet", type: "radio", merge: "projetAutre", o: ["Maison", "Chalet", "Intergénérationnelle", "Jumelé", "Autre"] },
      { id: "projetAutre", l: "Précisez le projet", type: "text", merged: true, show: (d) => d.projet === "Autre" },
      { id: "etages", l: "Nombre d'étages", type: "radio", o: ["Plain-pied", "1½ étage", "2 étages", "3 étages"] },
      { id: "sousSol", l: "Sous-sol", type: "radio", o: ["Aucun", "Non aménagé", "Aménagé", "À déterminer"] },
      { id: "superficieHabitable", l: "Superficie habitable souhaitée", unit: "pi²", type: "num", half: true },
    ] },
    { n: 3, t: "Budget", tone: "mustard", fields: [
      { id: "budget", l: "Budget de construction visé", type: "text", im: "decimal", half: true, ph: "Ex. : 450 000 $" },
      { id: "budgetInclut", l: "Ce budget inclut", type: "radio", o: ["Terrain", "Construction seulement", "Construction et aménagement extérieur"] },
    ] },
    { n: 4, t: "Configuration intérieure", tone: "avocado", fields: [
      { id: "chambres", l: "Chambres", type: "radio", o: ["1", "2", "3", "4", "5+"], compact: true },
      { id: "chambrePrincipale", l: "Chambre principale", type: "radio", o: ["RDC", "Étage", "Sans préférence"] },
      { id: "sallesBain", l: "Salles de bain", type: "radio", o: ["1", "2", "3+"], compact: true },
      { id: "salleEau", l: "Salle d'eau", type: "radio", o: ["Oui", "Non"], compact: true },
    ] },
    { n: 5, t: "Buanderie", tone: "teal", fields: [
      { id: "buanderie", l: "Emplacement laveuse-sécheuse", type: "check", o: ["Sous-sol", "RDC", "Étage", "Salle dédiée"] },
    ] },
    { n: 6, t: "Garage", tone: "tangerine", fields: [
      { id: "garage", l: "Garage", type: "radio", o: ["Aucun", "Simple", "Double", "Triple"] },
      { id: "garageType", l: "Type de garage", type: "radio", o: ["Attaché", "Détaché", "Sans préférence"], show: (d) => !!d.garage && d.garage !== "Aucun" },
      { id: "garageBesoins", l: "Besoins particuliers", type: "text", ph: "Ex. : atelier, porte haute pour VR, borne de recharge" },
    ] },
    { n: 7, t: "Style architectural", tone: "mustard", fields: [
      { id: "style", l: "Styles qui vous plaisent", ml: "Styles", type: "check", merge: "styleAutre", tiles: "picto", o: Object.keys(PICTO) },
      { id: "styleAutre", l: "Précisez le style", type: "text", merged: true, show: (d) => (d.style || []).includes("Autre") },
      { id: "inspirations", l: "Références / inspirations", type: "textarea", rows: 3, hint: "Collez vos liens Pinterest, Instagram ou autres — tout aide.", ph: "https://pin.it/…" },
    ] },
    { n: 8, t: "Aires de vie", tone: "avocado", fields: [
      { id: "cuisine", l: "Cuisine", type: "check", o: ["Îlot", "Garde-manger walk-in", "Fermée", "Ouverte"] },
      { id: "salon", l: "Salon", type: "check", o: ["Foyer", "Plafond cathédrale", "Grandes fenêtres", "Vue à mettre en valeur"] },
    ] },
    { n: 9, t: "Espaces complémentaires", tone: "teal", fields: [
      { id: "espaces", l: "Espaces souhaités", ml: "Espaces", type: "check", o: ["Bureau", "Salle de jeux", "Gym", "Cinéma", "Atelier", "Mudroom", "Cellier", "Chambre d'invités", "Logement intergénérationnel"] },
    ] },
    { n: 10, t: "Chauffage et efficacité", tone: "tangerine", fields: [
      { id: "chauffage", l: "Mode de chauffage", type: "check", o: ["Thermopompe murale", "Thermopompe centrale", "Plinthes", "Plancher radiant", "Géothermie", "Bois", "Granules", "À déterminer"] },
      { id: "performance", l: "Performance énergétique", type: "radio", o: ["Standard", "Haute efficacité", "Novoclimat", "Maison passive", "Net Zéro"] },
    ] },
    { n: 11, t: "Extérieur", tone: "avocado", fields: [
      { id: "revetement", l: "Revêtement", type: "check", o: ["Bois", "Fibrociment", "Vinyle", "Brique", "Pierre", "Mixte"] },
      { id: "toiture", l: "Toiture", type: "radio", o: ["Bardeau", "Tôle", "Membrane", "À déterminer"] },
      { id: "exterieurs", l: "Espaces extérieurs", type: "check", o: ["Terrasse couverte", "Véranda", "Patio", "Balcon", "Piscine"] },
    ] },
    { n: 12, t: "Priorités", tone: "mustard", fields: [
      { id: "priorites", l: "Classez de la plus importante (1) à la moins importante (8)", type: "rank" },
    ] },
    { n: 13, t: "Commentaires additionnels", tone: "ink", fields: [
      { id: "commentaires", l: "Autre chose à nous dire?", ml: "", type: "textarea", rows: 5, ph: "Habitudes de vie, animaux, contraintes, échéancier…" },
    ] },
  ];
  const SEC = Object.fromEntries(SECTIONS.map((s) => [s.n, s]));
  const FIELD = {};
  SECTIONS.forEach((s) => s.fields.forEach((f) => (FIELD[f.id] = Object.assign(f, { sec: s.n }))));

  const STEPS = [
    { l: "Départ", secs: [0] },
    { l: "Vous & terrain", secs: [1] },
    { l: "Résidence & budget", secs: [2, 3] },
    { l: "Intérieur & garage", secs: [4, 5, 6] },
    { l: "Style & espaces", secs: [7, 8, 9] },
    { l: "Énergie & extérieur", secs: [10, 11] },
    { l: "Priorités & mot de la fin", secs: [12, 13] },
    { l: "Récapitulatif", secs: [], recap: true },
  ];
  const LAST = STEPS.length - 1;
  const stepOfSec = (n) => STEPS.findIndex((s) => s.secs.includes(n));

  /* ---------- État ---------- */
  let data = {};
  let step = 0;
  let maxStep = 0;
  let autoSup = true; // la superficie est-elle calculée automatiquement?

  function defaults() {
    data = { priorites: PRIORITES.slice() };
    step = 0; maxStep = 0; autoSup = true;
  }

  function load() {
    defaults();
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return false;
      const s = JSON.parse(raw);
      if (!s || s.v !== 1) return false;
      data = Object.assign(data, s.data || {});
      if (!Array.isArray(data.priorites) || data.priorites.length !== PRIORITES.length) data.priorites = PRIORITES.slice();
      step = Math.min(Math.max(s.step | 0, 0), LAST);
      maxStep = Math.min(Math.max(s.maxStep | 0, step), LAST);
      autoSup = s.autoSup !== false;
      return true;
    } catch (e) { return false; }
  }

  let saveTimer = 0;
  function save(withToast) {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify({ v: 1, data, step, maxStep, autoSup, t: Date.now() }));
        if (withToast) toast("Brouillon enregistré");
      } catch (e) { /* stockage indisponible : on continue sans brouillon */ }
    }, 500);
  }

  let toastTimer = 0;
  function toast(msg) {
    const el = $("#fm-toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("is-on"), 1800);
  }

  const isEmpty = (v) => v == null || (Array.isArray(v) ? v.length === 0 : String(v).trim() === "");
  const visible = (f) => !f.show || f.show(data);

  /* ---------- Rendu des champs ---------- */
  function hintHtml(f) {
    return `${f.hint ? `<p class="fm-hint" id="h-${f.id}">${esc(f.hint)}</p>` : ""}<p class="fm-err" id="e-${f.id}" hidden></p>`;
  }
  function describedBy(f) {
    return [f.hint ? "h-" + f.id : "", "e-" + f.id].filter(Boolean).join(" ");
  }

  function renderField(f) {
    const cls = ["fm-field", "fm-field--" + f.type];
    if (f.half) cls.push("fm-field--half");
    if (f.third) cls.push("fm-field--third");
    const attrs = `class="${cls.join(" ")}" data-field="${f.id}"${f.show ? " data-cond" : ""}`;
    const req = f.req ? ' <span class="fm-req">requis</span>' : "";

    if (f.type === "radio" || f.type === "check") {
      const kind = f.type === "radio" ? "radio" : "checkbox";
      const opts = f.o.map((o, i) => {
        const v = typeof o === "string" ? o : o.v;
        const l = typeof o === "string" ? o : o.l;
        const sub = typeof o === "object" && o.s ? `<small>${esc(o.s)}</small>` : "";
        const pic = f.tiles === "picto" ? picto(v) : "";
        return `<label class="fm-chip${f.tiles ? " fm-chip--tile" : ""}${f.compact ? " fm-chip--compact" : ""}">` +
          `<input type="${kind}" name="${f.id}" value="${esc(v)}" id="${f.id}-${i}">` +
          `<span class="fm-chip__face">${pic}<span class="fm-chip__mark" aria-hidden="true"></span><span class="fm-chip__txt"><b>${esc(l)}</b>${sub}</span></span></label>`;
      }).join("");
      const multi = f.type === "check" ? ' <span class="fm-multi">choix multiples</span>' : "";
      return `<fieldset ${attrs} aria-describedby="${describedBy(f)}"><legend class="fm-label">${esc(f.l)}${multi}${req}</legend>` +
        `<div class="fm-chips${f.tiles ? " fm-chips--tiles" : ""}${f.tiles === "picto" ? " fm-chips--picto" : ""}">${opts}</div>${hintHtml(f)}</fieldset>`;
    }

    if (f.type === "rank") {
      const items = (data.priorites || PRIORITES).map((p) => rankItem(p)).join("");
      return `<div ${attrs}><p class="fm-label" id="l-rank">${esc(f.l)}</p>` +
        `<p class="fm-hint">Glissez avec la poignée <span aria-hidden="true">⠿</span> ou utilisez les flèches.</p>` +
        `<ol class="fm-rank" id="fm-rank" aria-labelledby="l-rank">${items}</ol></div>`;
    }

    if (f.type === "plan") {
      let inner;
      if (PLANS.length) {
        const opts = PLANS.map((p) => `<option value="${esc(p.id)}">${esc(planLabel(p))}${p.superficie ? " — " + esc(fmtNum(p.superficie)) + " pi²" : ""}</option>`).join("");
        inner = `<label class="fm-label" for="f-plan">${esc(f.l)}</label>` +
          `<div class="fm-select"><select id="f-plan" name="plan"><option value="">Choisir un modèle…</option>${opts}</select></div>` +
          `<div class="fm-planview" id="fm-planview" aria-live="polite"></div>` +
          `<p class="fm-hint"><a class="link" href="plans.html">Voir tout le catalogue</a></p>`;
      } else {
        inner = `<label class="fm-label" for="f-plan">N° ou nom du plan</label>` +
          `<input class="fm-input" type="text" id="f-plan" name="plan" placeholder="Ex. : 03">` +
          `<p class="fm-hint"><a class="link" href="plans.html">Voir le catalogue</a></p>`;
      }
      return `<div ${attrs}>${inner}</div>`;
    }

    const id = "f-" + f.id;
    let control;
    if (f.type === "textarea") {
      control = `<textarea class="fm-input" id="${id}" name="${f.id}" rows="${f.rows || 4}"${f.ph ? ` placeholder="${esc(f.ph)}"` : ""} aria-describedby="${describedBy(f)}"></textarea>`;
    } else {
      const type = f.type === "num" ? "text" : f.type;
      const im = f.type === "num" ? ' inputmode="decimal"' : f.im ? ` inputmode="${f.im}"` : "";
      control = `<input class="fm-input" type="${type}" id="${id}" name="${f.id}"${im}${f.ac ? ` autocomplete="${f.ac}"` : ""}${f.req ? ' aria-required="true"' : ""}${f.ph ? ` placeholder="${esc(f.ph)}"` : ""} aria-describedby="${describedBy(f)}">`;
      if (f.unit) control = `<div class="fm-unit">${control}<span class="fm-unit__u mono" aria-hidden="true">${esc(f.unit)}</span></div>`;
    }
    const unitSr = f.unit ? `<span class="sr-only"> (${esc(f.unit)})</span>` : "";
    return `<div ${attrs}><label class="fm-label" for="${id}">${esc(f.l)}${unitSr}${req}</label>${control}${hintHtml(f)}</div>`;
  }

  function rankItem(p) {
    return `<li class="fm-rank__item" data-value="${esc(p)}">` +
      `<span class="fm-rank__num" aria-hidden="true"></span>` +
      `<span class="fm-rank__handle" aria-hidden="true" title="Glisser">⠿</span>` +
      `<span class="fm-rank__txt">${esc(p)}</span>` +
      `<span class="fm-rank__btns">` +
      `<button type="button" class="fm-rank__btn" data-move="-1" aria-label="Monter ${esc(p)}">↑</button>` +
      `<button type="button" class="fm-rank__btn" data-move="1" aria-label="Descendre ${esc(p)}">↓</button>` +
      `</span></li>`;
  }

  function renderSection(s) {
    const num = String(s.n).padStart(2, "0");
    return `<section class="fm-sec" id="sec-${s.n}" data-tone="${s.tone}" aria-labelledby="sec-${s.n}-t">` +
      `<header class="fm-sec__head"><span class="fm-sec__num" aria-hidden="true">${num}</span><span class="fm-sec__rule" aria-hidden="true"></span>` +
      `<h3 class="fm-sec__title" id="sec-${s.n}-t" tabindex="-1"><span class="sr-only">Section ${s.n} : </span>${esc(s.t)}</h3></header>` +
      `<div class="fm-grid">${s.fields.map(renderField).join("")}</div></section>`;
  }

  function renderSteps() {
    const html = STEPS.map((st, i) => {
      const head = `<header class="fm-step__head"><p class="kicker">Étape ${i + 1} sur ${STEPS.length}</p>` +
        `<h2 class="fm-step__title" tabindex="-1" id="step-${i}-t">${esc(st.l)}</h2>` +
        (i === 1 ? `<p class="fm-step__lede">Tout est facultatif sauf vos coordonnées. Répondez à ce que vous savez.</p>` : "") +
        (i === 0 ? `<p class="fm-step__lede">Partir d'une page blanche, ou d'un modèle du catalogue?</p>` : "") +
        `</header>`;
      const body = st.recap ? `<div id="fm-recap"></div>` : st.secs.map((n) => renderSection(SEC[n])).join("");
      return `<div class="fm-step" id="step-${i}" data-step="${i}" role="group" aria-labelledby="step-${i}-t" hidden>${head}${body}</div>`;
    }).join("");
    $("#fm-steps").innerHTML = html;
  }

  function renderRuler() {
    const ticks = STEPS.map((st, i) =>
      `<li class="fm-ruler__step" style="--i:${i}"><button type="button" data-goto="${i}">` +
      `<span class="fm-ruler__n">${String(i).padStart(2, "0")}</span><span class="fm-ruler__l">${esc(st.l)}</span></button></li>`).join("");
    $("#fm-ruler").innerHTML =
      `<div class="fm-ruler__bar" aria-hidden="true"><span class="fm-ruler__fill" id="fm-fill"></span></div><ol class="fm-ruler__list" style="--n:${STEPS.length}">${ticks}</ol>`;
  }

  /* ---------- Synchronisation état ⇄ champs ---------- */
  function fillInputs() {
    Object.keys(FIELD).forEach((id) => {
      const f = FIELD[id];
      const v = data[id];
      if (f.type === "radio" || f.type === "check") {
        const arr = Array.isArray(v) ? v : v ? [v] : [];
        $$(`input[name="${id}"]`).forEach((inp) => (inp.checked = arr.includes(inp.value)));
      } else if (f.type === "rank") {
        // déjà rendu dans l'ordre
      } else {
        const el = document.getElementById("f-" + id);
        if (el) el.value = v || "";
      }
    });
    updatePlanView();
    updateConditions();
    numberRank();
  }

  function readInput(el) {
    const id = el.name;
    const f = FIELD[id];
    if (!f) return;
    if (f.type === "check") data[id] = $$(`input[name="${id}"]:checked`).map((i) => i.value);
    else if (f.type === "radio") data[id] = el.checked ? el.value : data[id];
    else data[id] = el.value;
  }

  function updateConditions() {
    $$("[data-cond]").forEach((el) => {
      const f = FIELD[el.getAttribute("data-field")];
      el.hidden = !visible(f);
    });
  }

  function updatePlanView() {
    const box = $("#fm-planview");
    if (!box) return;
    const p = planById(data.plan);
    if (!p) { box.innerHTML = ""; box.hidden = true; return; }
    box.hidden = false;
    const specs = [
      p.style,
      p.superficie ? fmtNum(p.superficie) + " pi²" : "",
      p.chambres ? p.chambres + " ch." : "",
      p.sdb ? p.sdb + " s.d.b." : "",
      fmtEtages(p.etages),
    ].filter(Boolean);
    const svg = facadeSvg(p);
    box.innerHTML = `${svg ? `<div class="fm-planview__img" aria-hidden="true">${svg}</div>` : ""}` +
      `<div class="fm-planview__txt"><span class="mono">N° ${esc(p.id)}</span><strong>${esc(p.nom || "")}</strong>` +
      `<span class="fm-planview__specs">${specs.map(esc).join(" · ")}</span></div>`;
  }

  function parseNum(s) {
    const n = parseFloat(String(s || "").replace(/\s/g, "").replace(",", "."));
    return isFinite(n) ? n : NaN;
  }
  function autoSuperficie(changedId) {
    if (changedId === "terrainSuperficie") { autoSup = isEmpty(data.terrainSuperficie); return; }
    if (changedId !== "terrainLargeur" && changedId !== "terrainProfondeur") return;
    if (!autoSup && !isEmpty(data.terrainSuperficie)) return;
    const l = parseNum(data.terrainLargeur), p = parseNum(data.terrainProfondeur);
    const el = $("#f-terrainSuperficie");
    if (l > 0 && p > 0) {
      data.terrainSuperficie = Math.round(l * p).toLocaleString("fr-CA");
      autoSup = true;
    } else if (autoSup) data.terrainSuperficie = "";
    if (el) { el.value = data.terrainSuperficie; el.classList.toggle("is-auto", !isEmpty(data.terrainSuperficie)); }
  }

  /* ---------- Validation (coordonnées seulement) ---------- */
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  function setErr(id, msg) {
    const e = document.getElementById("e-" + id);
    const inp = document.getElementById("f-" + id);
    if (e) { e.textContent = msg || ""; e.hidden = !msg; }
    if (inp) { if (msg) inp.setAttribute("aria-invalid", "true"); else inp.removeAttribute("aria-invalid"); }
  }
  function validateContact(show) {
    const errs = [];
    const nom = (data.nom || "").trim();
    const mail = (data.courriel || "").trim();
    const tel = (data.telephone || "").trim();
    const mun = (data.municipalite || "").trim();
    const e = {};
    if (!nom) e.nom = "Indiquez votre nom.";
    if (mail && !EMAIL_RE.test(mail)) e.courriel = "Ce courriel semble incomplet.";
    else if (!mail && !tel) e.courriel = "Indiquez un courriel ou un téléphone.";
    if (tel && tel.replace(/\D/g, "").length < 7) e.telephone = "Ce numéro semble incomplet.";
    if (!mun) e.municipalite = "Indiquez la municipalité du projet.";
    ["nom", "telephone", "courriel", "municipalite"].forEach((id) => {
      if (show) setErr(id, e[id]);
      if (e[id]) errs.push(id);
    });
    if (show && errs.length) {
      const msg = errs.length === 1 ? e[errs[0]] : `${errs.length} champs à compléter : ` + errs.map((id) => e[id]).join(" ");
      announce("#fm-alert", msg);
    }
    return errs;
  }

  function announce(sel, msg) {
    const el = $(sel);
    if (!el) return;
    el.textContent = "";
    setTimeout(() => (el.textContent = msg), 30);
  }

  /* ---------- Navigation entre étapes ---------- */
  function goTo(target, opts) {
    opts = opts || {};
    target = Math.max(0, Math.min(LAST, target));
    // On ne dépasse pas l'étape 1 sans coordonnées valides.
    if (target > 1) {
      const errs = validateContact(false);
      if (errs.length) {
        if (step !== 1) showStep(1, { focusSec: null });
        validateContact(true);
        const first = document.getElementById("f-" + errs[0]);
        if (first) first.focus();
        return;
      }
    }
    showStep(target, opts);
  }

  function showStep(target, opts) {
    opts = opts || {};
    const dir = target >= step ? "fwd" : "back";
    step = target;
    maxStep = Math.max(maxStep, step);
    $$(".fm-step").forEach((el) => {
      const on = +el.dataset.step === step;
      el.hidden = !on;
      el.classList.toggle("is-active", on);
      el.dataset.dir = dir;
    });
    if (STEPS[step].recap) renderRecap();
    updateRuler();
    $("#fm").classList.toggle("is-recap", step === LAST);
    $("#fm-prev").hidden = step === 0;
    $("#fm-next").hidden = step === LAST;
    $("#fm-next").innerHTML = step === LAST - 1
      ? 'Voir le récapitulatif <span class="arrow" aria-hidden="true">→</span>'
      : 'Suivant <span class="arrow" aria-hidden="true">→</span>';
    $("#fm-count").textContent = `Étape ${step + 1} / ${STEPS.length} · ${STEPS[step].l}`;
    announce("#fm-live", `Étape ${step + 1} sur ${STEPS.length} : ${STEPS[step].l}`);
    save(false);

    if (opts.noFocus) return;
    const sec = opts.focusSec != null ? document.getElementById(`sec-${opts.focusSec}-t`) : null;
    const focusEl = sec || document.getElementById(`step-${step}-t`);
    // Changement d'étape : retour en haut de la page ; « Modifier » du récap : directement à la section visée.
    const top = sec ? sec.getBoundingClientRect().top + window.scrollY - 80 : 0;
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: Math.max(0, top), behavior: reduce ? "auto" : "smooth" });
    if (focusEl) focusEl.focus({ preventScroll: true });
  }

  function updateRuler() {
    const fill = $("#fm-fill");
    if (fill) fill.style.width = ((step + 1) / STEPS.length) * 100 + "%";
    $$(".fm-ruler__step").forEach((li, i) => {
      const b = li.querySelector("button");
      li.classList.toggle("is-current", i === step);
      li.classList.toggle("is-done", i < step);
      b.disabled = i > maxStep;
      if (i === step) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current");
      b.setAttribute("aria-label", `Étape ${i + 1} : ${STEPS[i].l}${i < step ? " (faite)" : ""}`);
    });
  }

  /* ---------- Priorités : glisser-déposer + boutons ---------- */
  function numberRank() {
    const list = $("#fm-rank");
    if (!list) return;
    $$(".fm-rank__item", list).forEach((li, i, all) => {
      li.querySelector(".fm-rank__num").textContent = i + 1;
      li.querySelector('[data-move="-1"]').disabled = i === 0;
      li.querySelector('[data-move="1"]').disabled = i === all.length - 1;
    });
  }
  function commitRank(announceItem) {
    const list = $("#fm-rank");
    data.priorites = $$(".fm-rank__item", list).map((li) => li.dataset.value);
    data.prioritesTouched = true;
    numberRank();
    save(true);
    if (announceItem) announce("#fm-live", `${announceItem} : rang ${data.priorites.indexOf(announceItem) + 1} sur ${data.priorites.length}`);
  }

  function setupRank() {
    const list = $("#fm-rank");
    if (!list) return;

    list.addEventListener("click", (e) => {
      const btn = e.target.closest(".fm-rank__btn");
      if (!btn || btn.disabled) return;
      const li = btn.closest("li");
      const dir = +btn.dataset.move;
      if (dir < 0 && li.previousElementSibling) list.insertBefore(li, li.previousElementSibling);
      else if (dir > 0 && li.nextElementSibling) list.insertBefore(li.nextElementSibling, li);
      commitRank(li.dataset.value);
      const again = li.querySelector(`[data-move="${dir}"]`);
      (again.disabled ? li.querySelector(`[data-move="${-dir}"]`) : again).focus();
    });

    let drag = null;
    list.addEventListener("pointerdown", (e) => {
      const handle = e.target.closest(".fm-rank__handle, .fm-rank__txt, .fm-rank__num");
      if (!handle || (e.pointerType === "mouse" && e.button !== 0)) return;
      const li = handle.closest("li");
      e.preventDefault();
      li.setPointerCapture(e.pointerId);
      drag = { li, id: e.pointerId, startY: e.clientY };
      li.classList.add("is-drag");
      list.classList.add("is-dragging");
    });
    list.addEventListener("pointermove", (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const li = drag.li;
      const y = e.clientY;
      const prev = li.previousElementSibling;
      const next = li.nextElementSibling;
      const before = li.offsetTop;
      if (prev) {
        const r = prev.getBoundingClientRect();
        if (y < r.top + r.height / 2) list.insertBefore(li, prev);
      }
      if (next && li.nextElementSibling === next) {
        const r = next.getBoundingClientRect();
        if (y > r.top + r.height / 2) list.insertBefore(next, li);
      }
      drag.startY += li.offsetTop - before;
      li.style.transform = `translateY(${y - drag.startY}px)`;
      numberRank();
    });
    const end = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const li = drag.li;
      li.style.transform = "";
      li.classList.remove("is-drag");
      list.classList.remove("is-dragging");
      drag = null;
      const changed = $$(".fm-rank__item", list).map((x) => x.dataset.value).join("|") !== (data.priorites || []).join("|");
      if (changed) commitRank(li.dataset.value);
    };
    list.addEventListener("pointerup", end);
    list.addEventListener("pointercancel", end);
  }

  /* ---------- Collecte pour récapitulatif et courriel ---------- */
  function valueText(f) {
    const v = data[f.id];
    if (f.type === "plan") {
      const p = planById(v);
      return p ? planLabel(p) : (v || "").trim();
    }
    const extra = f.merge ? String(data[f.merge] || "").trim() : "";
    if (Array.isArray(v)) return v.map((x) => (x === "Autre" && extra ? `Autre (${extra})` : x)).join(", ");
    const s = String(v == null ? "" : v).trim();
    if (s === "Autre" && extra) return `Autre (${extra})`;
    if (!s) return "";
    return f.unit ? `${s} ${f.unit}` : s;
  }

  function collect() {
    return SECTIONS.map((s) => {
      const rows = [];
      s.fields.forEach((f) => {
        if (!visible(f) || f.merged) return;
        if (f.type === "rank") {
          if (data.prioritesTouched) rows.push({ f, rank: data.priorites.slice() });
          return;
        }
        const t = valueText(f);
        if (t) rows.push({ f, l: f.ml != null ? f.ml : f.l, t });
      });
      return { s, rows };
    });
  }

  function subject() {
    const p = planById(data.plan);
    const pl = p ? planLabel(p) : data.plan ? `N° ${String(data.plan).trim()}` : "";
    const qui = (data.nom || "").trim();
    const ou = (data.municipalite || "").trim();
    if (data.depart === DEPART.modele && pl) return `Demande — plan ${pl}`;
    if (data.depart === DEPART.modifier) return `Plan à modifier${pl ? " — " + pl : ""}${qui ? " — " + qui : ""}`;
    return `Plan sur mesure — ${qui || "nouvelle demande"}${ou ? " (" + ou + ")" : ""}`;
  }

  function bodyText() {
    const NL = "\r\n";
    const out = ["Bonjour,", "", "Voici ma demande, préparée avec le formulaire de conception résidentielle.", ""];
    collect().forEach(({ s, rows }) => {
      if (!rows.length) return;
      out.push(`${s.n}. ${s.t.toUpperCase()}`);
      rows.forEach((r) => {
        if (r.rank) r.rank.forEach((p, i) => out.push(`${i + 1}. ${p}`));
        else if (r.f.type === "textarea") { if (r.l) out.push(`${r.l} :`); out.push(r.t.replace(/\r?\n/g, NL)); }
        else out.push(`${r.l} : ${r.t}`);
      });
      out.push("");
    });
    out.push("Merci!");
    if (data.nom) out.push(String(data.nom).trim());
    return out.join(NL);
  }

  function mailto(body) {
    return `mailto:${DEST}?subject=${encodeURIComponent(subject())}&body=${encodeURIComponent(body)}`;
  }
  function shortBody() {
    const NL = "\r\n";
    const lines = ["Bonjour,", "", "Le détail de ma demande est collé ci-dessous (il était trop long pour ce lien).", "",
      "[Collez ici : Ctrl+V ou appui long › Coller]", "", "---", ""];
    if (data.nom) lines.push("Nom : " + String(data.nom).trim());
    if (data.telephone) lines.push("Téléphone : " + String(data.telephone).trim());
    if (data.courriel) lines.push("Courriel : " + String(data.courriel).trim());
    if (data.municipalite) lines.push("Municipalité : " + String(data.municipalite).trim());
    return lines.join(NL);
  }

  /* ---------- Récapitulatif ---------- */
  function renderRecap() {
    const box = $("#fm-recap");
    const today = new Date().toLocaleDateString("fr-CA", { year: "numeric", month: "long", day: "numeric" });
    const groups = collect();
    const p = planById(data.plan);
    const svg = (data.depart === DEPART.modifier || data.depart === DEPART.modele) ? facadeSvg(p) : "";
    const filled = groups.filter((g) => g.rows.length).length;

    const secs = groups.map(({ s, rows }) => {
      const num = String(s.n).padStart(2, "0");
      let inner;
      if (!rows.length) inner = `<p class="fm-fiche__empty">Rien d'indiqué.</p>`;
      else inner = `<dl class="fm-fiche__dl">${rows.map((r) => r.rank
        ? `<div class="fm-fiche__row fm-fiche__row--rank"><dt>Ordre</dt><dd><ol class="fm-fiche__rank">${r.rank.map((x) => `<li>${esc(x)}</li>`).join("")}</ol></dd></div>`
        : `<div class="fm-fiche__row${r.l ? "" : " fm-fiche__row--rank"}"><dt>${esc(r.l)}</dt><dd>${esc(r.t).replace(/\n/g, "<br>")}</dd></div>`).join("")}</dl>`;
      if (s.n === 12 && !rows.length) inner = `<p class="fm-fiche__empty">Pas encore classées.</p>`;
      return `<section class="fm-fiche__sec" data-tone="${s.tone}"><header><span class="fm-fiche__num">${num}</span><h4>${esc(s.t)}</h4>` +
        `<button type="button" class="fm-fiche__edit fm-noprint" data-goto="${stepOfSec(s.n)}" data-sec="${s.n}" aria-label="Modifier : ${esc(s.t)}">Modifier</button></header>${inner}</section>`;
    }).join("");

    const body = bodyText();
    const full = mailto(body);
    const long = full.length > MAILTO_MAX;
    const sendHref = long ? mailto(shortBody()) : full;

    box.innerHTML =
      `<article class="fm-fiche" id="fm-fiche">` +
      `<div class="stripes" aria-hidden="true"><span></span><span></span><span></span><span></span></div>` +
      `<header class="fm-fiche__head"><div><p class="mono fm-fiche__kicker">Fiche de projet · ${esc(today)}</p>` +
      `<h3 class="fm-fiche__title">${esc((data.nom || "").trim() || "Votre projet")}${data.municipalite ? `<em> à ${esc(String(data.municipalite).trim())}</em>` : ""}</h3>` +
      `<p class="fm-fiche__sub mono">${esc(subject())}</p></div>` +
      `${svg ? `<div class="fm-fiche__facade" aria-hidden="true">${svg}</div>` : `<div class="fm-fiche__stamp" aria-hidden="true"><span>${filled}</span><small>sections<br>remplies</small></div>`}</header>` +
      `<div class="fm-fiche__grid">${secs}</div></article>` +

      `<div class="notice fm-notice fm-noprint"><div class="notice__icon" aria-hidden="true">!</div><div>` +
      `<h3>Architecte ou ingénieur exigé?</h3>` +
      `<p>Certaines municipalités exigent des plans d'architecte et/ou d'ingénieur. Nous ne fournissons pas ces services, mais pouvons vous orienter. <a class="link" href="index.html#avis">En savoir plus</a></p></div></div>` +

      `<div class="fm-send fm-noprint">` +
      (long ? `<p class="fm-send__long"><strong>Votre demande est longue.</strong> Certaines applications de courriel coupent les longs messages : on copie le texte pour vous, puis vous le collez dans le courriel.</p>` : "") +
      `<div class="fm-send__row">` +
      `<a class="btn btn--accent" id="fm-send" href="${esc(sendHref)}" data-long="${long ? 1 : 0}">${long ? "Copier et ouvrir le courriel" : "Envoyer par courriel"} <span class="arrow" aria-hidden="true">→</span></a>` +
      `<button type="button" class="btn btn--ghost" id="fm-copy">Copier le texte</button>` +
      `<button type="button" class="btn btn--ghost" id="fm-pdf">Télécharger le récapitulatif (PDF)</button>` +
      `<button type="button" class="btn btn--ghost" id="fm-dl">Texte (.txt)</button>` +
      `<button type="button" class="btn btn--ghost" id="fm-print">Imprimer</button>` +
      `</div>` +
      `<p class="fm-send__to mono">À : ${esc(DEST)}</p>` +
      `<p class="fm-send__note">Rien n'est envoyé tant que vous n'appuyez pas sur Envoyer dans votre application de courriel. Aucune donnée n'est conservée sur ce site.</p>` +
      `</div>`;

    box._body = body;
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(() => true, () => legacyCopy(text));
    }
    return Promise.resolve(legacyCopy(text));
  }
  function legacyCopy(text) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;top:0;left:0;opacity:0;";
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    ta.remove();
    return ok;
  }
  function nameSlug() {
    return String(data.nom || "projet").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "projet";
  }
  function downloadPdf(btn) {
    if (typeof window.BTRecapPdf !== "function") { window.print(); return; }
    const p = planById(data.plan);
    const avecPlan = data.depart === DEPART.modifier || data.depart === DEPART.modele;
    const modele = {
      titre: (data.nom || "").trim() || "Votre projet",
      lieu: String(data.municipalite || "").trim(),
      sujet: subject(),
      date: new Date().toLocaleDateString("fr-CA", { year: "numeric", month: "long", day: "numeric" }),
      nomFichier: `fiche-projet-${nameSlug()}.pdf`,
      facadeSvg: avecPlan ? facadeSvg(p) : "",
      sections: collect().map(({ s, rows }) => ({
        n: s.n, t: s.t, tone: s.tone,
        rows: rows.map((r) => (r.rank ? { rank: r.rank } : { l: r.l, t: r.t }))
      }))
    };
    const label = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Préparation du PDF…";
    window.BTRecapPdf(modele)
      .then(() => toast("PDF téléchargé"))
      .catch(() => { toast("PDF indisponible hors ligne : la fenêtre d'impression s'ouvre (choisissez « Enregistrer en PDF »)"); window.print(); })
      .finally(() => { btn.disabled = false; btn.textContent = label; });
  }
  function download(text) {
    const slug = nameSlug();
    const blob = new Blob(["﻿" + subject() + "\r\n\r\n" + text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `demande-plan-${slug}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  /* ---------- Démarrage ---------- */
  function applyQuery() {
    let q;
    try { q = new URLSearchParams(location.search); } catch (e) { return false; }
    const plan = q.get("plan");
    const mode = q.get("mode");
    if (!plan && !mode) return false;
    if (mode === "modele") data.depart = DEPART.modele;
    else if (mode === "zero") data.depart = DEPART.zero;
    else data.depart = DEPART.modifier;
    if (plan) {
      const p = planById(plan) || PLANS.find((x) => String(x.id).replace(/^0+/, "") === String(plan).replace(/^0+/, ""));
      data.plan = p ? String(p.id) : plan;
    }
    step = 0;
    return true;
  }

  function init() {
    const form = $("#fm");
    if (!form) return;
    const hadDraft = load();
    const fromQuery = applyQuery();

    renderRuler();
    renderSteps();
    fillInputs();
    setupRank();

    $("#fm-ruler").hidden = false;
    $("#fm-toolbar").hidden = false;
    form.hidden = false;

    form.addEventListener("input", (e) => {
      const el = e.target;
      if (!el.name || !FIELD[el.name]) return;
      readInput(el);
      if (el.name === "plan") updatePlanView();
      autoSuperficie(el.name);
      updateConditions();
      if (["nom", "telephone", "courriel", "municipalite"].includes(el.name) && el.getAttribute("aria-invalid")) validateContact(true);
      save(true);
    });
    form.addEventListener("change", (e) => {
      const el = e.target;
      if (!el.name || !FIELD[el.name]) return;
      readInput(el);
      if (el.name === "plan") updatePlanView();
      updateConditions();
      save(true);
    });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (step < LAST) goTo(step + 1);
    });
    $("#fm-prev").addEventListener("click", () => goTo(step - 1));

    document.addEventListener("click", (e) => {
      const g = e.target.closest("[data-goto]");
      if (g && !g.disabled) {
        const t = +g.dataset.goto;
        const sec = g.dataset.sec != null ? +g.dataset.sec : null;
        if (t <= 1) showStep(t, { focusSec: sec }); else goTo(t, { focusSec: sec });
        return;
      }
      const send = e.target.closest("#fm-send");
      if (send) {
        if (validateContact(false).length) { e.preventDefault(); goTo(LAST); return; }
        if (send.dataset.long === "1") copyText($("#fm-recap")._body).then((ok) => toast(ok ? "Texte copié — collez-le dans le courriel" : "Copie impossible : utilisez Télécharger"));
        return;
      }
      if (e.target.closest("#fm-copy")) {
        copyText($("#fm-recap")._body).then((ok) => toast(ok ? "Texte copié" : "Copie impossible : utilisez Télécharger"));
        return;
      }
      if (e.target.closest("#fm-pdf")) { downloadPdf(e.target.closest("#fm-pdf")); return; }
      if (e.target.closest("#fm-dl")) { download($("#fm-recap")._body); toast("Fichier téléchargé"); return; }
      if (e.target.closest("#fm-print")) { window.print(); return; }
    });

    $("#fm-restart").addEventListener("click", () => {
      if (!window.confirm("Effacer toutes vos réponses et recommencer?")) return;
      try { localStorage.removeItem(STORE_KEY); } catch (e) { /* rien */ }
      defaults();
      renderSteps();
      fillInputs();
      setupRank();
      showStep(0);
      toast("Formulaire remis à zéro");
    });

    showStep(step, { noFocus: true });
    if (hadDraft && !fromQuery) setTimeout(() => toast("Brouillon récupéré"), 400);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
