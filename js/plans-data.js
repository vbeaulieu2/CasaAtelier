// DONNÉES D'EXEMPLE — superficies, chambres, etc. à remplacer par les vraies fiches de Carolanne.
/*
  Catalogue des plans prêts à bâtir. Lu par plans.html (catalogue.js) et sur-mesure.html.

  Schéma d'un modèle :
    id          "03"            identifiant à deux chiffres (sert aussi d'ancre : plans.html#03)
    nom         "La Kingsey"
    style       "Rustique chic"
    superficie  1840            pi² habitables (hors garage et sous-sol)
    largeur     62              pi, façade avant (garage compris)
    profondeur  34              pi
    etages      1 | 1.5 | 2
    chambres    3
    sdb         2               salles de bain (2.5 = 2 sdb + 1 salle d'eau)
    garage      0 | 1 | 2       nombre de places
    sousSol     "Complet" | "Aucun (dalle sur sol)" | "Walkout" | …
    pitch       une phrase
    points      [3 ou 4 points forts]
    themes      parmi "Petit budget", "Avec garage", "Sans sous-sol", "Avec vue", "Terrain en pente", "Nouveauté"
    roof        "pignon" | "pignon-raide" | "appentis" | "plat" | "a-frame" | "croupe"
    accent      couleur de la palette (porte, détails)
    facade      réglages du dessin d'élévation (facade.js) :
                garageCote "gauche"|"droite", revetement "verticale"|"horizontale"|"pierre",
                fenetres "verticales"|"carreaux"|"bandeau"|"pleine", portes [positions 0-1],
                galerie, cheminee, walkout, hautCote (appentis), mur, toit, arbre "feuillu"|"conifere"
*/
window.PLANS = [
  {
    id: "01",
    nom: "L'Arthabaska",
    style: "Farmhouse moderne",
    superficie: 2180,
    largeur: 56,
    profondeur: 38,
    etages: 2,
    chambres: 4,
    sdb: 2.5,
    garage: 2,
    sousSol: "Complet",
    pitch: "La ferme réinventée : grand pignon, galerie couverte et lignes nettes.",
    points: [
      "Aire ouverte cuisine-séjour sous plafond de 9 pi",
      "Vestiaire et salle de lavage côté garage",
      "Suite parentale avec walk-in et douche vitrée",
      "Galerie avant couverte sur toute l'entrée"
    ],
    themes: ["Avec garage"],
    roof: "pignon",
    accent: "#a8502a",
    facade: {
      garageCote: "droite", revetement: "verticale", fenetres: "verticales", portes: [0.5],
      galerie: true, cheminee: false, mur: "#fbf7f0", toit: "#2b2824", arbre: "feuillu"
    }
  },
  {
    id: "02",
    nom: "La Bulstrode",
    style: "Contemporain",
    superficie: 1460,
    largeur: 58,
    profondeur: 30,
    etages: 1,
    chambres: 3,
    sdb: 2,
    garage: 1,
    sousSol: "Aucun (dalle sur sol)",
    pitch: "Plain-pied lumineux, toit en appentis, tout sur un seul niveau.",
    points: [
      "Fenêtres en bandeau sous un plafond qui monte",
      "Aucune marche : pensée pour vieillir chez soi",
      "Dalle chauffante, pas de sous-sol à finir",
      "Garage simple avec rangement"
    ],
    themes: ["Petit budget", "Avec garage", "Sans sous-sol"],
    roof: "appentis",
    accent: "#c9973a",
    facade: {
      garageCote: "gauche", revetement: "horizontale", fenetres: "bandeau", portes: [0.32],
      galerie: false, cheminee: false, hautCote: "droite", mur: "#fbf7f0", toit: "#2f4a3f", arbre: "feuillu"
    }
  },
  {
    id: "03",
    nom: "La Kingsey",
    style: "Rustique chic",
    superficie: 1840,
    largeur: 62,
    profondeur: 34,
    etages: 1.5,
    chambres: 3,
    sdb: 2,
    garage: 2,
    sousSol: "Complet",
    pitch: "Pierre, lucarnes et foyer : le charme campagne, sans le vieux.",
    points: [
      "Foyer central au bois dans le séjour",
      "Deux chambres sous les combles avec lucarnes",
      "Base de pierre et galerie de bois",
      "Garage double attenant"
    ],
    themes: ["Avec garage"],
    roof: "croupe",
    accent: "#a8502a",
    facade: {
      garageCote: "gauche", revetement: "pierre", fenetres: "carreaux", portes: [0.5],
      galerie: true, cheminee: true, mur: "#f6ecda", toit: "#4f5a2a", arbre: "feuillu"
    }
  },
  {
    id: "04",
    nom: "Le Mont-Gleason",
    style: "Chalet",
    superficie: 1120,
    largeur: 28,
    profondeur: 34,
    etages: 1.5,
    chambres: 2,
    sdb: 1,
    garage: 0,
    sousSol: "Aucun (sur pieux)",
    pitch: "Le A-frame des années 60, revu pour vivre à l'année.",
    points: [
      "Pignon tout vitré, face à la vue",
      "Mezzanine ouverte sur le séjour",
      "Petite empreinte au sol, petits coûts",
      "Sur pieux : parfait pour terrain boisé"
    ],
    themes: ["Petit budget", "Sans sous-sol", "Avec vue"],
    roof: "a-frame",
    accent: "#c9973a",
    facade: {
      revetement: "verticale", fenetres: "pleine", portes: [0.5],
      galerie: true, cheminee: true, mur: "#fbf7f0", toit: "#a8502a", arbre: "conifere"
    }
  },
  {
    id: "05",
    nom: "La Princeville",
    style: "Moderne",
    superficie: 2360,
    largeur: 70,
    profondeur: 36,
    etages: 1,
    chambres: 4,
    sdb: 3,
    garage: 1,
    sousSol: "Complet",
    pitch: "Bungalow à toit plat, deux portes : une maison, deux générations.",
    points: [
      "Logement intergénérationnel avec entrée distincte",
      "Porte communicante entre les deux unités",
      "Toit plat et fenêtres en bandeau",
      "Garage pour l'unité principale"
    ],
    themes: ["Nouveauté", "Avec garage"],
    roof: "plat",
    accent: "#6b6d3b",
    facade: {
      garageCote: "droite", revetement: "horizontale", fenetres: "bandeau", portes: [0.28, 0.74],
      galerie: false, cheminee: false, mur: "#fbf7f0", toit: "#2b2824", arbre: "feuillu"
    }
  },
  {
    id: "06",
    nom: "La Nicolet",
    style: "Scandinave",
    superficie: 1390,
    largeur: 26,
    profondeur: 30,
    etages: 2,
    chambres: 3,
    sdb: 1.5,
    garage: 0,
    sousSol: "Complet",
    pitch: "Petite, haute et futée : la scandinave sur deux étages.",
    points: [
      "Terrain étroit? Elle entre presque partout",
      "Toit raide, sans débord, look épuré",
      "Trois chambres à l'étage",
      "Poêle et conduit en façade"
    ],
    themes: ["Petit budget", "Nouveauté"],
    roof: "pignon-raide",
    accent: "#2f4a3f",
    facade: {
      revetement: "verticale", fenetres: "verticales", portes: [0.5],
      galerie: false, cheminee: true, mur: "#e6c8ae", toit: "#2b2824", arbre: "conifere"
    }
  },
  {
    id: "07",
    nom: "La Bécancour",
    style: "Prestige",
    superficie: 2720,
    largeur: 66,
    profondeur: 42,
    etages: 1,
    chambres: 4,
    sdb: 3,
    garage: 2,
    sousSol: "Walkout",
    pitch: "Propriété d'exception pour terrain en dénivelé : le sous-sol voit le jour.",
    points: [
      "Sous-sol walkout avec portes-patio pleine hauteur",
      "Grandes baies côté vue",
      "Garage double au niveau de la rue",
      "Plafond cathédrale sous le toit en appentis"
    ],
    themes: ["Terrain en pente", "Avec vue", "Avec garage"],
    roof: "appentis",
    accent: "#a8502a",
    facade: {
      garageCote: "gauche", revetement: "pierre", fenetres: "pleine", portes: [0.16],
      galerie: false, cheminee: false, walkout: true, hautCote: "droite",
      mur: "#fbf7f0", toit: "#2b2824", arbre: "conifere"
    }
  }
];
