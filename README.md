# Simulateur de moyenne du bac

Outil web qui calcule une moyenne pondérée et répond à la question inverse :
« il me faut combien sur les épreuves qui restent pour avoir la mention ? »

En ligne : https://dunandchatellet.fr/simulateur/

## Ce que ça fait

- Tableau de matières éditable : nom, coefficient, note sur 20, saisie au clavier
  ou avec un curseur de 0 à 20 (pas de 0,25). Les deux restent synchronisés et
  une note hors limites est ramenée entre 0 et 20 à la sortie du champ.
- Case « à venir » pour les épreuves pas encore passées : elles sortent de la moyenne courante mais restent dans le calcul de l'objectif.
- Bouton ★ sur les matières à venir pour les « privilégier » : l'objectif y vise
  une note plus haute que sur les autres, avec un écart réglable de 0 à 5 points.
- Moyenne pondérée recalculée à chaque frappe, avec la mention correspondante.
- Solveur inverse : à partir d'un objectif, la note nécessaire sur les épreuves restantes, recalculée en direct. Les cas impossibles (plus de 20) et déjà acquis (moins de 0) sont traités à part.
- L'objectif et l'écart sont conservés eux aussi (`simulateur-bac-objectif`).
- Grille officielle des coefficients du bac 2027 (voie générale) avec un bouton qui la charge dans le tableau.
- Les saisies sont conservées dans `localStorage`, donc elles survivent au rafraîchissement.

## Le calcul

Moyenne pondérée classique sur les matières notées :

```
moyenne = somme(note x coef) / somme(coef)
```

Pour l'objectif, on cherche la note `x` commune aux épreuves restantes telle que la
moyenne finale atteigne la cible :

```
x = (objectif x coef_total - points_deja_acquis) / coef_des_epreuves_restantes
```

`coef_total` inclut les épreuves à venir, sinon l'objectif serait calculé sur un
dénominateur qui ne correspond pas au bac réel.

Avec des matières ★ et un écart `d`, les ★ visent `x + d` et les autres `x` :

```
x = (objectif x coef_total - points_deja_acquis - d x coef_etoiles) / coef_des_epreuves_restantes
```

- si `x + d` dépasse 20, les ★ sont bloquées à 20 et le reste est reporté sur les autres ;
- si `x` est négatif, les autres passent à 0 et on calcule ce qu'il faut sur les ★ seules ;
- sans ★, ou avec un écart de 0, on retombe exactement sur le calcul à note commune.

## Nouveautés (septembre 2026)

- Curseur de note 0 à 20 dans chaque ligne, note bornée entre 0 et 20.
- Matières ★ à privilégier et écart réglable dans le bloc objectif.
- Objectif recalculé en direct et sauvegardé avec l'écart.
- Numéro de version sur `style.css` et `script.js` (`?v=20260919-1`) pour que le
  cache du serveur ne serve pas l'ancien script avec la nouvelle page.

## Technique

HTML, CSS et JavaScript sans dépendance ni étape de build : les trois fichiers
s'ouvrent directement dans un navigateur.

- Thème clair et sombre via `prefers-color-scheme`, tous les tokens en variables CSS.
- Mise en page en grille asymétrique, panneau de résultat collant à droite sur
  écran large, colonne unique sous 860 px, lignes du tableau transformées en
  cartes sous 560 px.
- Pas de framework : le tableau est reconstruit par une fonction de rendu, ce qui
  suffit largement pour une quinzaine de lignes.
- Polices Syne (titres), Geist (texte) et JetBrains Mono (chiffres et étiquettes, pour que
  les colonnes de notes restent alignées : `font-variant-numeric: tabular-nums`), embarquées
  dans `fonts/` : aucune requête vers un service de polices. Mêmes neutres papier/encre et
  même monogramme que le portfolio, dont le lien de retour part du logo.

## Attention aux coefficients

La grille intégrée correspond à la session 2027 de la voie générale, sur un total
de 100. Le grand oral y passe à 8 et une épreuve anticipée de mathématiques en
première apparaît à 2. À vérifier auprès de son lycée en cas d'options ou de
parcours particulier.

## Licence

Projet personnel, réutilisable librement.
