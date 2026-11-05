import type { Metadata } from "next";
import { DiscoveredMenuLoader } from "@/components/discovery/DiscoveredMenuLoader";
import { JsonLd } from "@/components/menu/JsonLd";
import { RestaurantMenu } from "@/components/menu/RestaurantMenu";
import { getCatalog } from "@/data/catalogs";
import { restaurantSlugs } from "@/data/restaurants";

type PageProps = {
  params: Promise<{ nomDuRestaurant: string }>;
};

export function generateStaticParams() {
  return restaurantSlugs.map((nomDuRestaurant) => ({ nomDuRestaurant }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { nomDuRestaurant } = await params;
  const catalog = getCatalog(nomDuRestaurant);
  if (!catalog) {
    // Peut être un restaurant découvert par tirage (fiche locale au
    // navigateur) : titre neutre, la page s'affiche côté client.
    return { title: "Menu Intelligent — Restaurant" };
  }
  return {
    title: "Menu Intelligent — " + catalog.restaurant.name,
    description: catalog.restaurant.description,
  };
}

export default async function MenuPage({ params }: PageProps) {
  const { nomDuRestaurant } = await params;
  const catalog = getCatalog(nomDuRestaurant);
  if (!catalog) {
    // Hors catalogue statique : restaurant découvert par le bouton
    // « J'ai de la chance » (persisté dans le navigateur) ou 404 explicite.
    return <DiscoveredMenuLoader slug={nomDuRestaurant} />;
  }
  const { restaurant, dishes } = catalog;
  return (
    <>
      <JsonLd restaurant={restaurant} dishes={dishes} />
      <RestaurantMenu restaurant={restaurant} dishes={dishes} />
    </>
  );
}
