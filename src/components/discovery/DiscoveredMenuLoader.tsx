"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ExternalLink, FileText } from "lucide-react";
import { RestaurantMenu } from "@/components/menu/RestaurantMenu";
import {
  getEntries,
  getServerEntries,
  subscribe,
  type DiscoveredEntry,
} from "@/lib/discovered-store";

const PLATFORM_LABELS: Record<string, string> = {
  "uber-eats": "Uber Eats",
  deliveroo: "Deliveroo",
  tripadvisor: "TripAdvisor",
};

/**
 * Page menu d'un restaurant découvert par tirage : la fiche vit dans le
 * localStorage du navigateur, pas dans le jeu de données statique. Le
 * rendu reprend RestaurantMenu tel quel — mêmes filtres, même
 * calculateur de repas, mêmes actions que les maisons préchargées.
 */
export function DiscoveredMenuLoader({ slug }: { slug: string }) {
  const entries = useSyncExternalStore(subscribe, getEntries, getServerEntries);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const first = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(first);
  }, []);

  if (!mounted) {
    return (
      <div className="grid min-h-screen place-items-center bg-cream text-ink-muted">
        <p className="text-sm">Chargement du menu…</p>
      </div>
    );
  }

  const entry = entries.find((e) => e.restaurant.slug === slug);
  if (!entry) {
    return (
      <div className="grid min-h-screen place-items-center bg-cream px-4 text-ink">
        <div className="max-w-md text-center">
          <p className="font-display text-3xl">Menu introuvable</p>
          <p className="mt-3 text-sm leading-normal text-ink-muted">
            Ce restaurant n'est pas dans la liste de cet appareil. Les
            restaurants découverts par le bouton « J'ai de la chance » sont
            enregistrés localement — relancez un tirage depuis la page
            d'accueil.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex min-h-11 items-center rounded-full bg-ink px-5 text-sm font-semibold text-cream"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <MenuFormatNotice entry={entry} />
      <RestaurantMenu restaurant={entry.restaurant} dishes={entry.dishes} />
    </>
  );
}

/**
 * Un restaurant dont la carte n'a pas pu être extraite (menu PDF
 * uniquement, site sans prix) : on explique pourquoi les filtres ne
 * s'appliquent pas et on renvoie vers les PDF et les plateformes.
 */
function MenuFormatNotice({ entry }: { entry: DiscoveredEntry }) {
  if (entry.dishes.length > 0) return null;
  return (
    <div className="border-b border-line bg-paper">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-4 sm:px-6">
        <p className="min-w-0 flex-1 text-sm leading-normal text-ink-soft">
          Ce restaurant n'a pas de carte en ligne structurée — son menu est
          disponible en PDF ou sur les plateformes ci-dessous. Recherche,
          filtres et estimation ne s'appliquent pas.
        </p>
        {entry.menusPdf.map((pdf) => (
          <a
            key={pdf}
            href={pdf}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-seasonal px-3 py-1.5 text-sm font-medium text-cream hover:opacity-90"
          >
            <FileText className="size-4" aria-hidden />
            Menu PDF
            <ExternalLink className="size-3" aria-hidden />
          </a>
        ))}
        {entry.plateformes.map((p) => (
          <a
            key={p.plateforme}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-cream px-3 py-1.5 text-sm font-medium text-ink shadow-border hover:opacity-80"
          >
            {PLATFORM_LABELS[p.plateforme] ?? p.plateforme}
            <ExternalLink className="size-3 text-ink-subtle" aria-hidden />
          </a>
        ))}
      </div>
    </div>
  );
}
