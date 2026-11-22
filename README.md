# Casa Atelier — Plans résidentiels et conception (site vitrine)

Site statique (HTML, CSS, JavaScript sans dépendance). Aucun serveur, aucune base de données, aucune étape de compilation.

## Pages

| Fichier | Contenu |
|---|---|
| `index.html` | Accueil : services, étude d'ensoleillement interactive, processus, avis architecte/ingénieur, FAQ |
| `plans.html` | Catalogue de plans prêts à bâtir (filtres, fiche détaillée, façades dessinées par le code) |
| `sur-mesure.html` | Formulaire de conception résidentielle (13 sections) → courriel prérempli (`mailto:`) |
| `404.html` | Page introuvable |

## À modifier avant la mise en ligne

1. **`js/config.js`** : courriel qui reçoit les demandes (`bonjour@casaatelier.ca` est un exemple), téléphone, réseaux sociaux.
2. **`js/plans-data.js`** : les modèles sont des **données d'exemple** (superficies, chambres, noms). Remplacer par les vraies fiches.
3. Textes de la FAQ et de l'avis (`index.html`, sections `#faq` et `#avis`) : à relire.
4. Ne pas mentionner de sceau ni d'ordre professionnel tant que l'assurance et l'inscription ne sont pas en place.

## Essayer en local

Ouvrir `index.html` dans un navigateur suffit. Pour un rendu identique à GitHub Pages :

```bash
python -m http.server 8765
```

puis ouvrir http://127.0.0.1:8765.

## Déployer sur GitHub Pages

1. Créer un dépôt GitHub et y pousser ce dossier.
2. Dépôt → Settings → Pages → Source : « Deploy from a branch », branche `main`, dossier `/ (root)`.
3. Domaine personnalisé (facultatif) : Settings → Pages → Custom domain (ex. `casaatelier.ca`), puis un enregistrement CNAME chez le registraire.

`_gabarit.html` contient l'en-tête et le pied de page communs pour créer une nouvelle page ; Jekyll (GitHub Pages) ne le publie pas.

## Formulaire et courriel

Rien n'est envoyé par le site : le bouton ouvre l'application de courriel du visiteur avec le message prérempli. Si le message est long, le site copie le texte complet dans le presse-papiers. Le récapitulatif se télécharge aussi en PDF (jsPDF chargé depuis cdnjs au clic ; hors ligne, la fenêtre d’impression prend le relais), en .txt ou s’imprime.
