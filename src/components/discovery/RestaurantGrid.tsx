"use client";

import { useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Dices, FileText, UtensilsCrossed, X } from "lucide-react";
import { restaurants } from "@/data/restaurants";
import {
  getEntries,
  getServerEntries,
  removeEntry,
  subscribe,
  type DiscoveredEntry,
} from "@/lib/discovered-store";
import type { Restaurant } from "@/types/menu";

/**
 * Liste complète des restaurants : les trois maisons préchargées, puis les
 * restaurants découverts par le bouton « J'ai de la chance » (persistés
 * dans le navigateur). Un clic de plus = un restaurant de plus dans la
 * liste, avec les mêmes actions.
 */
export function RestaurantGrid({
  variant = "featured",
}: {
  variant?: "featured" | "compact";
}) {
  const entries = useSyncExternalStore(subscribe, getEntries, getServerEntries);
  const discovered = entries.map((entry) => ({
    restaurant: entry.restaurant,
    entry,
  }));
  const listClass =
    variant === "featured"
      ? "mt-8 grid gap-6 lg:grid-cols-3"
      : "mt-8 grid gap-4 sm:grid-cols-3";

  return (
    <ul className={listClass}>
      {restaurants.map((restaurant) => (
        <li key={restaurant.slug}>
          {variant === "featured" ? (
            <FeaturedCard restaurant={restaurant} />
          ) : (
            <CompactCard restaurant={restaurant} />
          )}
        </li>
      ))}
      {discovered.map(({ restaurant, entry }) => (
        <li key={restaurant.slug}>
          {variant === "featured" ? (
            <FeaturedCard restaurant={restaurant} entry={entry} />
          ) : (
            <CompactCard restaurant={restaurant} entry={entry} />
          )}
        </li>
      ))}
    </ul>
  );
}

function FeaturedCard({
  restaurant,
  entry,
}: {
  restaurant: Restaurant;
  entry?: DiscoveredEntry;
}) {
  return (
    <div className="relative">
      <Link
        href={"/solutions/restauration/menu/" + restaurant.slug}
        className="group flex h-full flex-col overflow-hidden rounded-2xl bg-paper shadow-border transition-shadow duration-(--motion-fast) hover:shadow-border-hover"
      >
        {restaurant.image ? (
          <Image
            src={restaurant.image}
            alt={restaurant.imageAlt}
            width={1200}
            height={800}
            sizes="(min-width: 1024px) 33vw, 100vw"
            className="h-48 w-full object-cover"
          />
        ) : (
          <div className="grid h-48 w-full place-items-center bg-ink text-cream">
            <UtensilsCrossed className="size-10 opacity-60" aria-hidden />
          </div>
        )}
        <div className="flex flex-1 flex-col p-5">
          <p className="text-xs font-semibold tracking-wide text-accent uppercase">
            {restaurant.city}
          </p>
          <h3 className="mt-1 font-display text-2xl">{restaurant.name}</h3>
          <p className="mt-1 text-sm text-ink-muted italic">{restaurant.tagline}</p>
          <p className="mt-3 flex-1 text-sm text-ink-soft">{restaurant.priceHint}</p>
          <p className="mt-4 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-ink">
            Voir le menu
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </p>
        </div>
      </Link>
      {entry ? <DiscoveredBadges entry={entry} floating /> : null}
    </div>
  );
}

function CompactCard({
  restaurant,
  entry,
}: {
  restaurant: Restaurant;
  entry?: DiscoveredEntry;
}) {
  return (
    <div className="relative">
      <Link
        href={"/solutions/restauration/menu/" + restaurant.slug}
        className="flex h-full flex-col rounded-xl bg-paper p-5 shadow-border hover:shadow-border-hover"
      >
        <p className="text-xs font-semibold text-accent uppercase">
          {restaurant.city}
        </p>
        <h2 className="mt-1 font-display text-2xl">{restaurant.name}</h2>
        <p className="mt-1 flex-1 text-sm text-ink-muted">{restaurant.tagline}</p>
        {entry ? (
          <p className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-cream px-2 py-0.5 text-xs font-semibold text-ink shadow-border">
              <Dices className="size-3" aria-hidden />
              Découverte
            </span>
            {entry.menuFormat === "pdf" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-seasonal px-2 py-0.5 text-xs font-semibold text-cream">
                <FileText className="size-3" aria-hidden />
                Menu PDF uniquement
              </span>
            ) : null}
          </p>
        ) : null}
        <p className="mt-4 inline-flex items-center gap-1 text-sm font-semibold">
          Voir le menu <ArrowRight className="size-4" aria-hidden />
        </p>
      </Link>
      {entry ? <DiscoveredBadges entry={entry} /> : null}
    </div>
  );
}

/** Badges « Découverte » / « PDF » + bouton retirer, flottants en variante featured. */
function DiscoveredBadges({
  entry,
  floating = false,
}: {
  entry: DiscoveredEntry;
  floating?: boolean;
}) {
  const name = entry.restaurant.name;
  return (
    <div
      className={
        floating
          ? "absolute top-3 left-3 flex items-center gap-1.5"
          : "absolute top-3 right-3"
      }
    >
      {floating ? (
        <>
          <span className="inline-flex items-center gap-1 rounded-full bg-cream/95 px-2.5 py-1 text-xs font-semibold text-ink shadow-border">
            <Dices className="size-3" aria-hidden />
            Découverte
          </span>
          {entry.menuFormat === "pdf" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-seasonal px-2.5 py-1 text-xs font-semibold text-cream">
              <FileText className="size-3" aria-hidden />
              PDF
            </span>
          ) : null}
        </>
      ) : null}
      <button
        type="button"
        onClick={() => removeEntry(entry.siret)}
        aria-label={"Retirer " + name + " de la liste"}
        title="Retirer de la liste"
        className="inline-flex size-7 items-center justify-center rounded-full bg-cream text-ink-muted shadow-border transition-colors duration-(--motion-fast) hover:text-danger"
      >
        <X className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}
