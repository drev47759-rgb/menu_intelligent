import Link from "next/link";
import { restaurantSlugs } from "@/data/restaurants";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 px-6 text-center text-ink">
      <p className="text-xs font-semibold tracking-[0.16em] text-accent uppercase">
        404
      </p>
      <h1 className="font-display text-3xl">Restaurant introuvable</h1>
      <p className="text-sm text-ink-muted">
        Ce menu n’est pas dans le catalogue. Maisons disponibles :{" "}
        {restaurantSlugs.join(", ")}.
      </p>
      <Link
        href="/"
        className="min-h-11 rounded-full bg-ink px-5 text-sm font-semibold leading-11 text-cream hover:bg-accent-hover"
      >
        Retour
      </Link>
    </main>
  );
}
