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

**Résultat** : `gurtlerhoft.json` — 57 plats au format Dish, prix strictement
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

## Bouton « J'ai de la chance » (interface)

La page d'accueil embarque un bouton **J'ai de la chance**
(`src/components/discovery/LuckyDiscovery.tsx`), branché sur la route
`/api/discovery` (`src/lib/discovery/`).

- Tirage aléatoire côté serveur via l'API Recherche d'entreprises :
  **SIRET du siège en activité uniquement** (état administratif « A »
  requis pour l'unité légale ET l'établissement — un SIRET fermé est exclu).
- Recherche des informations du restaurant sur le **site officiel**,
  **Uber Eats**, **Deliveroo** et **TripAdvisor** (page directe du
  restaurant si trouvable, sinon recherche préremplie, signalée).
- Vérification d'officialité : SIRET, sinon SIREN, sinon adresse étendue
  du SIRET — dans la page Mentions légales ou le footer. Le badge affiché
  distingue un site vérifié d'un site non vérifié.
- **Menu PDF uniquement** : un restaurant dont le menu n'existe qu'au
  format PDF est signalé par une **icône distinctive** — badge ambre
  « Menu PDF uniquement » (icône document) + liens directs vers les PDF.

### Intégration à la liste des restaurants

Chaque restaurant découvert **rejoint la liste complète** (page d'accueil et
page Menus) et dispose de sa propre page menu
`/solutions/restauration/menu/{slug}` — avec les mêmes actions que les
trois maisons préchargées : recherche, filtres, calculateur de repas,
itinéraire, réservation.

- Le catalogue (fiche `Restaurant` + plats `Dish`) est construit côté
  serveur : plats extraits des pages carte HTML du site officiel
  (heuristique « nom … prix € », rubriques reconnues, régimes/piquant
  déduits du libellé — `src/lib/discovery/menu-extract.ts`,
  `src/lib/discovery/mapping.ts`).
- Les restaurants découverts sont persistés dans le `localStorage` du
  navigateur (`src/lib/discovered-store.ts`, 20 max) — pas de compte ni
  de base. La route `/api/discovery` reçoit les SIRET déjà
  enregistrés (paramètre `exclude`) pour ne jamais retomber sur un
  restaurant déjà listé : chaque clic ajoute un nouveau restaurant.
- Un restaurant sans image officielle exploitable affiche une vignette
  générique ; sans téléphone connu, le bouton « Appeler » disparaît au
  profit du site officiel et de l'itinéraire ; sans horaires connus, la
  section Horaires l'indique.
- Un restaurant dont le menu n'est que PDF n'a pas de plat structuré : sa
  page menu affiche les liens PDF et les plateformes (Uber Eats,
  Deliveroo, TripAdvisor) à la place des filtres.
- Thème dédié `decouverte` (accent ambre) pour distinguer les
  restaurants découverts des maisons préchargées ; badge
  « Découverte » sur les cartes, bouton « Retirer » disponible.
