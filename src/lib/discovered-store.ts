"use client";

import type { Dish, Restaurant } from "@/types/menu";
import type {
  MenuFormat,
  PlatformLink,
  VerificationInfo,
} from "@/types/discovery";

/**
 * Restaurants découverts par le bouton « J'ai de la chance », persistés
 * dans le navigateur (localStorage) : pas de compte, pas de base — la
 * liste de l'utilisateur voyage avec son appareil.
 */

export interface DiscoveredEntry {
  siret: string;
  savedAt: string;
  restaurant: Restaurant;
  dishes: Dish[];
  menuFormat: MenuFormat;
  menusPdf: string[];
  plateformes: PlatformLink[];
  verification: VerificationInfo;
  siteOfficiel: string | null;
  source: string;
}

const STORAGE_KEY = "menu-intelligent:restaurants-decouverts";
const MAX_ENTRIES = 20;

const EMPTY: DiscoveredEntry[] = [];
let cache: DiscoveredEntry[] | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

function load(): DiscoveredEntry[] {
  if (cache !== null) return cache;
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    cache = Array.isArray(parsed) ? (parsed as DiscoveredEntry[]) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function persist(next: DiscoveredEntry[]): void {
  cache = next.slice(0, MAX_ENTRIES);
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // Quota dépassé : la liste reste en mémoire pour cette session.
  }
  emit();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Photo client du store — référence stable pour useSyncExternalStore. */
export function getEntries(): DiscoveredEntry[] {
  return load();
}

export function getServerEntries(): DiscoveredEntry[] {
  return EMPTY;
}

export function getSirets(): string[] {
  return load().map((entry) => entry.siret);
}

export function findEntryBySlug(slug: string): DiscoveredEntry | undefined {
  return load().find((entry) => entry.restaurant.slug === slug);
}

/** Ajoute un restaurant ; false s'il est déjà dans la liste. */
export function saveEntry(entry: DiscoveredEntry): boolean {
  const current = load();
  if (current.some((e) => e.siret === entry.siret)) return false;
  persist([entry, ...current]);
  return true;
}

export function removeEntry(siret: string): void {
  persist(load().filter((entry) => entry.siret !== siret));
}
