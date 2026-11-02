import { buildRestaurantJsonLd, jsonLdScript } from "@/lib/jsonld";
import type { Dish, Restaurant } from "@/types/menu";

/** Server-safe JSON-LD node — crawlers see Menu / MenuItem / Offer. */
export function JsonLd({
  restaurant,
  dishes,
}: {
  restaurant: Restaurant;
  dishes: Dish[];
}) {
  const json = jsonLdScript(buildRestaurantJsonLd(restaurant, dishes));
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
