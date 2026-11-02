import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { restaurants } from "@/data/restaurants";

export const metadata: Metadata = {
  title: "Menus — Restauration",
  description:
    "Cartes interactives : Le Train Bleu, Brasserie Bordelaise, Histoire Ancienne.",
};

export default function MenuIndex() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-12 sm:px-6">
      <p className="text-xs font-semibold tracking-[0.16em] text-accent uppercase">
        Restauration
      </p>
      <h1 className="mt-2 font-display text-4xl text-ink">Menus intelligents</h1>
      <p className="mt-2 max-w-xl text-sm text-ink-muted">
        Choisissez une maison, filtrez selon vos contraintes, estimez l'addition.
      </p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-3">
        {restaurants.map((r) => (
          <li key={r.slug}>
            <Link
              href={`/solutions/restauration/menu/${r.slug}`}
              className="flex h-full flex-col rounded-xl bg-paper p-5 shadow-border hover:shadow-border-hover"
            >
              <p className="text-xs font-semibold text-accent uppercase">
                {r.city}
              </p>
              <h2 className="mt-1 font-display text-2xl">{r.name}</h2>
              <p className="mt-1 flex-1 text-sm text-ink-muted">{r.tagline}</p>
              <p className="mt-4 inline-flex items-center gap-1 text-sm font-semibold">
                Voir le menu <ArrowRight className="size-4" aria-hidden />
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
