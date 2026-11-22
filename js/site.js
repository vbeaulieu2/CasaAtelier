/* Comportements communs à toutes les pages : navigation, apparitions, coordonnées. */
(function () {
  document.documentElement.classList.remove("no-js");

  // Navigation : bordure au défilement + menu mobile
  const nav = document.querySelector(".nav");
  if (nav) {
    const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const toggle = nav.querySelector(".nav__toggle");
    if (toggle) {
      toggle.addEventListener("click", () => {
        const open = nav.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", String(open));
      });
      nav.querySelectorAll(".nav__links a").forEach((a) =>
        a.addEventListener("click", () => {
          nav.classList.remove("is-open");
          toggle.setAttribute("aria-expanded", "false");
        })
      );
    }
  }

  // Apparition douce au défilement
  const items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      }),
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    items.forEach((el) => io.observe(el));
  } else {
    items.forEach((el) => el.classList.add("is-in"));
  }

  // Coordonnées injectées depuis config.js (une seule source à modifier)
  const BT = window.BT || {};
  document.querySelectorAll("[data-bt]").forEach((el) => {
    const key = el.getAttribute("data-bt");
    if (key === "courriel") { el.textContent = BT.courriel; if (el.tagName === "A") el.href = "mailto:" + BT.courriel; }
    else if (key === "telephone") { el.textContent = BT.telephone; if (el.tagName === "A") el.href = "tel:" + BT.telephoneLien; }
    else if (key === "adresse") el.textContent = BT.adresse;
    else if (key === "annee") el.textContent = new Date().getFullYear();
    else if (BT.reseaux && BT.reseaux[key] && el.tagName === "A") el.href = BT.reseaux[key];
  });
})();
