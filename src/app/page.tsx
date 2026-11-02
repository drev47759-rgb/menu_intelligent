import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Search,
  SlidersHorizontal,
  UtensilsCrossed,
} from "lucide-react";
import { restaurants } from "@/data/restaurants";

export const metadata: Metadata = {
  title: "Menu Intelligent — Décidez avant d’y aller",
  description:
    "Cartes interactives : recherche, régimes, budget et total estimé. Train Bleu, Brasserie Bordelaise, Histoire Ancienne.",
};

export default function Home() {
  return (
    <div className="min-h-screen bg-cream text-ink">
      <a href="#restaurants" className="skip-link">
        Aller aux restaurants
      </a>
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
          <p className="font-display text-2xl">Menu Intelligent</p>
          <p className="hidden text-sm text-ink-muted sm:block">
            Avant la visite, pas après l’addition
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">
          Restauration
        </p>
        <h1 className="mt-3 max-w-3xl font-display text-5xl leading-[1.05] text-balance sm:text-6xl">
          La carte, comme un outil de décision.
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-normal text-ink-muted">
          Est-ce que ça me plaît, est-ce que ça passe mes contraintes, combien
          je vais payer — et que faire maintenant.
        </p>
      </section>

      <section className="border-y border-line bg-paper">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3 sm:px-6">
          <Step
            icon={<Search className="size-5" aria-hidden />}
            title="Chercher"
            text="Nom, description, ingrédients — résultats instantanés."
          />
          <Step
            icon={<SlidersHorizontal className="size-5" aria-hidden />}
            title="Filtrer"
            text="Régime, budget, piquant, disponibilité. Combinables."
          />
          <Step
            icon={<UtensilsCrossed className="size-5" aria-hidden />}
            title="Estimer"
            text="Entrée + plat + dessert. Puis réserver, appeler, y aller."
          />
        </div>
      </section>

      <section id="restaurants" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="font-display text-3xl">Trois maisons</h2>
        <p className="mt-2 max-w-xl text-sm text-ink-muted">
          Données reprises à l’identique des cartes publiées. Prix en euros,
          TTC.
        </p>
        <ul className="mt-8 grid gap-6 lg:grid-cols-3">
          {restaurants.map((r) => (
            <li key={r.slug}>
              <Link
                href={`/solutions/restauration/menu/${r.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl bg-paper shadow-border transition-shadow duration-(--motion-fast) hover:shadow-border-hover"
              >
                <Image
                  src={r.image}
                  alt={r.imageAlt}
                  width={1200}
                  height={800}
                  sizes="(min-width: 1024px) 33vw, 100vw"
                  className="h-48 w-full object-cover"
                />
                <div className="flex flex-1 flex-col p-5">
                  <p className="text-xs font-semibold tracking-wide text-accent uppercase">
                    {r.city}
                  </p>
                  <h3 className="mt-1 font-display text-2xl">{r.name}</h3>
                  <p className="mt-1 text-sm text-ink-muted italic">{r.tagline}</p>
                  <p className="mt-3 flex-1 text-sm text-ink-soft">{r.priceHint}</p>
                  <p className="mt-4 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-ink">
                    Voir le menu
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <footer className="border-t border-line py-8 text-center text-xs text-ink-subtle">
        Menu Intelligent — interface de décision avant visite. L’abus d’alcool
        est dangereux pour la santé.
      </footer>
    </div>
  );
}

function Step({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div>
      <div className="mb-3 grid size-10 place-items-center rounded-full bg-cream text-ink">
        {icon}
      </div>
      <h2 className="font-display text-xl">{title}</h2>
      <p className="mt-1 text-sm leading-normal text-ink-muted">{text}</p>
    </div>
  );
}
