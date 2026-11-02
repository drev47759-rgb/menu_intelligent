import type { DietaryTag, SpiceLevel } from "@/types/menu";

export const DIETARY_LABELS: Record<DietaryTag, string> = {
  vegetarian: "Végétarien",
  vegan: "Vegan",
  "gluten-free": "Sans gluten",
  halal: "Halal",
  "no-pork": "Sans porc",
};

export const SPICE_LABELS: Record<SpiceLevel, string> = {
  0: "Doux",
  1: "Relevé",
  2: "Très relevé",
  3: "Brûlant",
};

export const COURSE_LABELS = {
  starter: "Entrée",
  main: "Plat",
  dessert: "Dessert",
  drink: "Boisson",
  menu: "Formule",
  other: "Autre",
} as const;
