/* Étude d'ensoleillement interactive — diagramme solaire polaire (Victoriaville, 46,05° N).
   Formules : NOAA (équation du temps et déclinaison, approximation de Spencer). */
(function () {
  const svg = document.getElementById("sun-svg");
  if (!svg) return;

  const LAT = 46.05, LON = -71.96;
  const rad = (d) => (d * Math.PI) / 180, deg = (r) => (r * 180) / Math.PI;
  const NS = "http://www.w3.org/2000/svg";
  const C = 260, R = 220;                 // centre et rayon de l'horizon
  const K = 5.2;                          // px par mètre pour la maison
  const HOUSE = { w: 14, d: 10 };         // empreinte en mètres
  const COL = { mustard: "#c9973a", tang: "#a8502a", sky: "#cdd2bf", paper: "#f1e9dc", ground: "#24322a" };

  const state = { day: 355, min: 900, rot: 180, h: 9, playing: false };

  // ---------- Astronomie ----------
  const isDST = (day) => day >= 68 && day <= 305;            // ≈ 2e dim. de mars au 1er dim. de nov.
  function params(day, minutes) {
    const g = (2 * Math.PI / 365) * (day - 1 + (minutes / 60 - 12) / 24);
    const eq = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
    const decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
    return { eq, decl, tz: isDST(day) ? -4 : -5 };
  }
  function sunPos(day, minutes) {
    const { eq, decl, tz } = params(day, minutes);
    const tst = minutes + eq + 4 * LON - 60 * tz;
    const ha = rad(tst / 4 - 180), lat = rad(LAT);
    const cz = Math.sin(lat) * Math.sin(decl) + Math.cos(lat) * Math.cos(decl) * Math.cos(ha);
    const zen = Math.acos(Math.max(-1, Math.min(1, cz)));
    let az = deg(Math.atan2(Math.sin(ha), Math.cos(ha) * Math.sin(lat) - Math.tan(decl) * Math.cos(lat))) + 180;
    az = (az + 360) % 360;
    return { alt: 90 - deg(zen), az };
  }
  function riseSet(day) {
    const { eq, decl, tz } = params(day, 720);
    const lat = rad(LAT);
    const c = Math.cos(rad(90.833)) / (Math.cos(lat) * Math.cos(decl)) - Math.tan(lat) * Math.tan(decl);
    const ha = deg(Math.acos(Math.max(-1, Math.min(1, c))));
    return { rise: 720 - 4 * (LON + ha) - eq + 60 * tz, set: 720 - 4 * (LON - ha) - eq + 60 * tz };
  }

  // ---------- Outils ----------
  const el = (tag, attrs, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    (parent || svg).appendChild(n);
    return n;
  };
  const polar = (alt, az) => {
    const r = (R * (90 - Math.max(0, alt))) / 90;
    return [C + r * Math.sin(rad(az)), C - r * Math.cos(rad(az))];
  };
  const fmtTime = (m) => {
    m = Math.round(m);
    const h = Math.floor(m / 60), mm = String(m % 60).padStart(2, "0");
    return `${h} h ${mm}`;
  };
  const CARD16 = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSO", "SO", "OSO", "O", "ONO", "NO", "NNO"];
  const CARD8 = ["Nord", "Nord-est", "Est", "Sud-est", "Sud", "Sud-ouest", "Ouest", "Nord-ouest"];
  const card16 = (a) => CARD16[Math.round(((a % 360) + 360) % 360 / 22.5) % 16];
  const card8 = (a) => CARD8[Math.round(((a % 360) + 360) % 360 / 45) % 8];
  const dateLabel = (day) => new Date(2026, 0, day).toLocaleDateString("fr-CA", { day: "numeric", month: "long" });

  function pathFor(day) {
    const pts = [];
    for (let m = 180; m <= 1380; m += 6) {
      const p = sunPos(day, m);
      if (p.alt > 0) pts.push(polar(p.alt, p.az));
    }
    return pts.length ? "M" + pts.map((p) => p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" L") : "";
  }

  function hull(points) {
    const p = points.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lower = [], upper = [];
    for (const q of p) { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop(); lower.push(q); }
    for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop(); upper.push(q); }
    upper.pop(); lower.pop();
    return lower.concat(upper);
  }

  // ---------- Décor fixe ----------
  const defs = el("defs", {});
  const clip = el("clipPath", { id: "horizon" }, defs);
  el("circle", { cx: C, cy: C, r: R }, clip);
  el("circle", { cx: C, cy: C, r: R, fill: COL.ground, stroke: "rgba(241,233,220,.35)", "stroke-width": 1.5 });
  [30, 60].forEach((a) => {
    el("circle", { cx: C, cy: C, r: (R * (90 - a)) / 90, fill: "none", stroke: "rgba(241,233,220,.14)", "stroke-dasharray": "2 5" });
    const t = el("text", { x: C + 4, y: C - (R * (90 - a)) / 90 - 4, fill: "rgba(241,233,220,.35)", "font-family": "DM Mono, monospace", "font-size": 10 });
    t.textContent = a + "°";
  });
  for (let a = 0; a < 360; a += 15) {
    const major = a % 90 === 0;
    const r1 = R, r2 = R + (major ? 10 : 5);
    el("line", {
      x1: C + r1 * Math.sin(rad(a)), y1: C - r1 * Math.cos(rad(a)),
      x2: C + r2 * Math.sin(rad(a)), y2: C - r2 * Math.cos(rad(a)),
      stroke: "rgba(241,233,220,.45)", "stroke-width": major ? 1.5 : 1
    });
  }
  [["N", 0], ["E", 90], ["S", 180], ["O", 270]].forEach(([l, a]) => {
    const r = R + 24;
    const t = el("text", { x: C + r * Math.sin(rad(a)), y: C - r * Math.cos(rad(a)) + 5, fill: COL.paper, "text-anchor": "middle", "font-family": "Playfair Display, Didot, Georgia, serif", "font-style": "italic", "font-size": 18 });
    t.textContent = l;
  });
  el("line", { x1: C - R, y1: C, x2: C + R, y2: C, stroke: "rgba(241,233,220,.08)" });
  el("line", { x1: C, y1: C - R, x2: C, y2: C + R, stroke: "rgba(241,233,220,.08)" });

  el("path", { d: pathFor(172), fill: "none", stroke: COL.tang, "stroke-width": 1.5, "stroke-dasharray": "1 5", "stroke-linecap": "round", opacity: .9 });
  el("path", { d: pathFor(355), fill: "none", stroke: COL.sky, "stroke-width": 1.5, "stroke-dasharray": "1 5", "stroke-linecap": "round", opacity: .9 });

  // ---------- Couches dynamiques ----------
  const gShadow = el("g", { "clip-path": "url(#horizon)" });
  const shadowPoly = el("polygon", { fill: "#000", opacity: .55 }, gShadow);
  const dayPath = el("path", { fill: "none", stroke: COL.mustard, "stroke-width": 2.5, "stroke-linecap": "round" });
  const gHours = el("g", {});
  const ray = el("line", { stroke: COL.mustard, "stroke-width": 1, "stroke-dasharray": "3 4", opacity: .6 });
  const gHouse = el("g", {});
  const houseBody = el("polygon", { fill: "#2f4a3f", stroke: COL.paper, "stroke-width": 1.5, "stroke-linejoin": "round" }, gHouse);
  const ridge = el("line", { stroke: "rgba(241,233,220,.6)", "stroke-width": 1 }, gHouse);
  const faceLines = [0, 1, 2, 3].map(() => el("line", { stroke: COL.mustard, "stroke-width": 5, "stroke-linecap": "round" }, gHouse));
  const frontLabel = el("text", { fill: COL.paper, "text-anchor": "middle", "font-family": "DM Mono, monospace", "font-size": 9, "letter-spacing": 1.5 }, gHouse);
  frontLabel.textContent = "AVANT";
  const sunHalo = el("circle", { r: 20, fill: COL.mustard, opacity: .18 });
  const sunDot = el("circle", { r: 11, fill: COL.mustard, stroke: "#17211b", "stroke-width": 2 });
  const nightText = el("text", { x: C, y: C - 70, fill: "rgba(241,233,220,.7)", "text-anchor": "middle", "font-family": "Playfair Display, Didot, Georgia, serif", "font-style": "italic", "font-size": 22 });

  // ---------- Rendu ----------
  const $ = (id) => document.getElementById(id);
  const out = { alt: $("r-alt"), az: $("r-az"), rise: $("r-rise"), len: $("r-len"), sh: $("r-shadow"), faces: $("r-faces") };
  const inDay = $("in-day"), inHour = $("in-hour"), inRot = $("in-rot");

  let lastDay = null;
  function drawDay() {
    dayPath.setAttribute("d", pathFor(state.day));
    gHours.replaceChildren();
    for (let h = 6; h <= 20; h += 1) {
      const p = sunPos(state.day, h * 60);
      if (p.alt <= 0) continue;
      const [x, y] = polar(p.alt, p.az);
      el("circle", { cx: x, cy: y, r: 2.5, fill: COL.mustard }, gHours);
      if (h % 2 === 0) {
        const t = el("text", { x: x, y: y - 8, fill: "rgba(241,233,220,.75)", "text-anchor": "middle", "font-family": "DM Mono, monospace", "font-size": 10 }, gHours);
        t.textContent = h + "h";
      }
    }
    const rs = riseSet(state.day);
    out.rise.innerHTML = `${fmtTime(rs.rise)}<small>→</small> ${fmtTime(rs.set)}`;
    const len = rs.set - rs.rise;
    out.len.innerHTML = `${Math.floor(len / 60)} h ${String(Math.round(len % 60)).padStart(2, "0")}`;
    lastDay = state.day;
  }

  function render() {
    if (lastDay !== state.day) drawDay();
    const p = sunPos(state.day, state.min);
    const up = p.alt > 0;

    // Maison : n = normale de la façade avant (vers l'azimut choisi), t = tangente
    const n = [Math.sin(rad(state.rot)), Math.cos(rad(state.rot))];
    const t = [Math.cos(rad(state.rot)), -Math.sin(rad(state.rot))];
    const hw = HOUSE.w / 2, hd = HOUSE.d / 2;
    const local = [[-hw, hd], [hw, hd], [hw, -hd], [-hw, -hd]];               // avant = +d
    const world = local.map(([a, b]) => [a * t[0] + b * n[0], a * t[1] + b * n[1]]); // mètres, x est / y nord
    const toSvg = ([x, y]) => [C + K * x, C - K * y];
    const pts = world.map(toSvg);
    houseBody.setAttribute("points", pts.map((q) => q.join(",")).join(" "));
    const ridgeA = toSvg([-hw * t[0], -hw * t[1]]), ridgeB = toSvg([hw * t[0], hw * t[1]]);
    ridge.setAttribute("x1", ridgeA[0]); ridge.setAttribute("y1", ridgeA[1]);
    ridge.setAttribute("x2", ridgeB[0]); ridge.setAttribute("y2", ridgeB[1]);
    const fl = toSvg([n[0] * (hd + 4.5), n[1] * (hd + 4.5)]);
    frontLabel.setAttribute("x", fl[0]); frontLabel.setAttribute("y", fl[1] + 3);

    // Façades : 0 avant, 1 droite, 2 arrière, 3 gauche
    const sunV = [Math.sin(rad(p.az)), Math.cos(rad(p.az))];
    const faces = [
      { a: 0, b: 1, normal: n, nom: "Avant" },
      { a: 1, b: 2, normal: t, nom: "Côté" },
      { a: 2, b: 3, normal: [-n[0], -n[1]], nom: "Arrière" },
      { a: 3, b: 0, normal: [-t[0], -t[1]], nom: "Côté" }
    ];
    const lit = [];
    faces.forEach((f, i) => {
      const on = up && f.normal[0] * sunV[0] + f.normal[1] * sunV[1] > 0.05;
      const ln = faceLines[i];
      ln.setAttribute("x1", pts[f.a][0]); ln.setAttribute("y1", pts[f.a][1]);
      ln.setAttribute("x2", pts[f.b][0]); ln.setAttribute("y2", pts[f.b][1]);
      ln.style.opacity = on ? 1 : 0;
      if (on) {
        const az = (deg(Math.atan2(f.normal[0], f.normal[1])) + 360) % 360;
        lit.push(f.nom === "Côté" ? `Côté ${card16(az)}` : `${f.nom} ${card16(az)}`);
      }
    });

    // Ombre
    if (up) {
      const L = Math.min(state.h / Math.tan(rad(p.alt)), 200);
      const dir = [-sunV[0] * L, -sunV[1] * L];
      const proj = world.map(([x, y]) => [x + dir[0], y + dir[1]]);
      const hp = hull(world.concat(proj)).map(toSvg);
      shadowPoly.setAttribute("points", hp.map((q) => q.join(",")).join(" "));
      shadowPoly.style.opacity = "";
      out.sh.innerHTML = L >= 200 ? "très longue" : `${L.toFixed(1).replace(".", ",")}<small>m</small>`;
    } else {
      shadowPoly.setAttribute("points", "");
      out.sh.textContent = "—";
    }

    // Soleil
    if (up) {
      const [sx, sy] = polar(p.alt, p.az);
      sunDot.setAttribute("cx", sx); sunDot.setAttribute("cy", sy);
      sunHalo.setAttribute("cx", sx); sunHalo.setAttribute("cy", sy);
      ray.setAttribute("x1", C); ray.setAttribute("y1", C); ray.setAttribute("x2", sx); ray.setAttribute("y2", sy);
      [sunDot, sunHalo, ray].forEach((e) => (e.style.display = ""));
      nightText.textContent = "";
      out.alt.innerHTML = `${p.alt.toFixed(0)}<small>°</small>`;
      out.az.innerHTML = `${card16(p.az)} <small>${p.az.toFixed(0)}°</small>`;
      out.faces.textContent = lit.length ? lit.join(" · ") : "—";
    } else {
      [sunDot, sunHalo, ray].forEach((e) => (e.style.display = "none"));
      nightText.textContent = "Le soleil est couché";
      out.alt.textContent = "Nuit";
      out.az.textContent = "—";
      out.faces.textContent = "—";
    }
    out.faces.style.fontSize = "1.05rem";

    $("o-day").textContent = dateLabel(state.day);
    $("o-hour").textContent = fmtTime(state.min);
    $("o-rot").textContent = card8(state.rot);
  }

  // ---------- Contrôles ----------
  const segDays = document.querySelectorAll("[data-day]");
  const syncDayButtons = () => segDays.forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.day === state.day)));
  segDays.forEach((b) => b.addEventListener("click", () => { state.day = +b.dataset.day; inDay.value = state.day; syncDayButtons(); render(); }));
  inDay.addEventListener("input", () => { state.day = +inDay.value; syncDayButtons(); render(); });
  inHour.addEventListener("input", () => { stop(); state.min = +inHour.value; render(); });
  inRot.addEventListener("input", () => { state.rot = +inRot.value; render(); });
  document.querySelectorAll("[data-h]").forEach((b) => b.addEventListener("click", () => {
    state.h = +b.dataset.h;
    document.querySelectorAll("[data-h]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    render();
  }));

  const btn = $("btn-play");
  let raf = 0, last = 0;
  function stop() {
    state.playing = false; cancelAnimationFrame(raf);
    btn.textContent = "▶ Jouer la journée"; btn.setAttribute("aria-pressed", "false");
  }
  function tick(ts) {
    if (!state.playing) return;
    const dt = last ? ts - last : 16; last = ts;
    const rs = riseSet(state.day);
    state.min += dt * 0.11;                          // ≈ 9 s pour une journée d'été
    if (state.min > rs.set + 10) state.min = rs.rise - 10;
    inHour.value = Math.round(state.min);
    render();
    raf = requestAnimationFrame(tick);
  }
  btn.addEventListener("click", () => {
    if (state.playing) return stop();
    const rs = riseSet(state.day);
    if (state.min < rs.rise - 10 || state.min > rs.set) state.min = rs.rise - 10;
    state.playing = true; last = 0;
    btn.textContent = "❚❚ Pause"; btn.setAttribute("aria-pressed", "true");
    raf = requestAnimationFrame(tick);
  });

  render();
})();
