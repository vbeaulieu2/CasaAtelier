/* Récapitulatif du formulaire en PDF — généré dans le navigateur (jsPDF chargé à la demande).
   window.BTRecapPdf(modele) → Promise ; télécharge « fiche-projet-<nom>.pdf ».
   modele = { titre, lieu, sujet, date, nomFichier, facadeSvg, sections: [{ n, t, tone, rows: [{ l, t } | { rank: [] }] }] } */
(function () {
  const JSPDF_URL = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
  const COL = {
    ink: [42, 31, 25], ink2: [90, 74, 62], ink3: [147, 129, 111], line: [214, 202, 184],
    paper: [241, 233, 220], paper2: [232, 222, 206],
    tangerine: [168, 80, 42], mustard: [201, 151, 58], avocado: [107, 109, 59], teal: [47, 74, 63], forest: [31, 43, 36]
  };
  const TONE = { tangerine: COL.tangerine, mustard: [160, 118, 40], avocado: COL.avocado, teal: COL.teal, ink: COL.ink };

  let loading = null;
  function loadJsPdf() {
    if (window.jspdf && window.jspdf.jsPDF) return Promise.resolve(window.jspdf.jsPDF);
    if (loading) return loading;
    loading = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = JSPDF_URL;
      s.async = true;
      s.onload = () => (window.jspdf && window.jspdf.jsPDF ? resolve(window.jspdf.jsPDF) : reject(new Error("jsPDF absent")));
      s.onerror = () => { loading = null; reject(new Error("Chargement de jsPDF impossible")); };
      document.head.appendChild(s);
    });
    return loading;
  }

  // Les polices standard du PDF (WinAnsi) ne couvrent pas tout Unicode : on remplace le reste.
  const KEEP = "’‘“”–—…•€ŒœŠšŽžŸ";
  const MAP = { "≈": "~", "→": "->", "←": "<-", "✦": "*", "×": "x", "≤": "<=", "≥": ">=", " ": " ", " ": " " };
  function clean(s) {
    return String(s == null ? "" : s).replace(/[\s\S]/gu, (c) => {
      if (MAP[c] != null) return MAP[c];
      const code = c.codePointAt(0);
      if (code <= 255 || KEEP.includes(c)) return c;
      const base = c.normalize("NFD").replace(/[̀-ͯ]/g, "");
      return base.length === 1 && base.codePointAt(0) <= 255 ? base : "";
    });
  }

  function svgToPng(svg, w, h) {
    return new Promise((resolve) => {
      if (!svg) return resolve(null);
      const img = new Image();
      const t = setTimeout(() => resolve(null), 3000);
      img.onload = () => {
        clearTimeout(t);
        try {
          const scale = 3;
          const c = document.createElement("canvas");
          c.width = w * scale; c.height = h * scale;
          const ctx = c.getContext("2d");
          ctx.fillStyle = "rgb(232,222,206)";
          ctx.fillRect(0, 0, c.width, c.height);
          const r = Math.min(c.width / img.width, c.height / img.height) * 0.92;
          const iw = img.width * r, ih = img.height * r;
          ctx.drawImage(img, (c.width - iw) / 2, c.height - ih - c.height * 0.04, iw, ih);
          resolve(c.toDataURL("image/png"));
        } catch (e) { resolve(null); }
      };
      img.onerror = () => { clearTimeout(t); resolve(null); };
      const sized = svg.replace("<svg ", `<svg width="${w * 4}" height="${h * 4}" `);
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(sized);
    });
  }

  async function build(m) {
    const JsPDF = await loadJsPdf();
    const doc = new JsPDF({ unit: "pt", format: "letter" });
    const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight();
    const M = 48, BOTTOM = H - 64;
    const LABEL_W = 150, VAL_X = M + LABEL_W + 12, VAL_W = W - M - VAL_X;
    const BT = window.BT || {};
    let y = 0;

    const color = (rgb, kind) => (kind === "fill" ? doc.setFillColor(...rgb) : kind === "draw" ? doc.setDrawColor(...rgb) : doc.setTextColor(...rgb));
    const font = (f, st, size) => { doc.setFont(f, st); doc.setFontSize(size); };

    function stripes(top, h) {
      const cols = [COL.tangerine, COL.forest, COL.forest, COL.forest];
      const w = W / cols.length;
      cols.forEach((c, i) => { color(c, "fill"); doc.rect(i * w, top, w + 0.5, h, "F"); });
    }
    function pageFrame() {
      color(COL.paper, "fill"); doc.rect(0, 0, W, H, "F");
      stripes(0, 6);
    }
    function newPage() { doc.addPage(); pageFrame(); y = M; }
    function ensure(h) { if (y + h > BOTTOM) newPage(); }

    // ---------- Première page : en-tête ----------
    pageFrame();
    y = M + 6;
    font("courier", "normal", 8.5); color(COL.ink3);
    doc.text(clean(`FICHE DE PROJET  ·  ${m.date}`.toUpperCase()), M, y);
    font("times", "bold", 20); color(COL.tangerine);
    doc.text("casa", W - M, y + 2, { align: "right" });
    font("helvetica", "normal", 6.5); color(COL.ink);
    doc.setCharSpace(3.2);
    doc.text("ATELIER", W - M - 2, y + 11, { align: "right" });
    doc.setCharSpace(0);

    const facW = 190, facH = 120;
    const png = await svgToPng(m.facadeSvg, facW, facH);
    const titleW = png ? W - 2 * M - facW - 20 : W - 2 * M;

    y += 34;
    font("times", "bold", 28); color(COL.ink);
    const titleLines = doc.splitTextToSize(clean(m.titre), titleW);
    doc.text(titleLines, M, y);
    y += (titleLines.length - 1) * 30;
    if (m.lieu) {
      y += 26;
      font("times", "italic", 20); color(COL.tangerine);
      doc.text(doc.splitTextToSize(clean("à " + m.lieu), titleW), M, y);
    }
    y += 22;
    font("courier", "normal", 9); color(COL.ink2);
    const subj = doc.splitTextToSize(clean(m.sujet), titleW);
    doc.text(subj, M, y);
    y += subj.length * 11;

    if (png) {
      const top = M + 36;
      doc.addImage(png, "PNG", W - M - facW, top, facW, facH);
      color(COL.ink, "draw"); doc.setLineWidth(0.6); doc.rect(W - M - facW, top, facW, facH, "S");
      y = Math.max(y, top + facH + 8);
    }

    y += 12;
    color(COL.ink, "draw"); doc.setLineWidth(1.2); doc.line(M, y, W - M, y);
    y += 26;

    // ---------- Sections ----------
    m.sections.forEach((sec) => {
      const tone = COL.tangerine; // numéros en rouille, comme le site
      ensure(54);
      font("times", "italic", 22); color(tone);
      const num = String(sec.n).padStart(2, "0");
      doc.text(num, M, y);
      const numW = doc.getTextWidth(num);
      font("helvetica", "bold", 12); color(COL.ink);
      doc.text(clean(sec.t), M + numW + 10, y - 1);
      y += 8;
      color(COL.line, "draw"); doc.setLineWidth(0.6); doc.line(M, y, W - M, y);
      y += 16;

      if (!sec.rows.length) {
        font("helvetica", "italic", 9.5); color(COL.ink3);
        doc.text(sec.n === 12 ? "Pas encore classées." : "Rien d'indiqué.", M, y);
        y += 16;
        return;
      }

      sec.rows.forEach((r) => {
        if (r.rank) {
          ensure(14);
          font("helvetica", "normal", 8.5); color(COL.ink3);
          doc.text("ORDRE DE PRIORITÉ", M, y);
          r.rank.forEach((p, i) => {
            ensure(16);
            font("times", "italic", 13); color(tone);
            doc.text(String(i + 1), VAL_X, y + 1);
            font("helvetica", "normal", 10.5); color(COL.ink);
            doc.text(clean(p), VAL_X + 18, y);
            y += 16;
          });
          y += 4;
          return;
        }
        font("helvetica", "normal", 10.5);
        const lines = doc.splitTextToSize(clean(r.t), r.l ? VAL_W : W - 2 * M);
        font("helvetica", "normal", 8.5);
        const labelLines = r.l ? doc.splitTextToSize(clean(r.l).toUpperCase(), LABEL_W) : [];
        const h = Math.max(lines.length * 13.5, labelLines.length * 11) + 6;
        ensure(Math.min(h, 120));
        if (r.l) { color(COL.ink3); doc.text(labelLines, M, y); }
        font("helvetica", "normal", 10.5); color(COL.ink);
        const startY = y, startPage = doc.getNumberOfPages();
        // Valeurs longues (commentaires) : on coupe proprement d'une page à l'autre.
        lines.forEach((ln) => {
          ensure(14);
          doc.text(ln, r.l ? VAL_X : M, y);
          y += 13.5;
        });
        if (doc.getNumberOfPages() === startPage) y = Math.max(y, startY + labelLines.length * 11);
        y += 6;
      });
      y += 8;
    });

    // ---------- Avis ----------
    const avis = doc.splitTextToSize(clean("Certaines municipalités exigent des plans signés par un architecte ou un ingénieur. Nous ne fournissons pas ces services, mais pouvons vous orienter vers les bons professionnels."), W - 2 * M - 40);
    const boxH = 30 + avis.length * 12;
    ensure(boxH + 10);
    color([246, 236, 214], "fill"); color(COL.ink, "draw"); doc.setLineWidth(1);
    doc.roundedRect(M, y, W - 2 * M, boxH, 8, 8, "FD");
    color(COL.forest, "fill"); doc.roundedRect(M + 10, y + 10, 16, 16, 3, 3, "F");
    font("helvetica", "bold", 10); color(COL.paper); doc.text("!", M + 16.6, y + 21.5); color(COL.ink);
    doc.text(clean("À vérifier avec votre municipalité"), M + 34, y + 21);
    font("helvetica", "normal", 9.5); color(COL.ink2);
    doc.text(avis, M + 34, y + 36);
    y += boxH + 10;

    // ---------- Pieds de page ----------
    const n = doc.getNumberOfPages();
    for (let i = 1; i <= n; i++) {
      doc.setPage(i);
      color(COL.line, "draw"); doc.setLineWidth(0.6); doc.line(M, H - 44, W - M, H - 44);
      font("courier", "normal", 8); color(COL.ink3);
      const contact = [BT.telephone, BT.courriel].filter(Boolean).join("  ·  ");
      doc.text(clean(`Casa Atelier · Plans résidentiels et conception  ·  ${contact}`), M, H - 30);
      doc.text(`${i} / ${n}`, W - M, H - 30, { align: "right" });
    }

    doc.setProperties({ title: clean(m.sujet), subject: "Formulaire de conception résidentielle", creator: "Casa Atelier" });
    doc.save(m.nomFichier || "fiche-projet.pdf");
  }

  window.BTRecapPdf = build;
})();
