import { Trash2, UtensilsCrossed } from "lucide-react";
import { COURSE_LABELS } from "@/components/menu/labels";
import { formatPrice } from "@/lib/format";
import type { Course, Dish } from "@/types/menu";

export type MealSlots = {
  starter: Dish | null;
  main: Dish | null;
  dessert: Dish | null;
};

type Props = {
  meal: MealSlots;
  onRemove: (course: keyof MealSlots) => void;
  onClear: () => void;
};

const ORDER: Array<keyof MealSlots> = ["starter", "main", "dessert"];

export function mealTotal(meal: MealSlots): number {
  return ORDER.reduce((sum, key) => sum + (meal[key]?.price ?? 0), 0);
}

export function mealCount(meal: MealSlots): number {
  return ORDER.filter((key) => meal[key]).length;
}

export function MealCalculator({ meal, onRemove, onClear }: Props) {
  const total = mealTotal(meal);
  const count = mealCount(meal);

  return (
    <section
      aria-labelledby="meal-heading"
      className="rounded-xl bg-paper p-4 shadow-border"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2
          id="meal-heading"
          className="inline-flex items-center gap-2 font-display text-xl text-ink"
        >
          <UtensilsCrossed className="size-4" aria-hidden />
          Mon repas
        </h2>
        {count > 0 ? (
          <button
            type="button"
            onClick={onClear}
            className="min-h-11 px-1 text-xs font-medium text-ink-muted hover:text-ink hover:underline"
          >
            Vider
          </button>
        ) : null}
      </div>
      <ul className="flex flex-col">
        {ORDER.map((course) => {
          const dish = meal[course];
          return (
            <li
              key={course}
              className="flex items-center justify-between gap-2 border-b border-line py-2 last:border-0"
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold tracking-wide text-ink-muted uppercase">
                  {COURSE_LABELS[course as Course]}
                </p>
                <p className="truncate text-sm text-ink">
                  {dish ? dish.name : "—"}
                </p>
              </div>
              {dish ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold tabular-nums">
                    {formatPrice(dish.price)}
                  </span>
                  <button
                    type="button"
                    className="grid size-11 place-items-center rounded-full text-ink-muted hover:bg-cream hover:text-ink"
                    aria-label={`Retirer ${dish.name}`}
                    onClick={() => onRemove(course)}
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </button>
                </div>
              ) : (
                <span className="text-sm text-ink-subtle">0 €</span>
              )}
            </li>
          );
        })}
      </ul>
      <p className="mt-3 flex items-baseline justify-between text-ink">
        <span className="text-sm font-medium">Total estimé</span>
        <span className="font-display text-2xl tabular-nums">
          {formatPrice(total)}
        </span>
      </p>
      <p className="mt-1 text-xs text-ink-subtle">
        Hors boissons. Prix indicatifs, service compris selon la carte.
      </p>
    </section>
  );
}
