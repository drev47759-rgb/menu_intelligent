import { Flame, Plus } from "lucide-react";
import { AvailabilityBadge } from "@/components/menu/AvailabilityBadge";
import { DIETARY_LABELS, SPICE_LABELS } from "@/components/menu/labels";
import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/format";
import type { Dish } from "@/types/menu";

type Props = {
  dish: Dish;
  inMeal: boolean;
  onAdd: (dish: Dish) => void;
  onOpen: (dish: Dish) => void;
};

export function DishCard({ dish, inMeal, onAdd, onOpen }: Props) {
  const canAdd =
    dish.course === "starter" ||
    dish.course === "main" ||
    dish.course === "dessert" ||
    dish.course === "menu";
  const compact = dish.course === "drink";

  return (
    <article
      className={cn(
        "group rounded-lg bg-paper shadow-border transition-shadow duration-(--motion-quick) hover:shadow-border-hover",
        compact ? "px-4 py-3" : "p-4",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 font-medium text-pretty text-ink">
          <button
            type="button"
            className="text-left hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            onClick={() => onOpen(dish)}
          >
            {dish.name}
          </button>
          {dish.portion ? (
            <span className="ml-2 text-xs font-medium text-ink-muted">
              {dish.portion}
            </span>
          ) : null}
        </h3>
        <p className="shrink-0 font-semibold tabular-nums text-ink">
          {formatPrice(dish.price)}
        </p>
      </div>

      {dish.description ? (
        <p
          className={cn(
            "mt-1 text-pretty text-sm leading-normal text-ink-muted",
            compact && "line-clamp-2",
          )}
        >
          {dish.description}
        </p>
      ) : null}

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <AvailabilityBadge value={dish.availability} />
        {!compact
          ? dish.dietaryTags
              .filter((t) => t !== "no-pork")
              .map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-cream px-2 py-0.5 text-xs font-semibold text-ink-soft"
                >
                  {DIETARY_LABELS[tag]}
                </span>
              ))
          : null}
        {dish.spiceLevel > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-danger/10 px-2 py-0.5 text-xs font-semibold text-danger">
            <Flame className="size-3" aria-hidden />
            {SPICE_LABELS[dish.spiceLevel]}
          </span>
        ) : null}
        {dish.allergens.length > 0 ? (
          <span className="text-xs text-ink-subtle">
            Allergènes : {dish.allergens.join(", ")}
          </span>
        ) : null}
      </div>

      {canAdd ? (
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={() => onAdd(dish)}
            className={cn(
              "inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
              inMeal
                ? "bg-ink text-cream"
                : "bg-cream text-ink shadow-border hover:bg-paper",
            )}
          >
            <Plus className="size-3.5" aria-hidden />
            {inMeal ? "Dans mon repas" : "Ajouter à mon repas"}
          </button>
        </div>
      ) : null}
    </article>
  );
}

/** One panel for a wine or drink category — scannable prices, not a wall of cards. */
export function DrinkList({
  items,
  onOpen,
}: {
  items: Dish[];
  onOpen: (dish: Dish) => void;
}) {
  const sulfitesOnly = items.every(
    (dish) => dish.allergens.length === 1 && dish.allergens[0] === "sulfites",
  );
  return (
    <div className="overflow-hidden rounded-lg bg-paper shadow-border">
      {sulfitesOnly ? (
        <p className="border-b border-line px-4 py-2 text-xs text-ink-muted">
          Sulfites
        </p>
      ) : null}
      <ul>
        {items.map((dish) => (
          <li key={dish.id} className="border-b border-line last:border-0">
            <button
              type="button"
              onClick={() => onOpen(dish)}
              className="flex w-full min-h-11 items-baseline gap-3 px-4 py-2.5 text-left hover:bg-cream focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
            >
              <span className="min-w-0 flex-1 font-medium text-ink">
                {dish.name}
                {dish.portion ? (
                  <span className="ml-2 text-xs font-medium text-ink-muted">
                    {dish.portion}
                  </span>
                ) : null}
              </span>
              <AvailabilityBadge value={dish.availability} />
              <span className="shrink-0 font-semibold tabular-nums text-ink">
                {formatPrice(dish.price)}
              </span>
            </button>
            {dish.description ? (
              <p className="px-4 pb-2 text-xs leading-normal text-ink-muted">
                {dish.description}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
