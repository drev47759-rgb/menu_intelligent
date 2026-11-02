/**
 * JSON-LD for Restaurant + Menu. Built from the same catalog the UI uses
 * so Google / AEO never sees a different price than the guest.
 */
import type {
  DayOfWeek,
  ItemAvailability,
  Menu,
  MenuItem,
  MenuSection,
  Offer,
  OpeningHoursSpecification,
  RestrictedDiet,
  Restaurant as SchemaRestaurant,
  WithContext,
} from "schema-dts";
import type { Dish, OpeningHours, Restaurant } from "@/types/menu";

const DAY_MAP: Record<string, DayOfWeek> = {
  Lundi: "Monday",
  Mardi: "Tuesday",
  Mercredi: "Wednesday",
  Jeudi: "Thursday",
  Vendredi: "Friday",
  Samedi: "Saturday",
  Dimanche: "Sunday",
};

function offer(price: number, availability: Dish["availability"]): Offer {
  const schemaAvailability: ItemAvailability =
    availability === "unavailable"
      ? "https://schema.org/OutOfStock"
      : availability === "seasonal"
        ? "https://schema.org/LimitedAvailability"
        : "https://schema.org/InStock";
  return {
    "@type": "Offer",
    price: price.toFixed(2),
    priceCurrency: "EUR",
    availability: schemaAvailability,
  };
}

function dietUrls(dish: Dish): RestrictedDiet[] {
  const urls: RestrictedDiet[] = [];
  if (dish.dietaryTags.includes("vegan")) {
    urls.push("https://schema.org/VeganDiet");
  } else if (dish.dietaryTags.includes("vegetarian")) {
    urls.push("https://schema.org/VegetarianDiet");
  }
  if (dish.dietaryTags.includes("gluten-free")) {
    urls.push("https://schema.org/GlutenFreeDiet");
  }
  if (dish.dietaryTags.includes("halal")) {
    urls.push("https://schema.org/HalalDiet");
  }
  return urls;
}

function toMenuItem(dish: Dish): MenuItem {
  const diets = dietUrls(dish);
  return {
    "@type": "MenuItem",
    name: dish.portion ? `${dish.name} (${dish.portion})` : dish.name,
    description: dish.description || undefined,
    suitableForDiet: diets.length === 1 ? diets[0] : diets.length ? diets : undefined,
    offers: offer(dish.price, dish.availability),
  };
}

function openingHoursSpec(hours: OpeningHours[]): OpeningHoursSpecification[] {
  const specs: OpeningHoursSpecification[] = [];
  for (const h of hours) {
    if (h.open === "Fermé") continue;
    const day = DAY_MAP[h.day];
    if (!day) continue;
    specs.push({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: day,
      opens: h.open,
      closes: h.close === "00:00" ? "23:59" : h.close,
    });
  }
  return specs;
}

export function buildRestaurantJsonLd(
  restaurant: Restaurant,
  dishes: Dish[],
): WithContext<SchemaRestaurant> {
  const sections = new Map<string, Dish[]>();
  for (const dish of dishes) {
    const key = dish.menuGroup
      ? `${dish.menuGroup} · ${dish.category}`
      : dish.category;
    const list = sections.get(key) ?? [];
    list.push(dish);
    sections.set(key, list);
  }

  const hasMenuSection: MenuSection[] = [...sections.entries()].map(
    ([name, items]) => ({
      "@type": "MenuSection",
      name,
      hasMenuItem: items.map(toMenuItem),
    }),
  );

  const menu: Menu = {
    "@type": "Menu",
    name: `Carte — ${restaurant.name}`,
    hasMenuSection,
  };

  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: restaurant.name,
    description: restaurant.description,
    image: restaurant.image,
    telephone: restaurant.phone,
    url: restaurant.website,
    servesCuisine: restaurant.cuisineType,
    priceRange: restaurant.priceHint,
    acceptsReservations: Boolean(restaurant.reservationUrl),
    address: {
      "@type": "PostalAddress",
      streetAddress: restaurant.address,
      addressLocality: restaurant.city,
      addressCountry: "FR",
    },
    openingHoursSpecification: openingHoursSpec(restaurant.hours),
    hasMenu: menu,
  };
}

export function jsonLdScript(data: WithContext<SchemaRestaurant>): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
