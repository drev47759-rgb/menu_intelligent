# Découverte aléatoire de restaurant (outils gratuits data.gouv)

Branche de test : `feat/decouverte-aleatoire-datagouv`.

## Pipeline

```
API Recherche d'entreprises (Sirene / data.gouv)   [gratuit, sans auth]
        │  tirage aléatoire : mot-clé + page aléatoire (NAF 56.10A, actifs)
        ▼
SIRET du siège + adresse étendue
        ▼
Recherche du site web officiel (DuckDuckGo HTML)     [gratuit, sans clé]
        ▼
Vérification d'officialité : SIRET / SIREN / adresse étendue
trouvé dans la page Mentions légales ou le footer du site
        ▼
Recherche des menus PDF rattachés au restaurant (pages carte/menu, liens .pdf)
        ▼
Peuplement : téléchargement des PDF → texte (pypdf) → catalogue JSON
au format Dish (src/types/menu.ts)
```

Script : `scripts/discover-restaurant.py` (stdlib uniquement ; `pypdf` optionnel pour l'étape PDF).

## Test réel du 5 novembre 2026

Dossier `2026-11-05-gurtlerhoft/` : exécution complète du pipeline en conditions réelles.

**Tirage aléatoire** (page 63, `q=restaurant`, `activite_principale=56.10A`) :
SARL RESTAURANT ET CAVEAU DE LA CATHEDRALE (SIREN 922 756 051, siège SIRET 92275605100012,
29 rue des Grandes Arcades, 67000 Strasbourg) — enseigne **Caveau du Gurtlerhoft**.

**Site officiel trouvé** : `https://www.gurtlerhoft.fr/` (via recherche web enseigne + ville).

**Vérification (mentions légales)** — preuve exacte :
« Numéro de Siret : 92275605100012 », éditeur Restaurant Gurtlerhoft, RCS de Strasbourg.
Le SIRET affiché correspond exactement au SIRET du siège tiré au sort dans la base Sirene.

**Menus PDF** : la page La Carte propose « Téléchargez la carte du restaurant
Gurtlerhoft en cliquant ici » (lien PDF dans le HTML brut). L'environnement de test
ne pouvant télécharger de binaire, le peuplement de cette exécution utilise le
fallback documenté (`--html-fallback`) : texte des pages carte du site officiel
vérifié — contenu identique à la carte téléchargeable. Le téléchargement et le
parsing du PDF sont implémentés dans le script (pypdf) pour une exécution locale.

**Résultat** : `gurtlerhoft.json` — 58 plats au format Dish, prix strictement
recopiés depuis la carte du site officiel.

## Constats de terrain (utiles pour la mise en production)

- Sur ~30 restaurants tirés au hasard : la majorité n'a pas de site officiel
  (annuaires uniquement) ; certains sites bloquent les accès automatisés ou sont
  derrière un mur de cookies. Le pipeline doit donc itérer les candidats.
- La vérification par **SIRET exact** dans les mentions légales est forte quand
  elle existe (cas Gurtlerhoft) ; sinon l'**adresse étendue** du SIRET fait une
  preuve acceptable (cas Bistrot Brick House, Chambéry : adresse du siège exacte
  dans les mentions légales).
- Les menus PDF sont plus rares que les cartes HTML ; le fallback HTML est
  indispensable pour peupler des données réelles.
