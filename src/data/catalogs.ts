import type { Dish, RestaurantCatalog } from "@/types/menu";
import { getRestaurant } from "@/data/restaurants";
import trainBleuDishes from "./le-train-bleu.json";
import bordelaiseDishes from "./brasserie-bordelaise.json";
import histoireDishes from "./histoire-ancienne.json";

const dishesBySlug: Record<string, Dish[]> = {
  "le-train-bleu": trainBleuDishes as Dish[],
  "brasserie-bordelaise": bordelaiseDishes as Dish[],
  "histoire-ancienne": histoireDishes as Dish[],
};

export function getCatalog(slug: string): RestaurantCatalog | undefined {
  const restaurant = getRestaurant(slug);
  const dishes = dishesBySlug[slug];
  if (!restaurant || !dishes) return undefined;
  return { restaurant, dishes };
}
