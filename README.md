# Simulateur de moyenne du bac

Outil web qui calcule une moyenne pondérée et répond à la question inverse :
« il me faut combien sur les épreuves qui restent pour avoir la mention ? »

En ligne : http://site-254.studio2.serveur-dedie.fr/simulateur/

## Ce que ça fait

- Tableau de matières éditable : nom, coefficient, note sur 20.
- Case « à venir » pour les épreuves pas encore passées : elles sortent de la moyenne courante mais restent dans le calcul de l'objectif.
- Moyenne pondérée recalculée à chaque frappe, avec la mention correspondante.
- Solveur inverse : à partir d'un objectif, la note moyenne nécessaire sur les épreuves restantes. Les cas impossibles (plus de 20) et déjà acquis (moins de 0) sont traités à part.
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

## Technique

HTML, CSS et JavaScript sans dépendance ni étape de build : les trois fichiers
s'ouvrent directement dans un navigateur.

- Thème clair et sombre via `prefers-color-scheme`, tous les tokens en variables CSS.
- Mise en page en grille asymétrique, panneau de résultat collant à droite sur
  écran large, colonne unique sous 860 px, lignes du tableau transformées en
  cartes sous 560 px.
- Pas de framework : le tableau est reconstruit par une fonction de rendu, ce qui
  suffit largement pour une quinzaine de lignes.
- Polices Geist et JetBrains Mono, cette dernière réservée aux chiffres pour que
  les colonnes de notes restent alignées (`font-variant-numeric: tabular-nums`).

## Attention aux coefficients

La grille intégrée correspond à la session 2027 de la voie générale, sur un total
de 100. Le grand oral y passe à 8 et une épreuve anticipée de mathématiques en
première apparaît à 2. À vérifier auprès de son lycée en cas d'options ou de
parcours particulier.

## Licence

Projet personnel, réutilisable librement.
