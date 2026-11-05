import type {
  Course,
  Dish,
  Restaurant,
  RestaurantCatalog,
} from "@/types/menu";
import type { DiscoveredRestaurant, VerificationInfo } from "@/types/discovery";
import type { MenuExploration } from "./site";

function denormalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function slugify(text: string): string {
  const slug = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['\u2019]/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return slug || "restaurant";
}

/** Slug stable et unique par SIREN : nom + 4 derniers chiffres du SIREN. */
export function discoveredSlug(d: DiscoveredRestaurant): string {
  return slugify(d.enseigne ?? d.nomComplet) + "-" + d.siren.slice(-4);
}

function inferCourse(category: string): Course {
  const c = denormalize(category);
  if (/entre/.test(c)) return "starter";
  if (/plat/.test(c)) return "main";
  if (/dessert/.test(c)) return "dessert";
  if (/boisson/.test(c)) return "drink";
  if (/menu|formule|suggestion/.test(c)) return "menu";
  return "other";
}

function inferDietary(name: string): Dish["dietaryTags"] {
  const n = denormalize(name);
  const tags: Dish["dietaryTags"] = [];
  if (/vegetarien|vegetal|sans viande|legume/.test(n)) tags.push("vegetarian");
  if (/vegan|100 ?% ?vegetal/.test(n)) tags.push("vegan");
  if (/sans gluten/.test(n)) tags.push("gluten-free");
  return tags;
}

function inferSpice(name: string): Dish["spiceLevel"] {
  const n = denormalize(name);
  return /epice|piment|piquant/.test(n) ? 2 : 0;
}

/**
 * Construit le catalogue du restaurant découvert : une fiche Restaurant
 * compatible avec celles des maisons préchargées (mêmes pages, mêmes
 * actions) et les plats extraits de la carte du site officiel.
 */
export function buildCatalog(
  d: DiscoveredRestaurant,
  siteOfficiel: string | null,
  verification: VerificationInfo,
  menu: MenuExploration,
): RestaurantCatalog {
  const name = d.enseigne ?? d.nomComplet;
  const slug = discoveredSlug(d);
  const communeLigne = [d.codePostal, d.commune].filter(Boolean).join(" ");
  const address = [d.adresseEtendue, communeLigne].filter(Boolean).join(", ");

  const prices = menu.rawDishes.map((x) => x.price);
  const priceHint =
    prices.length > 0
      ? "Carte " + Math.min(...prices) + "–" + Math.max(...prices) + " €"
      : "Carte non structurée (PDF ou site sans prix)";

  const verifie =
    verification.statut === "verifie" ? "site officiel vérifié" : "site officiel non vérifié";

  const restaurant: Restaurant = {
    slug,
    name,
    address,
    phone: "",
    website: siteOfficiel ?? undefined,
    reservationUrl: siteOfficiel ?? undefined,
    hours: [],
    cuisineType: "Restauration (NAF " + d.naf + ")",
    tagline: d.enseigne
      ? d.nomComplet
      : "Découvert par tirage aléatoire — SIRET en activité",
    description:
      "Restaurant tiré au hasard via les données Sirene de data.gouv (SIRET " +
      d.siret +
      ", en activité), " +
      verifie +
      ". Plats extraits automatiquement de la carte du site officiel — vérifiez les prix auprès du restaurant.",
    image: "",
    imageAlt: "Vignette générique — " + name,
    mapsQuery: name + " " + address,
    city: d.commune,
    priceHint,
    theme: "decouverte",
  };

  const dishes: Dish[] = menu.rawDishes.map((raw, i) => ({
    id: slug + "-" + i,
    name: raw.name,
    description: "",
    price: raw.price,
    category: raw.category,
    ingredients: [],
    allergens: [],
    dietaryTags: inferDietary(raw.name),
    spiceLevel: inferSpice(raw.name),
    availability: "available",
    menuGroup: "À la carte",
    course: inferCourse(raw.category),
  }));

  return { restaurant, dishes };
}
