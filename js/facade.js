/* Élévation avant dessinée à la volée (SVG) + schéma de plan miniature.
   window.drawFacade(plan, opts) -> chaîne SVG
     opts.accent  : couleur d'accent (sinon plan.accent)
     opts.label   : texte du cartouche (ex. "Élévation avant") ; absent = aucun
     opts.soleil  : false pour retirer le disque solaire
   window.drawPlanMini(plan) -> chaîne SVG
   Unités internes : pieds ; y vers le haut depuis le sol (converti en px à la fin). */
(function () {
  "use strict";

  var INK = "#2a1f19", GLASS = "#cfe0dc", CONC = "#ddd1bd", STONE = "#d9cdb5", EARTH = "#e8dece";
  var GDOOR = "#ece4d2";
  var VB_W = 640, VB_H = 380, GY = 318;
  var uid = 0;

  var NS = ' vector-effect="non-scaling-stroke"';
  var SK = ' stroke="' + INK + '" stroke-width="1.5" stroke-linejoin="round"' + NS;
  var SKm = ' stroke="' + INK + '" stroke-width="1"' + NS;
  var SKt = ' stroke="' + INK + '" stroke-width=".7" stroke-opacity=".32"' + NS;

  function r1(n) { return Math.round(n * 10) / 10; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function drawFacade(plan, opts) {
    opts = opts || {};
    var f = plan.facade || {};
    var id = "fz" + (++uid);
    var accent = opts.accent || plan.accent || "#a8502a";
    var roofCol = f.toit || "#2b2824";
    var wallCol = f.mur || "#fbf7f0";
    var roof = plan.roof || "pignon";
    var et = plan.etages || 1;
    var W = plan.largeur || 40, D = plan.profondeur || 32;
    var winStyle = f.fenetres || "verticales";
    var siding = f.revetement || "horizontale";
    var isA = roof === "a-frame";

    // ---------- Géométrie (pieds) ----------
    var gN = isA ? 0 : (plan.garage || 0);
    var Wg = gN >= 2 ? 22 : gN === 1 ? 13 : 0;
    var gLeft = f.garageCote === "gauche";
    var Wm = W - Wg;
    var mx0 = gLeft ? Wg : 0, mx1 = mx0 + Wm, mxc = (mx0 + mx1) / 2;
    var gx0 = gLeft ? 0 : Wm, gx1 = gx0 + Wg;
    var walk = !!f.walkout;
    var lvl0 = walk ? 9 : 0;
    var FND = 1.2;
    var M = lvl0 + FND;
    var wallH = et >= 2 ? 18 : et === 1.5 ? 11 : 9;
    var top = M + wallH;

    // Terrain (pente pour walkout : côté haut = côté garage, sinon gauche)
    var highLeft = gN ? gLeft : true;
    var xa = highLeft ? mx0 + Wm * 0.25 : mx1 - Wm * 0.25;
    var xb = highLeft ? mx0 + Wm * 0.6 : mx1 - Wm * 0.6;
    function grade(x) {
      if (!walk) return 0;
      var t = highLeft ? (x - xa) / (xb - xa) : (xa - x) / (xa - xb);
      return lvl0 * (1 - clamp(t, 0, 1));
    }

    // Toit principal
    var p = 0.6, o = 1.2, TV = 1.3, apexIn = top, apex = top;
    var hip = null, shed = null, aF = null;
    if (roof === "pignon") { p = et === 1.5 ? 1 : 0.62; o = 1.2; TV = 1.3; }
    if (roof === "pignon-raide") { p = 1.25; o = 0.35; TV = 0.9; }
    if (roof === "pignon" || roof === "pignon-raide") {
      apexIn = top + (Wm / 2) * p; apex = apexIn + TV;
    } else if (roof === "croupe") {
      p = et === 1.5 ? 0.75 : 0.5; o = 1.5;
      var Dh = Math.min(D, Wm) / 2;
      hip = { eave: top - o * p, ridge: top + Dh * p, rx0: mx0 + Dh, rx1: mx1 - Dh };
      if (hip.rx0 > hip.rx1) { hip.rx0 = hip.rx1 = mxc; }
      apex = hip.ridge;
    } else if (roof === "appentis") {
      p = 0.17; o = 1.5;
      var hiRight = f.hautCote !== "gauche";
      shed = { hiRight: hiRight, topHi: top + Wm * p, T: 1.2 };
      shed.lowWall = hiRight ? mx0 : mx1;
      shed.hiWall = hiRight ? mx1 : mx0;
      apex = shed.topHi + o * p + shed.T;
    } else if (roof === "plat") {
      apex = top + 1.6;
    } else if (isA) {
      p = 1.7;
      aF = { yb: FND + 0.4, hs: Wm / 2 + 1 };
      aF.xL = mxc - aF.hs; aF.xR = mxc + aF.hs;
      aF.apex = aF.yb + aF.hs * p;
      aF.t = 3.5;
      apex = aF.apex;
    }

    // Silhouette du toit principal (pour cheminée)
    function roofTopAt(x) {
      if (roof === "pignon" || roof === "pignon-raide") return apex - Math.abs(x - mxc) * p;
      if (hip) {
        if (x >= hip.rx0 && x <= hip.rx1) return hip.ridge;
        var d = x < hip.rx0 ? x - (mx0 - o) : (mx1 + o) - x;
        return hip.eave + d * p;
      }
      if (aF) return aF.apex - Math.abs(x - mxc) * p;
      if (shed) return top + Math.abs(x - shed.lowWall) * p + shed.T;
      return apex;
    }

    // Garage
    var gG = walk ? lvl0 : 0;
    var gTopW = gG + 9.3;
    var garageTop = gN ? gTopW + 6 : 0;

    // Cheminée
    var chim = null;
    if (f.cheminee && roof !== "plat") {
      var metal = roof === "pignon-raide" || isA;
      var cw = metal ? 1.1 : 2.4;
      var cx = isA ? mxc + aF.hs * 0.42 : (hip ? (hip.rx1 - hip.rx0 > 4 ? hip.rx1 - 3 : mxc + Wm * 0.18) : mxc + Wm * 0.22);
      var hiEdge = Math.max(roofTopAt(cx - cw / 2), roofTopAt(cx + cw / 2));
      chim = { x: cx - cw / 2, w: cw, y0: (aF ? aF.yb + 4 : top - 1), y1: hiEdge + (metal ? 3.2 : 2.6), metal: metal };
    }

    // Arbre et personnage
    var treeX = -8.5, treeG = grade(treeX);
    var conif = f.arbre === "conifere";
    var treeTop = treeG + (conif ? 19.5 : 18.5);
    var persX = W + (isA && f.galerie ? 7.5 : 4), persG = grade(persX);

    var Hmax = Math.max(apex, garageTop, chim ? chim.y1 : 0, treeTop, persG + 6) + 0.6;
    var s = Math.min(9, (VB_W - 30) / (W + 21), (GY - 14) / Hmax);
    var ox = VB_W / 2 - ((W - 8) / 2) * s;

    function X(x) { return r1(ox + x * s); }
    function Y(y) { return r1(GY - y * s); }
    function pts(arr) { return arr.map(function (q) { return X(q[0]) + "," + Y(q[1]); }).join(" "); }
    function poly(arr, attrs) { return '<polygon points="' + pts(arr) + '"' + (attrs || "") + "/>"; }
    function rect(x, y, w, h, attrs) {
      return '<rect x="' + X(x) + '" y="' + Y(y + h) + '" width="' + r1(w * s) + '" height="' + r1(h * s) + '"' + (attrs || "") + "/>";
    }
    function line(x1, y1, x2, y2, attrs) {
      return '<line x1="' + X(x1) + '" y1="' + Y(y1) + '" x2="' + X(x2) + '" y2="' + Y(y2) + '"' + (attrs || "") + "/>";
    }
    function circ(x, y, rr, attrs) { return '<circle cx="' + X(x) + '" cy="' + Y(y) + '" r="' + r1(rr * s) + '"' + (attrs || "") + "/>"; }

    var out = [];
    var defs = [];
    defs.push('<pattern id="' + id + '-h" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="' + EARTH + '"/><line x1="0" y1="0" x2="0" y2="6" stroke="' + INK + '" stroke-opacity=".28" stroke-width="1"/></pattern>');

    // ---------- Soleil ----------
    var vbY = Math.max(0, Math.floor(Y(Hmax) - 16));
    if (opts.soleil !== false) {
      var sunR = Math.min(9 * s, 54);
      out.push('<circle cx="' + X(mx1 - Wm * 0.12) + '" cy="' + r1(Math.max(Y(apex) + sunR * 0.35, vbY + sunR * 0.75)) + '" r="' + r1(sunR) + '" fill="#c9973a" fill-opacity=".38"/>');
    }

    // ---------- Arbre ----------
    out.push(drawTree());

    // ---------- Fenêtre / porte ----------
    function win(x, y, w, h, style) {
      var g = [];
      g.push(rect(x, y, w, h, ' fill="' + GLASS + '"'));
      var k = Math.min(w, h) * 0.55;
      g.push(poly([[x, y + h], [x + k, y + h], [x, y + h - k]], ' fill="#fff" fill-opacity=".5"'));
      var i, n;
      if (style === "carreaux") {
        g.push(line(x + w / 2, y, x + w / 2, y + h, SKm));
        g.push(line(x, y + h / 3, x + w, y + h / 3, SKm));
        g.push(line(x, y + 2 * h / 3, x + w, y + 2 * h / 3, SKm));
      } else if (style === "bandeau") {
        n = Math.max(1, Math.round(w / 3.6));
        for (i = 1; i < n; i++) g.push(line(x + (w * i) / n, y, x + (w * i) / n, y + h, SKm));
      } else if (style === "pleine") {
        n = Math.max(1, Math.round(w / 3.2));
        for (i = 1; i < n; i++) g.push(line(x + (w * i) / n, y, x + (w * i) / n, y + h, SKm));
        g.push(line(x, y + h * 0.84, x + w, y + h * 0.84, SKm));
      } else {
        g.push(line(x, y + h * 0.7, x + w, y + h * 0.7, SKm));
      }
      g.push(rect(x, y, w, h, ' fill="none"' + SK));
      g.push(rect(x - 0.35, y - 0.3, w + 0.7, 0.3, ' fill="' + INK + '"'));
      return g.join("");
    }

    function doorAt(cx, yb) {
      var w = 3.4, h = 7.2, g = [];
      var modern = winStyle === "bandeau" || winStyle === "pleine";
      g.push(rect(cx - w / 2 - 0.35, yb, w + 0.7, h + 0.35, ' fill="' + wallCol + '"' + SK));
      g.push(rect(cx - w / 2, yb, w, h, ' fill="' + accent + '"' + SK));
      if (modern) {
        g.push(rect(cx + w / 2 - 1.1, yb + 0.9, 0.55, h - 1.8, ' fill="' + GLASS + '"' + SKm));
        g.push(line(cx - w / 2 + 0.6, yb + 2.6, cx - w / 2 + 0.6, yb + 4.6, ' stroke="' + INK + '" stroke-width="2.2" stroke-linecap="round"' + NS));
      } else {
        g.push(rect(cx - w / 2 + 0.5, yb + h * 0.56, w - 1, h * 0.32, ' fill="' + GLASS + '"' + SKm));
        g.push(line(cx, yb + h * 0.56, cx, yb + h * 0.88, SKm));
        g.push(circ(cx - w / 2 + 0.55, yb + 3.4, 0.17, ' fill="' + INK + '"'));
      }
      return g.join("");
    }

    function steps(cx, gy, yb, w) {
      var g = [], hgt = yb - gy;
      if (hgt < 0.4) return "";
      var n = Math.max(1, Math.round(hgt / 0.6));
      g.push(rect(cx - w / 2, gy, w, hgt, ' fill="' + CONC + '"' + SK));
      for (var i = 1; i < n; i++) g.push(line(cx - w / 2, gy + (hgt * i) / n, cx + w / 2, gy + (hgt * i) / n, SKm));
      return g.join("");
    }

    // Remplir un segment horizontal de fenêtres
    var WS = {
      verticales: { w: 2.6, gap: 1.4, split: 16 },
      carreaux: { w: 3.2, gap: 3, split: 16 },
      bandeau: { max: 11, gap: 2.5, split: 24 },
      pleine: { max: 10, gap: 1.2, split: 24 }
    };
    function fillWins(a, b, y, h, style, acc) {
      var cfg = WS[style] || WS.verticales, L = b - a;
      if (L > cfg.split) {
        var mid = (a + b) / 2;
        fillWins(a, mid - 1, y, h, style, acc); fillWins(mid + 1, b, y, h, style, acc);
        return;
      }
      if (cfg.max) {
        if (L < 2.5) return;
        var n = Math.max(1, Math.ceil(L / cfg.max));
        var ww = Math.min(cfg.max, (L - (n - 1) * cfg.gap) / n);
        var tot = n * ww + (n - 1) * cfg.gap, st = a + (L - tot) / 2;
        for (var i = 0; i < n; i++) acc.push(win(st + i * (ww + cfg.gap), y, ww, h, style));
      } else {
        var m = Math.min(4, Math.floor((L + cfg.gap) / (cfg.w + cfg.gap)));
        if (m < 1) return;
        var tot2 = m * cfg.w + (m - 1) * cfg.gap, st2 = a + (L - tot2) / 2;
        for (var j = 0; j < m; j++) acc.push(win(st2 + j * (cfg.w + cfg.gap), y, cfg.w, h, style));
      }
    }
    function segments(a, b, zones) {
      zones = zones.slice().sort(function (u, v) { return u[0] - v[0]; });
      var segs = [], cur = a;
      zones.forEach(function (z) {
        if (z[1] <= cur || z[0] >= b) return;
        if (z[0] > cur) segs.push([cur, z[0]]);
        cur = Math.max(cur, z[1]);
      });
      if (cur < b) segs.push([cur, b]);
      return segs;
    }
    var WH = {
      verticales: { g: [2.6, 5.2], u: [2.6, 4.6] },
      carreaux: { g: [2.8, 4.2], u: [2.6, 4.2] },
      bandeau: { g: [4.0, 3.2], u: [3.6, 3.2] },
      pleine: { g: [0.3, 7.4], u: [1.0, 6.2] }
    }[winStyle] || { g: [2.6, 5.2], u: [2.6, 4.6] };

    // ---------- Garage ----------
    if (gN) {
      var gOut = gLeft ? gx0 : gx1, gIn = gLeft ? gx1 : gx0, dir = gLeft ? -1 : 1;
      out.push(rect(gx0, gG, Wg, gTopW - gG, ' fill="' + wallCol + '"'));
      out.push(sidingLines([[gx0, gG], [gx1, gG], [gx1, gTopW], [gx0, gTopW]], gG));
      if (siding === "pierre") out.push(stoneBlock(gx0, gG, Wg, 3));
      out.push(rect(gx0, gG, Wg, gTopW - gG, ' fill="none"' + SK));
      var gp = [];
      if (roof === "pignon" || roof === "pignon-raide" || roof === "croupe") {
        var pg = roof === "pignon-raide" ? 0.9 : 0.5, og = 1, rise = 12 * pg;
        var eY = gTopW - og * pg, rY = gTopW + rise;
        if (roof === "croupe") gp = [[gOut + dir * og, eY], [gIn, eY], [gIn, rY], [gOut - dir * 12, rY]];
        else gp = [[gOut + dir * og, eY], [gIn, eY], [gIn, rY], [gOut + dir * og, rY]];
        out.push(rect(Math.min(gx0, gx1), eY - 0.7, Wg, 0.7, ' fill="' + INK + '" fill-opacity=".12"'));
        out.push(roofPoly(gp, true));
      } else {
        out.push(rect(Math.min(gOut + dir * 0.4, gIn), gTopW, Wg + 0.4, 1.2, ' fill="' + roofCol + '"' + SK));
      }
      // Porte de garage
      var gdw = gN >= 2 ? 16 : 9, gdh = 7.5, gdx = (gx0 + gx1) / 2 - gdw / 2;
      var glassDoor = winStyle === "bandeau" || winStyle === "pleine";
      out.push(rect(gdx - 0.35, gG, gdw + 0.7, gdh + 0.35, ' fill="' + wallCol + '"' + SK));
      out.push(rect(gdx, gG, gdw, gdh, ' fill="' + (glassDoor ? GLASS : GDOOR) + '"' + SK));
      for (var gi = 1; gi < 4; gi++) out.push(line(gdx, gG + (gdh * gi) / 4, gdx + gdw, gG + (gdh * gi) / 4, SKm));
      if (glassDoor) {
        var gc = Math.round(gdw / 3);
        for (var gj = 1; gj < gc; gj++) out.push(line(gdx + (gdw * gj) / gc, gG, gdx + (gdw * gj) / gc, gG + gdh, SKm));
      } else {
        var nl = Math.round(gdw / 2.3), lw = gdw / nl;
        for (var gk = 0; gk < nl; gk++) out.push(rect(gdx + gk * lw + 0.35, gG + gdh * 0.56, lw - 0.7, gdh * 0.13, ' fill="' + GLASS + '"' + SKm));
      }
      out.push(rect(gdx - 0.8, gG - 0.01, gdw + 1.6, 0.25, ' fill="' + INK + '" fill-opacity=".25"'));
    }

    // ---------- Cheminée (derrière le toit) ----------
    if (chim) {
      out.push(rect(chim.x, chim.y0, chim.w, chim.y1 - chim.y0, ' fill="' + (chim.metal ? "#3a3630" : STONE) + '"' + SK));
      if (!chim.metal) {
        for (var cy = chim.y0 + 0.9; cy < chim.y1 - 0.3; cy += 0.9) out.push(line(chim.x, cy, chim.x + chim.w, cy, SKt));
        out.push(rect(chim.x - 0.3, chim.y1 - 0.45, chim.w + 0.6, 0.45, ' fill="' + INK + '"'));
      } else {
        out.push(rect(chim.x - 0.25, chim.y1 - 0.35, chim.w + 0.5, 0.35, ' fill="' + INK + '"'));
      }
    }

    // ---------- Corps principal ----------
    var doors = (f.portes && f.portes.length ? f.portes : [0.5]).map(function (q) { return mx0 + q * Wm; });

    if (isA) {
      out.push(drawAFrame());
    } else {
      var wp;
      if (roof === "pignon" || roof === "pignon-raide") wp = [[mx0, M], [mx1, M], [mx1, top], [mxc, apexIn], [mx0, top]];
      else if (shed) {
        var tL = shed.hiRight ? top : shed.topHi, tR = shed.hiRight ? shed.topHi : top;
        wp = [[mx0, M], [mx1, M], [mx1, tR], [mx0, tL]];
      } else wp = [[mx0, M], [mx1, M], [mx1, top], [mx0, top]];

      // sous-sol exposé (walkout) ou fondation
      if (walk) {
        out.push(rect(mx0, 0, Wm, M, ' fill="' + (siding === "pierre" ? STONE : CONC) + '"'));
        if (siding === "pierre") out.push(stoneBlock(mx0, 0, Wm, M + 3, true));
        out.push(rect(mx0, 0, Wm, M, ' fill="none"' + SK));
      }
      out.push(poly(wp, ' fill="' + wallCol + '"'));
      out.push(sidingLines(wp, M));
      if (roof === "plat") {
        doors.forEach(function (dx) {
          var wx = clamp(dx - 3.8, mx0, mx1 - 7.6);
          out.push(rect(wx, M, 7.6, top - M, ' fill="#d9a66b"' + SK));
          for (var vx = wx + 0.7; vx < wx + 7.6; vx += 0.7) out.push(line(vx, M, vx, top, ' stroke="' + INK + '" stroke-width=".7" stroke-opacity=".28"' + NS));
        });
      }
      if (siding === "pierre") out.push(stoneBlock(mx0, walk ? M - 0.01 : 0, Wm, walk ? 3 : M + 3));
      else if (!walk) out.push(rect(mx0, 0, Wm, M, ' fill="' + CONC + '"' + SK));
      out.push(poly(wp, ' fill="none"' + SK));

      // Galerie : position des poteaux
      var porch = null;
      if (f.galerie) {
        var pw = clamp(Wm * 0.6, 12, Wm - 3);
        var p0 = clamp(doors[0] - pw / 2, mx0 + 1, mx1 - 1 - pw);
        porch = { x0: p0, x1: p0 + pw, yTop: M + 8.4 };
      }

      // Fenêtres du rez
      var zones = doors.map(function (dx) { return roof === "plat" ? [dx - 5.2, dx + 5.2] : [dx - 3.3, dx + 3.3]; });
      if (porch) { zones.push([porch.x0 - 1.2, porch.x0 + 1.8]); zones.push([porch.x1 - 1.8, porch.x1 + 1.2]); }
      var wins = [];
      segments(mx0 + 2, mx1 - 2, zones).forEach(function (sg) { fillWins(sg[0], sg[1], M + WH.g[0], WH.g[1], winStyle, wins); });

      // Étage
      if (et >= 2) fillWins(mx0 + 2, mx1 - 2, M + 9 + WH.u[0], WH.u[1], winStyle, wins);

      // Pignon : oculus ou fenêtres de combles
      if (roof === "pignon" || roof === "pignon-raide") {
        var gh = apexIn - top;
        if (et === 1.5 && gh > 9) {
          var gw = 2.6, gyb = top + 1.2, gwh = Math.min(4.4, gh * 0.4);
          [mxc - 2.4 - gw / 2, mxc + 2.4 - gw / 2].forEach(function (x) { wins.push(win(x, gyb, gw, gwh, winStyle)); });
        } else if (gh > 4) {
          var orr = Math.min(1.35, gh * 0.12), ocy = top + gh * 0.42;
          wins.push(circ(mxc, ocy, orr, ' fill="' + GLASS + '"' + SK) + line(mxc - orr, ocy, mxc + orr, ocy, SKm) + line(mxc, ocy - orr, mxc, ocy + orr, SKm));
        }
      }

      // Appentis : claire-voie sous la pente
      if (shed) {
        var lowW = shed.lowWall, sgn = shed.hiRight ? 1 : -1;
        var cA = lowW + sgn * (2.4 / p), cB = shed.hiWall - sgn * 1.5;
        var c0 = Math.min(cA, cB), c1 = Math.max(cA, cB);
        if (c1 - c0 > 6) {
          var by = top + 0.5;
          var tAt = function (x) { return top + Math.abs(x - lowW) * p - 0.7; };
          var cl = [[c0, by], [c1, by], [c1, tAt(c1)], [c0, tAt(c0)]];
          var cg = poly(cl, ' fill="' + GLASS + '"');
          var nm = Math.max(2, Math.round((c1 - c0) / 3.4));
          for (var ci = 1; ci < nm; ci++) { var mxi = c0 + ((c1 - c0) * ci) / nm; cg += line(mxi, by, mxi, tAt(mxi), SKm); }
          cg += poly(cl, ' fill="none"' + SK);
          wins.push(cg);
        }
      }

      // Sous-sol walkout : portes-patio côté bas
      if (walk) {
        var ba = highLeft ? xb + 1.5 : mx0 + 2, bb = highLeft ? mx1 - 2 : xb - 1.5;
        fillWins(ba, bb, 0.3, 7.2, "pleine", wins);
      }
      out.push(wins.join(""));

      // Toit
      if (roof === "pignon" || roof === "pignon-raide") {
        var eL = [mx0 - o, top - o * p], eR = [mx1 + o, top - o * p];
        out.push(poly([eL, [mxc, apexIn], eR, [eR[0], eR[1] + TV], [mxc, apexIn + TV], [eL[0], eL[1] + TV]], ' fill="' + roofCol + '"' + SK));
      } else if (hip) {
        out.push(rect(mx0, hip.eave - 0.7, Wm, 0.7, ' fill="' + INK + '" fill-opacity=".12"'));
        out.push(roofPoly([[mx0 - o, hip.eave], [mx1 + o, hip.eave], [hip.rx1, hip.ridge], [hip.rx0, hip.ridge]], true));
        out.push(line(mx0 - o, hip.eave, mx1 + o, hip.eave, ' stroke="' + INK + '" stroke-width="2.4"' + NS));
        if (et === 1.5) out.push(dormers());
      } else if (shed) {
        var lx = shed.lowWall - (shed.hiRight ? o : -o), hx = shed.hiWall + (shed.hiRight ? o : -o);
        var ly = top - o * p, hy = shed.topHi + o * p;
        out.push(poly([[lx, ly - 0.7], [hx, hy - 0.7], [hx, hy], [lx, ly]], ' fill="' + INK + '" fill-opacity=".1"'));
        out.push(poly([[lx, ly], [hx, hy], [hx, hy + shed.T], [lx, ly + shed.T]], ' fill="' + roofCol + '"' + SK));
      } else {
        out.push(rect(mx0, top - 0.7, Wm, 0.7, ' fill="' + INK + '" fill-opacity=".1"'));
        out.push(rect(mx0 - 0.8, top, Wm + 1.6, 1.6, ' fill="' + roofCol + '"' + SK));
      }

      // Portes, auvents, marches
      doors.forEach(function (dx) {
        out.push(doorAt(dx, M));
        if (!porch) {
          if (roof !== "plat") out.push(rect(dx - 3.2, M + 8.1, 6.4, 0.5, ' fill="' + roofCol + '"' + SK));
          out.push(steps(dx, grade(dx), M, 4.6));
        }
      });

      // Galerie
      if (porch) out.push(drawPorch(porch));
    }

    // ---------- Sol ----------
    var Lx = (-ox) / s - 2, Rx = (VB_W - ox) / s + 2, below = 11 / s;
    var gpts = walk
      ? (highLeft ? [[Lx, lvl0], [xa, lvl0], [xb, 0], [Rx, 0]] : [[Lx, 0], [xb, 0], [xa, lvl0], [Rx, lvl0]])
      : [[Lx, 0], [Rx, 0]];
    out.push(poly(gpts.concat([[Rx, -below], [Lx, -below]]), ' fill="url(#' + id + '-h)"'));
    out.push('<polyline points="' + pts(gpts) + '" fill="none"' + SK + "/>");

    // ---------- Personnage ----------
    out.push(drawPerson(persX, persG));

    // ---------- Cote ----------
    var dy = GY + 28;
    out.push('<g' + SKm + '>' +
      '<line x1="' + X(0) + '" y1="' + (GY + 14) + '" x2="' + X(0) + '" y2="' + (dy + 6) + '"/>' +
      '<line x1="' + X(W) + '" y1="' + (GY + 14) + '" x2="' + X(W) + '" y2="' + (dy + 6) + '"/>' +
      '<line x1="' + r1(X(0) - 6) + '" y1="' + dy + '" x2="' + r1(X(W) + 6) + '" y2="' + dy + '"/>' +
      '<line x1="' + r1(X(0) - 4) + '" y1="' + (dy + 4) + '" x2="' + r1(X(0) + 4) + '" y2="' + (dy - 4) + '" stroke-width="1.6"/>' +
      '<line x1="' + r1(X(W) - 4) + '" y1="' + (dy + 4) + '" x2="' + r1(X(W) + 4) + '" y2="' + (dy - 4) + '" stroke-width="1.6"/>' +
      "</g>");
    out.push('<text x="' + X(W / 2) + '" y="' + (dy + 22) + '" text-anchor="middle" font-family="\'DM Mono\', ui-monospace, monospace" font-size="15" letter-spacing=".06em" fill="' + INK + '">' + W + "'-0\"</text>");
    if (opts.label) {
      out.push('<text x="16" y="' + (dy + 22) + '" font-family="\'DM Mono\', ui-monospace, monospace" font-size="12" letter-spacing=".14em" fill="' + INK + '" fill-opacity=".6">' + esc(String(opts.label).toUpperCase()) + "</text>");
    }

    return '<svg class="facade" viewBox="0 ' + vbY + " " + VB_W + " " + (VB_H - vbY) + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Élévation avant — ' + esc(plan.nom || "") + '" preserveAspectRatio="xMidYMax meet"><defs>' + defs.join("") + "</defs>" + out.join("") + "</svg>";

    // ===== Fonctions internes (hissées) =====
    function sidingLines(polyPts, y0) {
      var cid = id + "-c" + defs.length;
      defs.push('<clipPath id="' + cid + '">' + poly(polyPts) + "</clipPath>");
      var xs = polyPts.map(function (q) { return q[0]; }), ys = polyPts.map(function (q) { return q[1]; });
      var a = Math.min.apply(null, xs), b = Math.max.apply(null, xs), yT = Math.max.apply(null, ys);
      var g = [];
      if (siding === "verticale") {
        for (var x = a + 1.33; x < b; x += 1.33) g.push(line(x, y0, x, yT, SKt));
      } else {
        for (var y = y0 + 0.8; y < yT; y += 0.8) g.push(line(a, y, b, y, SKt));
      }
      return '<g clip-path="url(#' + cid + ')">' + g.join("") + "</g>";
    }

    function stoneBlock(x, y, w, h, noFill) {
      var cid = id + "-c" + defs.length;
      defs.push('<clipPath id="' + cid + '">' + rect(x, y, w, h) + "</clipPath>");
      var g = [];
      if (!noFill) g.push(rect(x, y, w, h, ' fill="' + STONE + '"'));
      var row = 0, seed = 7;
      for (var yy = y; yy < y + h; yy += 0.85, row++) {
        g.push(line(x, yy, x + w, yy, SKt));
        var xx = x + (row % 2 ? 0.7 : 0);
        while (xx < x + w) {
          seed = (seed * 9301 + 49297) % 233280;
          xx += 1.3 + (seed / 233280) * 1.6;
          g.push(line(xx, yy, xx, yy + 0.85, SKt));
        }
      }
      g.push(rect(x, y, w, h, ' fill="none"' + SK));
      return '<g clip-path="url(#' + cid + ')">' + g.join("") + "</g>" + rect(x, y, w, h, ' fill="none"' + SK);
    }

    function roofPoly(arr, shingles) {
      var g = poly(arr, ' fill="' + roofCol + '"' + SK);
      if (shingles) {
        var cid = id + "-c" + defs.length;
        defs.push('<clipPath id="' + cid + '">' + poly(arr) + "</clipPath>");
        var xs = arr.map(function (q) { return q[0]; }), ys = arr.map(function (q) { return q[1]; });
        var a = Math.min.apply(null, xs), b = Math.max.apply(null, xs);
        var y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys), l = [];
        for (var y = y0 + 1; y < y1; y += 1) l.push(line(a, y, b, y, ' stroke="#fff" stroke-opacity=".16" stroke-width=".8"' + NS));
        g += '<g clip-path="url(#' + cid + ')">' + l.join("") + "</g>" + poly(arr, ' fill="none"' + SK);
      }
      return g;
    }

    function dormers() {
      var dw = 5.2, wallh = 3.6, yb = hip.eave + 1.6, dp = 1, dov = 0.5;
      var dApexIn = yb + wallh + (dw / 2) * dp, dTop = dApexIn + 0.7;
      function hipX(h) { return (mx0 - o) + (h - hip.eave) / p; }
      function fits(dc) {
        if (dTop > hip.ridge - 0.8) return false;
        var leftEave = dc - dw / 2 - dov, rightEave = dc + dw / 2 + dov;
        var minX = hipX(yb + wallh) + 0.3, minApex = hipX(dTop) + 0.3;
        return leftEave >= minX && dc >= minApex && (2 * mxc - rightEave) >= minX && (2 * mxc - dc) >= minApex;
      }
      var cs = [];
      var c = Math.min(6.5, Wm * 0.2);
      if (fits(mxc - c) && fits(mxc + c)) cs = [mxc - c, mxc + c];
      else if (fits(mxc)) cs = [mxc];
      return cs.map(function (dc) {
        var g = [];
        var x0 = dc - dw / 2, x1 = dc + dw / 2;
        g.push(poly([[x0, yb], [x1, yb], [x1, yb + wallh], [dc, dApexIn], [x0, yb + wallh]], ' fill="' + wallCol + '"' + SK));
        g.push(win(x0 + 0.8, yb + 0.5, dw - 1.6, wallh - 0.6, winStyle));
        var eL = [x0 - dov, yb + wallh - dov * dp], eR = [x1 + dov, yb + wallh - dov * dp];
        g.push(poly([eL, [dc, dApexIn], eR, [eR[0], eR[1] + 0.7], [dc, dApexIn + 0.7], [eL[0], eL[1] + 0.7]], ' fill="' + roofCol + '"' + SK));
        return g.join("");
      }).join("");
    }

    function drawPorch(pc) {
      var g = [], pw2 = pc.x1 - pc.x0, dx = doors[0];
      // plancher
      g.push(rect(pc.x0 - 0.3, M - 0.45, pw2 + 0.6, 0.45, ' fill="' + wallCol + '"' + SK));
      // garde-corps (sauf devant les marches)
      var ra = [[pc.x0 + 0.6, dx - 2.6], [dx + 2.6, pc.x1 - 0.6]];
      ra.forEach(function (sg) {
        if (sg[1] - sg[0] < 0.5) return;
        g.push(line(sg[0], M + 2.8, sg[1], M + 2.8, SK));
        g.push(line(sg[0], M + 0.4, sg[1], M + 0.4, SKm));
        for (var x = sg[0] + 0.45; x < sg[1]; x += 0.45) g.push(line(x, M + 0.4, x, M + 2.8, SKt));
      });
      // poteaux
      [pc.x0, pc.x1 - 0.6].forEach(function (x) { g.push(rect(x, M, 0.6, pc.yTop - M, ' fill="' + wallCol + '"' + SK)); });
      // toit de galerie + ombre
      g.push(rect(pc.x0 + 0.6, pc.yTop - 0.6, pw2 - 1.2, 0.6, ' fill="' + INK + '" fill-opacity=".12"'));
      g.push(rect(pc.x0 - 1, pc.yTop, pw2 + 2, 1, ' fill="' + roofCol + '"' + SK));
      g.push(steps(dx, grade(dx), M - 0.45, 4.8));
      return g.join("");
    }

    function drawAFrame() {
      var g = [], yb = aF.yb, t = aF.t;
      // pieux + plancher / terrasse
      var dx0 = f.galerie ? aF.xL - 4 : aF.xL - 0.5, dx1 = f.galerie ? aF.xR + 4 : aF.xR + 0.5;
      for (var x = dx0 + 0.8; x < dx1 - 0.5; x += 5.5) g.push(rect(x, 0, 0.6, yb - 0.4, ' fill="' + CONC + '"' + SKm));
      g.push(rect(dx1 - 1.4, 0, 0.6, yb - 0.4, ' fill="' + CONC + '"' + SKm));
      g.push(rect(dx0, yb - 0.4, dx1 - dx0, 0.4, ' fill="' + wallCol + '"' + SK));
      if (f.galerie) {
        [[dx0 + 0.3, aF.xL - 0.4], [aF.xR + 0.4, dx1 - 0.3]].forEach(function (sg) {
          g.push(line(sg[0], yb + 2.8, sg[1], yb + 2.8, SK));
          for (var bx = sg[0]; bx <= sg[1] + 0.01; bx += 0.5) g.push(line(bx, yb, bx, yb + 2.8, SKt));
          g.push(line(sg[0], yb, sg[0], yb + 2.8, SKm));
        });
      }
      // toit
      g.push(poly([[aF.xL, yb], [mxc, aF.apex], [aF.xR, yb]], ' fill="' + roofCol + '"' + SK));
      // pignon vitré
      var iA = aF.apex - t * p * 1.05, iL = aF.xL + t, iR = aF.xR - t;
      var ip = [[iL, yb], [mxc, iA], [iR, yb]];
      g.push(poly(ip, ' fill="' + GLASS + '"'));
      var hw = (iR - iL) / 2;
      g.push(poly([[iL, yb], [iL + hw * 0.55, yb + (iA - yb) * 0.55], [iL + hw * 0.15, yb]], ' fill="#fff" fill-opacity=".45"'));
      function innerY(xx) { return iA - Math.abs(xx - mxc) * ((iA - yb) / hw); }
      for (var mx = iL + 3; mx < iR - 0.5; mx += 3) {
        if (Math.abs(mx - mxc) < 2.2) continue;
        g.push(line(mx, yb, mx, innerY(mx), SKm));
      }
      var my = yb + 9.6;
      if (my < iA - 2) {
        var mhw = (iA - my) * (hw / (iA - yb));
        g.push(line(mxc - mhw, my, mxc + mhw, my, SK));
        var ry = my + 2.6, rhw = (iA - ry) * (hw / (iA - yb));
        g.push(line(mxc - rhw, ry, mxc + rhw, ry, SKm));
        for (var bx2 = mxc - rhw + 0.6; bx2 < mxc + rhw; bx2 += 0.6) g.push(line(bx2, my, bx2, Math.min(ry, innerY(bx2)), SKt));
      }
      g.push(line(mxc, yb + 7.6, mxc, my, SKm));
      g.push(poly(ip, ' fill="none"' + SK));
      g.push(doorAt(mxc, yb));
      g.push(steps(mxc, 0, yb - 0.4, 4.6));
      return g.join("");
    }

    function drawTree() {
      var tx = treeX, tg = treeG, g = [];
      if (conif) {
        g.push(line(tx, tg, tx, tg + 3, SK));
        [[9, 2.5, 11.5], [7.4, 6.5, 15.6], [5.6, 10.6, 19.5]].forEach(function (tr) {
          g.push(poly([[tx - tr[0] / 2, tg + tr[1]], [tx, tg + tr[2]], [tx + tr[0] / 2, tg + tr[1]]], ' fill="#2f4a3f"' + SK));
        });
      } else {
        g.push(line(tx, tg, tx, tg + 9, SK));
        g.push('<ellipse cx="' + X(tx) + '" cy="' + Y(tg + 12.5) + '" rx="' + r1(5 * s) + '" ry="' + r1(6 * s) + '" fill="#6b6d3b"' + SK + "/>");
        g.push(line(tx, tg + 8.5, tx, tg + 15, ' stroke="#f1e9dc" stroke-opacity=".55" stroke-width="1.2"' + NS));
        g.push(line(tx, tg + 11, tx - 2.2, tg + 13.5, ' stroke="#f1e9dc" stroke-opacity=".55" stroke-width="1.2"' + NS));
        g.push(line(tx, tg + 12.2, tx + 2, tg + 14.6, ' stroke="#f1e9dc" stroke-opacity=".55" stroke-width="1.2"' + NS));
      }
      return g.join("");
    }

    function drawPerson(px, pg) {
      var g = [];
      g.push(line(px - 0.28, pg, px - 0.2, pg + 2.6, SK));
      g.push(line(px + 0.28, pg, px + 0.2, pg + 2.6, SK));
      g.push(poly([[px - 0.78, pg + 2.3], [px + 0.78, pg + 2.3], [px + 0.5, pg + 4.95], [px - 0.5, pg + 4.95]], ' fill="' + accent + '"' + SK));
      g.push(circ(px, pg + 5.5, 0.46, ' fill="' + INK + '"'));
      return g.join("");
    }
  }

  // ---------- Schéma de plan (rez-de-chaussée) ----------
  function drawPlanMini(plan) {
    var W = plan.largeur || 40, D = plan.profondeur || 32;
    var f = plan.facade || {};
    var gN = plan.roof === "a-frame" ? 0 : (plan.garage || 0);
    var Wg = gN >= 2 ? 22 : gN === 1 ? 13 : 0;
    var gLeft = f.garageCote === "gauche";
    var Wm = W - Wg, mx0 = gLeft ? Wg : 0;
    var S = 8, pad = 14;
    var vw = W * S + pad * 2, vh = D * S + pad * 2 + 22;
    function px(x) { return r1(pad + x * S); }
    function py(y) { return r1(pad + y * S); }
    var g = [];
    var Rm = ' fill="#fbf7f0" stroke="' + INK + '" stroke-width="1.2"' + NS;
    function room(x, y, w, h, lab, fill) {
      g.push('<rect x="' + px(x) + '" y="' + py(y) + '" width="' + r1(w * S) + '" height="' + r1(h * S) + '"' + (fill ? ' fill="' + fill + '" stroke="' + INK + '" stroke-width="1.2"' + NS : Rm) + "/>");
      if (lab && w > 4 && h > 3) g.push('<text x="' + px(x + w / 2) + '" y="' + r1(py(y + h / 2) + 4) + '" text-anchor="middle" font-family="\'DM Mono\', ui-monospace, monospace" font-size="' + (w < 8 ? 13 : 16) + '" letter-spacing=".08em" fill="' + INK + '">' + lab + "</text>");
    }
    // y = 0 à l'arrière, D à l'avant (façade en bas)
    var gDepth = Math.min(D, 24);
    if (gN) room(gLeft ? 0 : Wm, D - gDepth, Wg, gDepth, "GAR", "#e8dece");
    var frontH = D * 0.5, backH = D - frontH;
    var front = [], back = [];
    if (plan.etages > 1) {
      front = ["SÉJ", "ENT", "SAM"]; back = ["CUIS", "SDB", "BUR"];
      if (plan.roof === "a-frame") { front = ["SÉJ"]; back = ["CUIS", "SDB", "CH"]; }
    } else {
      var nch = Math.min(plan.chambres || 2, Wm > 50 ? 4 : 3);
      front = Wm > 40 ? ["SÉJ", "SAM", "CUIS"] : ["SÉJ", "CUIS"];
      back = [];
      for (var i = 0; i < nch; i++) back.push("CH");
      back.splice(Math.ceil(nch / 2), 0, "SDB");
    }
    function row(labels, y, h, weights) {
      var tot = labels.reduce(function (a, l, k) { return a + (weights ? weights(l) : 1); }, 0), x = mx0;
      labels.forEach(function (l) {
        var w = Wm * (weights ? weights(l) : 1) / tot;
        room(x, y, w, h, l);
        x += w;
      });
    }
    function wt(l) { return l === "SDB" || l === "ENT" ? 0.55 : l === "SÉJ" ? 1.4 : 1; }
    row(back, 0, backH, wt);
    row(front, backH, frontH, wt);
    // contour épais
    g.push('<rect x="' + px(mx0) + '" y="' + py(0) + '" width="' + r1(Wm * S) + '" height="' + r1(D * S) + '" fill="none" stroke="' + INK + '" stroke-width="3"' + NS + "/>");
    if (gN) g.push('<rect x="' + px(gLeft ? 0 : Wm) + '" y="' + py(D - gDepth) + '" width="' + r1(Wg * S) + '" height="' + r1(gDepth * S) + '" fill="none" stroke="' + INK + '" stroke-width="3"' + NS + "/>");
    // porte(s) d'entrée
    (f.portes && f.portes.length ? f.portes : [0.5]).forEach(function (q) {
      var dx = mx0 + q * Wm;
      g.push('<line x1="' + px(dx - 1.6) + '" y1="' + py(D) + '" x2="' + px(dx + 1.6) + '" y2="' + py(D) + '" stroke="' + (plan.accent || "#a8502a") + '" stroke-width="5"' + NS + "/>");
    });
    g.push('<text x="' + px(0) + '" y="' + r1(vh - 4) + '" font-family="\'DM Mono\', ui-monospace, monospace" font-size="14" letter-spacing=".12em" fill="' + INK + '" fill-opacity=".6">REZ-DE-CHAUSSÉE · SCHÉMA</text>');
    return '<svg class="plan-mini" viewBox="0 0 ' + vw + " " + vh + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Schéma du rez-de-chaussée — ' + esc(plan.nom || "") + '">' + g.join("") + "</svg>";
  }

  window.drawFacade = drawFacade;
  window.drawPlanMini = drawPlanMini;
})();
