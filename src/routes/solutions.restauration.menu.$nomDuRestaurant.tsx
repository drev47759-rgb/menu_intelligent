import { createFileRoute, notFound } from "@tanstack/react-router";
import { JsonLd } from "@/components/menu/JsonLd";
import { RestaurantMenu } from "@/components/menu/RestaurantMenu";
import { getCatalog } from "@/data/catalogs";
import { restaurantSlugs } from "@/data/restaurants";

export const Route = createFileRoute(
  "/solutions/restauration/menu/$nomDuRestaurant",
)({
  loader: ({ params }) => {
    const catalog = getCatalog(params.nomDuRestaurant);
    if (!catalog) throw notFound();
    return catalog;
  },
  head: ({ loaderData }) => {
    const r = loaderData?.restaurant;
    if (!r) return { meta: [{ title: "Menu introuvable" }] };
    return {
      meta: [
        { title: `Menu Intelligent — ${r.name}` },
        { name: "description", content: r.description },
      ],
    };
  },
  component: MenuPage,
  notFoundComponent: MenuNotFound,
});

function MenuPage() {
  const { restaurant, dishes } = Route.useLoaderData();
  return (
    <>
      <JsonLd restaurant={restaurant} dishes={dishes} />
      <RestaurantMenu restaurant={restaurant} dishes={dishes} />
    </>
  );
}

function MenuNotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 px-6 text-center text-ink">
      <h1 className="font-display text-3xl">Restaurant introuvable</h1>
      <p className="text-sm text-ink-muted">
        Ce menu n’est pas dans le catalogue. Maisons disponibles :{" "}
        {restaurantSlugs.join(", ")}.
      </p>
      <a href="/" className="min-h-11 rounded-full bg-ink px-5 text-sm font-semibold leading-11 text-cream">
        Retour
      </a>
    </main>
  );
}
