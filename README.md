# Menu Intelligent

MVP d’interface de décision avant visite, pour **Le Train Bleu**, **Brasserie Bordelaise** et **Histoire Ancienne**.

Les cartes HTML jointes sont la source de vérité : noms, descriptions et prix sont extraits tels quels. Régimes, allergènes, piquant et disponibilité sont inférés de façon conservative (jamais de certification inventée).

## Route

```
/solutions/restauration/menu/{nomDuRestaurant}
```

Slugs :

| Slug | Maison |
| --- | --- |
| `le-train-bleu` | Le Train Bleu, Gare de Lyon |
| `brasserie-bordelaise` | Brasserie Bordelaise, Bordeaux |
| `histoire-ancienne` | Histoire Ancienne, Calais |

La page d’accueil liste les trois maisons et pointe vers cette route.

## Intégration dans un projet Next.js `lbe`

Ce bac d’essai tourne en TanStack Start (contrainte de la plateforme). Dans `lbe` (Next.js 16 App Router), reprenez les mêmes fichiers ainsi :

```
app/solutions/restauration/menu/[nomDuRestaurant]/page.tsx
```

1. Copier `src/types/menu.ts`, `src/data/*`, `src/lib/{analytics,cn,format,jsonld,menu-query}.ts`, `src/components/menu/*`.
2. Dans la page Next, remplacer `createFileRoute` par :

```tsx
import { notFound } from "next/navigation";
import { getCatalog } from "@/data/catalogs";
import { RestaurantMenu } from "@/components/menu/RestaurantMenu";
import { JsonLd } from "@/components/menu/JsonLd";

export function generateStaticParams() {
  return [
    { nomDuRestaurant: "le-train-bleu" },
    { nomDuRestaurant: "brasserie-bordelaise" },
    { nomDuRestaurant: "histoire-ancienne" },
  ];
}

export default async function Page({
  params,
}: {
  params: Promise<{ nomDuRestaurant: string }>;
}) {
  const { nomDuRestaurant } = await params;
  const catalog = getCatalog(nomDuRestaurant);
  if (!catalog) notFound();
  return (
    <>
      <JsonLd {...catalog} />
      <RestaurantMenu {...catalog} />
    </>
  );
}
```

3. Remplacer `Link` de TanStack par `next/link` (même `href` `/solutions/restauration/menu/${slug}`).
4. Dépendances déjà prévues dans `lbe` : `schema-dts`, `lucide-react`, `clsx`, `tailwind-merge`.
5. Régénérer les JSON si les HTML source changent :

```
python3 scripts/extract-menus.py
```

## Fonctionnalités

- Recherche instantanée (nom, description, ingrédients)
- Filtres combinables : régime, budget, piquant, disponibilité, catégorie
- Badges de disponibilité et allergènes UE
- Calculateur entrée + plat + dessert
- CTA : Réserver, Commander, Appeler, Itinéraire
- JSON-LD Schema.org `Restaurant` + `Menu` + `MenuSection` + `MenuItem` + `Offer`
- Analytics : `page_view`, `search`, `filter_used`, `dish_view`, `click_reserve`, `click_order`, `click_call`, `click_directions` via `window.dataLayer`

## Accessibilité

HTML sémantique, skip-link, `aria-live` sur le compteur, `aria-pressed` sur les puces, dialog natif, contrastes AA, cibles ≥ 44px, `prefers-reduced-motion`.
