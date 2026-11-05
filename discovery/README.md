# Découverte aléatoire de restaurant (outils gratuits data.gouv)

Branche de test : `feat/decouverte-aleatoire-datagouv`.

## Pipeline

```
API Recherche d'entreprises (Sirene / data.gouv)   [gratuit, sans auth]
        │  tirage aléatoire : mot-clé + page aléatoire (NAF 56.10A, actifs)
        │  ou commune ciblée (API Geo → code_commune)
        ▼
SIRET du siège + adresse étendue
        ▼
Recherche du site web officiel (DuckDuckGo HTML)     [gratuit, sans clé]
        ▼
Vérification d'officialité : SIRET / SIREN / adresse étendue
trouvé dans la page Mentions légales ou le footer du site
        ▼
Peuplement automatique des plats : pages carte HTML → sinon parsing
direct des menus PDF (FlateDecode + opérateurs texte, sans dépendance)
        ▼
Catalogue complet : fiche Restaurant + plats Dish
au format des maisons préchargées (src/types/menu.ts)
```

Script de référence : `scripts/discover-restaurant.py` (stdlib uniquement ;
`pypdf` optionnel pour l'étape PDF).

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

### Ciblage par ville

Un **champ texte « Ville »** accompagne le bouton : la saisie libre est
résolue en commune réelle via l'**API Geo** (geo.api.gouv.fr, gratuite),
puis le tirage filtre sur `code_commune` (codes postaux en repli) tout en
restant aléatoire dans tout le bassin de la commune (page tirée au
hasard). Champ vide = tirage dans toute la France.

- Ville inconnue → erreur 400 explicite « Ville introuvable ».
- Tous les restaurants actifs de la ville déjà enregistrés → 409 « déjà
  dans votre liste ».
- Paramètre : `/api/discovery?ville=Strasbourg&exclude=…`.

### Peuplement automatique des menus (y compris PDF)

Les données du menu sont **toujours peuplées automatiquement** —
l'utilisateur n'a jamais à chercher quoi que ce soit à la main :

1. les plats sont extraits de **chaque page visitée** du site officiel
   (une carte tient parfois dans l'accueil) ;
2. si rien n'a été extrait et que des menus PDF existent, les plats sont
   extraits **directement dans les PDF** côté serveur
   (`src/lib/discovery/pdf-menu.ts`) : décompression des flux
   FlateDecode via `node:zlib`, lecture des opérateurs texte
   Tj/TJ, recollage des fragments « nom » + « prix », puis la même
   heuristique « nom … prix € » que pour le HTML. **Aucune dépendance
   ajoutée.**
3. best-effort documenté : un PDF exotique (polices CID, texte en image)
   produit zéro plat et retombe sur les liens PDF — jamais d'action
   manuelle exigée, simplement moins de filtres disponibles.

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
- Un restaurant dont le menu n'est que PDF garde son badge distinctif ;
  ses plats, extraits du PDF, rendent la page menu filtrable comme les
  autres. Si aucun plat n'a pu être extrait, la page affiche les liens
  PDF et les plateformes avec un bandeau explicatif.
- Thème dédié `decouverte` (accent ambre) pour distinguer les
  restaurants découverts des maisons préchargées ; badge
  « Découverte » sur les cartes, bouton « Retirer » disponible.
