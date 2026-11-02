import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
    return { title: "Menu introuvable" };
  }
  return {
    title: `Menu Intelligent — ${catalog.restaurant.name}`,
    description: catalog.restaurant.description,
  };
}

export default async function MenuPage({ params }: PageProps) {
  const { nomDuRestaurant } = await params;
  const catalog = getCatalog(nomDuRestaurant);
  if (!catalog) notFound();
  const { restaurant, dishes } = catalog;
  return (
    <>
      <JsonLd restaurant={restaurant} dishes={dishes} />
      <RestaurantMenu restaurant={restaurant} dishes={dishes} />
    </>
  );
}
