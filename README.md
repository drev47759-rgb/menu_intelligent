# Menu Intelligent

Interface de décision pour restaurants : cartes interactives avec recherche instantanée, filtres combinables (régime, budget, piquant, disponibilité) et calculateur de repas (entrée + plat + dessert, total estimé).

Trois maisons : **Le Train Bleu** (Paris 12e), **Brasserie Bordelaise** (Bordeaux), **Histoire Ancienne** (Calais).

## Stack

- [Next.js 16](https://nextjs.org) — App Router, Turbopack
- React 19
- TypeScript 6
- Tailwind CSS 4 (via `@tailwindcss/postcss`)
- ESLint 10 (flat config, `eslint-config-next`)
- Prettier 3

## Développement

    npm install
    npm run dev        # http://localhost:3000

Commandes :

- `npm run build` — build de production
- `npm run start` — serveur de production
- `npm run lint` — ESLint
- `npm run typecheck` — vérification TypeScript
- `npm run format` — Prettier

## Structure

- `src/app/` — routes App Router : accueil, `/solutions/restauration/menu`, `/solutions/restauration/menu/[nomDuRestaurant]` (SSG), 404
- `src/components/menu/` — composants UI du menu (client)
- `src/data/` — restaurants et catalogues de plats (JSON)
- `src/lib/` — utilitaires (formatage, filtres, JSON-LD, analytics)
- `src/types/` — types TypeScript du catalogue

## Déploiement Vercel

Zéro configuration : importer le dépôt sur [vercel.com](https://vercel.com), le framework est détecté automatiquement.

Variable d'environnement recommandée en production :

- `NEXT_PUBLIC_SITE_URL` — URL canonique du site (ex. `https://menu-intelligent.vercel.app`), utilisée pour les métadonnées Open Graph.

## Sécurité

- Les correctifs des **RCE critiques Next.js d'octobre 2026** sont inclus (`next ^16.4.3`).
- Une **release de sécurité Next.js est attendue le 3 novembre 2026** : le range `^` absorbera le patch (`npm update next`).
- Dependabot actif : npm (groupé) + GitHub Actions, vérification hebdomadaire.
- CI : `npm audit --omit=dev --audit-level=critical` bloquant à chaque push / PR sur `develop` et `main`.
- En-têtes de sécurité (HSTS, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`) définis dans `next.config.ts`.

## Données

Prix et cartes reprises des sites publics des restaurants. L'abus d'alcool est dangereux pour la santé.
