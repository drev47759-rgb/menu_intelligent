import type { Metadata } from "next";
import { RestaurantGrid } from "@/components/discovery/RestaurantGrid";

export const metadata: Metadata = {
  title: "Menus — Restauration",
  description:
    "Cartes interactives : restaurants préchargés et restaurants découverts par tirage aléatoire (SIRET en activité, data.gouv).",
};

export default function MenuIndex() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-12 sm:px-6">
      <p className="text-xs font-semibold tracking-[0.16em] text-accent uppercase">
        Restauration
      </p>
      <h1 className="mt-2 font-display text-4xl text-ink">Menus intelligents</h1>
      <p className="mt-2 max-w-xl text-sm text-ink-muted">
        Choisissez une maison, filtrez selon vos contraintes, estimez
        l’addition.
      </p>
      <RestaurantGrid variant="compact" />
    </main>
  );
}
