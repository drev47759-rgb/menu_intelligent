import { isLunchTime } from "@/lib/format";
import type {
  Availability,
  Dish,
  MenuFiltersState,
  SpiceLevel,
} from "@/types/menu";

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export function categorySlug(name: string): string {
  const slug = normalize(name)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "categorie";
}

function matchesQuery(dish: Dish, query: string): boolean {
  if (!query.trim()) return true;
  const hay = normalize(
    [
      dish.name,
      dish.description,
      dish.category,
      dish.menuGroup ?? "",
      dish.portion ?? "",
      ...(dish.ingredients ?? []),
      ...dish.allergens,
    ].join(" "),
  );
  return query
    .split(/\s+/)
    .filter(Boolean)
    .map(normalize)
    .every((token) => hay.includes(token));
}

function availabilityMatches(
  dish: Dish,
  selected: MenuFiltersState["availability"],
): boolean {
  if (selected.length === 0) return true;
  return selected.some((flag) => {
    if (flag === "seasonal") return dish.availability === "seasonal";
    if (flag === "tonight") {
      return (
        dish.availability === "available" ||
        dish.availability === "evening-only" ||
        dish.availability === "seasonal"
      );
    }
    if (dish.availability === "unavailable") return false;
    if (dish.availability === "lunch-only") return isLunchTime();
    if (dish.availability === "evening-only") return !isLunchTime();
    return (
      dish.availability === "available" || dish.availability === "seasonal"
    );
  });
}

export function filterDishes(
  dishes: Dish[],
  filters: MenuFiltersState,
): Dish[] {
  return dishes.filter((dish) => {
    if (!matchesQuery(dish, filters.query)) return false;
    if (filters.menuGroup && !filters.query.trim()) {
      if (dish.menuGroup !== filters.menuGroup) return false;
    }
    if (
      filters.categories.length > 0 &&
      !filters.categories.includes(dish.category)
    ) {
      return false;
    }
    if (filters.dietary.some((tag) => !dish.dietaryTags.includes(tag))) {
      return false;
    }
    if (filters.maxPrice != null && dish.price > filters.maxPrice) {
      return false;
    }
    if (
      filters.spiceLevels.length > 0 &&
      !filters.spiceLevels.includes(dish.spiceLevel as SpiceLevel)
    ) {
      return false;
    }
    if (!availabilityMatches(dish, filters.availability)) return false;
    return true;
  });
}

export function uniqueGroups(dishes: Dish[]): string[] {
  const seen: string[] = [];
  for (const d of dishes) {
    const g = d.menuGroup ?? "Carte";
    if (!seen.includes(g)) seen.push(g);
  }
  return seen;
}

export function uniqueCategories(
  dishes: Dish[],
  group?: string | null,
): string[] {
  const seen: string[] = [];
  for (const d of dishes) {
    if (group && d.menuGroup !== group) continue;
    if (!seen.includes(d.category)) seen.push(d.category);
  }
  return seen;
}

export function priceExtent(dishes: Dish[]): { min: number; max: number } {
  if (dishes.length === 0) return { min: 0, max: 100 };
  let min = dishes[0].price;
  let max = dishes[0].price;
  for (const d of dishes) {
    if (d.price < min) min = d.price;
    if (d.price > max) max = d.price;
  }
  return { min, max };
}

export function emptyFilters(): MenuFiltersState {
  return {
    query: "",
    menuGroup: null,
    categories: [],
    dietary: [],
    maxPrice: null,
    spiceLevels: [],
    availability: [],
  };
}

export function availabilityLabel(value: Availability): string {
  switch (value) {
    case "available":
      return "Disponible";
    case "unavailable":
      return "Rupture";
    case "seasonal":
      return "Saisonnier";
    case "evening-only":
      return "Soir uniquement";
    case "lunch-only":
      return "Midi uniquement";
  }
}
