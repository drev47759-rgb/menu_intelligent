/** Core catalog types for the Menu Intelligent MVP. */

export type DietaryTag =
  | "vegetarian"
  | "vegan"
  | "gluten-free"
  | "halal"
  | "no-pork";

export type SpiceLevel = 0 | 1 | 2 | 3;

export type Availability =
  | "available"
  | "unavailable"
  | "seasonal"
  | "evening-only"
  | "lunch-only";

/** Course slot used by the meal calculator. */
export type Course = "starter" | "main" | "dessert" | "drink" | "menu" | "other";

export interface Dish {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  ingredients?: string[];
  allergens: string[];
  dietaryTags: DietaryTag[];
  spiceLevel: SpiceLevel;
  availability: Availability;
  origin?: string | null;
  portion?: string | null;
  image?: string;
  isFeatured?: boolean;
  /** Carte source (À la Carte, Bar, Brunch…). */
  menuGroup?: string;
  categoryId?: string;
  course?: Course;
}

export interface OpeningHours {
  day: string;
  open: string;
  close: string;
}

export interface Restaurant {
  slug: string;
  name: string;
  address: string;
  phone: string;
  email?: string;
  website?: string;
  reservationUrl?: string;
  orderUrl?: string;
  hours: OpeningHours[];
  cuisineType: string;
  tagline: string;
  description: string;
  image: string;
  imageAlt: string;
  mapsQuery: string;
  city: string;
  priceHint: string;
  theme: "train-bleu" | "bordelaise" | "histoire";
}

export interface RestaurantCatalog {
  restaurant: Restaurant;
  dishes: Dish[];
}

export interface MenuFiltersState {
  query: string;
  menuGroup: string | null;
  categories: string[];
  dietary: DietaryTag[];
  maxPrice: number | null;
  spiceLevels: SpiceLevel[];
  availability: Array<"today" | "tonight" | "seasonal">;
}
