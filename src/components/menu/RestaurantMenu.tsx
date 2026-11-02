"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ActionButtons } from "@/components/menu/ActionButtons";
import { DishCard, DrinkList } from "@/components/menu/DishCard";
import { HoursTable } from "@/components/menu/HoursTable";
import {
  MealCalculator,
  mealCount,
  mealTotal,
  type MealSlots,
} from "@/components/menu/MealCalculator";
import { MenuFilters } from "@/components/menu/MenuFilters";
import { MenuSearch } from "@/components/menu/MenuSearch";
import { DIETARY_LABELS } from "@/components/menu/labels";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/cn";
import { formatPhone, formatPrice, isOpenNow, telHref } from "@/lib/format";
import {
  categorySlug,
  emptyFilters,
  filterDishes,
  priceExtent,
  uniqueCategories,
  uniqueGroups,
} from "@/lib/menu-query";
import type { Dish, MenuFiltersState, Restaurant } from "@/types/menu";

type Props = {
  restaurant: Restaurant;
  dishes: Dish[];
};

const emptyMeal: MealSlots = { starter: null, main: null, dessert: null };

export function RestaurantMenu({ restaurant, dishes }: Props) {
  const [filters, setFilters] = useState<MenuFiltersState>(() => ({
    ...emptyFilters(),
    menuGroup: uniqueGroups(dishes)[0] ?? null,
  }));
  const [meal, setMeal] = useState<MealSlots>(emptyMeal);
  const [activeDish, setActiveDish] = useState<Dish | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  // « Ouvert maintenant » calculé côté client uniquement : le rendu serveur
  // ne connaît pas l'heure locale du visiteur (évite les écarts d'hydratation).
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const groups = useMemo(() => uniqueGroups(dishes), [dishes]);
  const scope = useMemo(
    () =>
      filters.menuGroup
        ? dishes.filter((d) => d.menuGroup === filters.menuGroup)
        : dishes,
    [dishes, filters.menuGroup],
  );
  const { max } = useMemo(() => priceExtent(scope), [scope]);
  const maxBound = Math.max(10, Math.ceil(max));
  const priceStep = maxBound > 200 ? 5 : 1;

  useEffect(() => {
    setFilters((current) =>
      current.maxPrice != null && current.maxPrice > maxBound
        ? { ...current, maxPrice: null }
        : current,
    );
  }, [maxBound]);

  const categories = useMemo(
    () => uniqueCategories(dishes, filters.menuGroup),
    [dishes, filters.menuGroup],
  );

  const visible = useMemo(
    () => filterDishes(dishes, filters),
    [dishes, filters],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, Dish[]>();
    for (const dish of visible) {
      const list = map.get(dish.category) ?? [];
      list.push(dish);
      map.set(dish.category, list);
    }
    return [...map.entries()];
  }, [visible]);

  useEffect(() => {
    track("page_view", {
      restaurant: restaurant.slug,
      dishCount: dishes.length,
    });
  }, [restaurant.slug, dishes.length]);

  useEffect(() => {
    if (filters.query) {
      track("search", { q: filters.query, results: visible.length });
    }
  }, [filters.query, visible.length]);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (activeDish) {
      if (!el.open) el.showModal();
      track("dish_view", { id: activeDish.id, name: activeDish.name });
    } else if (el.open) {
      el.close();
    }
  }, [activeDish]);

  function onFiltersChange(next: MenuFiltersState) {
    const changed =
      next.dietary.join() !== filters.dietary.join() ||
      next.categories.join() !== filters.categories.join() ||
      next.maxPrice !== filters.maxPrice ||
      next.spiceLevels.join() !== filters.spiceLevels.join() ||
      next.availability.join() !== filters.availability.join() ||
      next.menuGroup !== filters.menuGroup;
    setFilters(next);
    if (changed) {
      track("filter_used", {
        dietary: next.dietary,
        maxPrice: next.maxPrice,
        group: next.menuGroup,
      });
    }
  }

  function addToMeal(dish: Dish) {
    const course =
      dish.course === "starter" ||
      dish.course === "main" ||
      dish.course === "dessert"
        ? dish.course
        : dish.course === "menu"
          ? "main"
          : null;
    if (!course) return;
    setMeal((prev) => ({ ...prev, [course]: dish }));
    track("meal_add", { id: dish.id, course });
  }

  const inMealIds = new Set(
    [meal.starter, meal.main, meal.dessert]
      .filter(Boolean)
      .map((d) => (d as Dish).id),
  );

  const open = now ? isOpenNow(restaurant.hours, now) : false;
  const count = mealCount(meal);
  const total = mealTotal(meal);

  return (
    <div data-theme={restaurant.theme} className="min-h-screen overflow-x-hidden bg-cream text-ink">
      <a href="#menu-results" className="skip-link">
        Aller au menu
      </a>

      <header className="border-b border-line bg-cream">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:px-6">
          <Link
            href="/"
            className="inline-flex w-fit min-h-11 items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Tous les restaurants
          </Link>
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-end">
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] text-accent uppercase">
                {restaurant.cuisineType} · {restaurant.city}
              </p>
              <h1 className="mt-1 font-display text-4xl leading-tight text-balance text-ink sm:text-5xl">
                {restaurant.name}
              </h1>
              <p className="mt-1 text-ink-muted italic">{restaurant.tagline}</p>
              <p className="mt-3 max-w-xl text-pretty text-sm leading-normal text-ink-muted">
                {restaurant.description}
              </p>
              <p className="mt-3 text-sm text-ink-soft">
                {restaurant.address}
                <span aria-hidden> · </span>
                <a
                  className="font-semibold text-ink underline-offset-2 hover:underline"
                  href={telHref(restaurant.phone)}
                >
                  {formatPhone(restaurant.phone)}
                </a>
              </p>
              <p
                className={
                  open
                    ? "mt-2 text-sm font-semibold text-available"
                    : "mt-2 text-sm font-semibold text-ink-muted"
                }
              >
                {open ? "Ouvert maintenant" : "Actuellement fermé"}
                <span className="font-normal text-ink-muted">
                  {" "}
                  · {restaurant.priceHint}
                </span>
              </p>
            </div>
            <ActionButtons restaurant={restaurant} />
          </div>
        </div>
      </header>

      <figure className="relative overflow-hidden bg-ink">
        <Image
          src={restaurant.image}
          alt={restaurant.imageAlt}
          width={1600}
          height={640}
          priority
          sizes="100vw"
          className="h-40 w-full object-cover opacity-75 sm:h-52"
        />
      </figure>

      {groups.length > 1 ? (
        <nav
          aria-label="Cartes"
          className="border-b border-line bg-paper"
        >
          <div className="mx-auto flex min-w-0 max-w-6xl gap-1 overflow-x-auto px-4 sm:px-6">
            {groups.map((g) => {
              const selected = filters.menuGroup === g;
              return (
                <button
                  key={g}
                  type="button"
                  aria-current={selected ? "page" : undefined}
                  onClick={() =>
                    onFiltersChange({
                      ...filters,
                      menuGroup: g,
                      categories: [],
                      query: "",
                    })
                  }
                  className={cn(
                    "min-h-12 shrink-0 border-b-2 px-4 text-sm font-semibold whitespace-nowrap",
                    selected
                      ? "border-accent text-ink"
                      : "border-transparent text-ink-muted hover:text-ink",
                  )}
                >
                  {g}
                </button>
              );
            })}
          </div>
        </nav>
      ) : null}

      <div className="sticky top-0 z-30 border-b border-line bg-cream/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-start gap-3 px-4 py-3 sm:px-6">
          <MenuSearch
            value={filters.query}
            onChange={(query) => setFilters((f) => ({ ...f, query }))}
            resultCount={visible.length}
            totalCount={
              filters.query.trim() ? dishes.length : scope.length
            }
          />
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <MenuFilters
            filters={filters}
            onChange={onFiltersChange}
            groups={groups}
            categories={categories}
            maxBound={maxBound}
            priceStep={priceStep}
          />
          <div className="mt-4 hidden lg:block">
            <MealCalculator
              meal={meal}
              onRemove={(course) => {
                setMeal((prev) => ({ ...prev, [course]: null }));
                track("meal_remove", { course });
              }}
              onClear={() => setMeal(emptyMeal)}
            />
          </div>
          <div className="mt-4 hidden lg:block">
            <HoursTable hours={restaurant.hours} />
          </div>
        </aside>

        <div className="min-w-0">
          <main id="menu-results" className="min-w-0">
            {grouped.length > 1 ? (
              <nav
                aria-label="Catégories"
                className="mb-6 flex min-w-0 gap-1.5 overflow-x-auto pb-1"
              >
                {grouped.map(([category, items]) => (
                  <a
                    key={category}
                    href={`#cat-${categorySlug(category)}`}
                    className="inline-flex min-h-11 shrink-0 items-center rounded-full bg-paper px-3 text-xs font-semibold whitespace-nowrap text-ink-soft shadow-border hover:text-ink"
                  >
                    {category}
                    <span className="ml-1.5 text-ink-subtle tabular-nums">
                      {items.length}
                    </span>
                  </a>
                ))}
              </nav>
            ) : null}
            {visible.length === 0 ? (
              <div className="rounded-xl bg-paper px-6 py-16 text-center shadow-border">
                <p className="font-display text-2xl text-ink">
                  Aucun plat ne correspond à vos critères
                </p>
                <p className="mt-2 text-sm text-ink-muted">
                  Élargissez la recherche, augmentez le budget ou retirez un
                  régime.
                </p>
                <button
                  type="button"
                  className="mt-5 min-h-11 rounded-full bg-ink px-5 text-sm font-semibold text-cream"
                  onClick={() =>
                    setFilters({
                      ...emptyFilters(),
                      menuGroup: groups[0] ?? null,
                    })
                  }
                >
                  Réinitialiser
                </button>
              </div>
            ) : (
              grouped.map(([category, items]) => (
                <section
                  key={category}
                  id={`cat-${categorySlug(category)}`}
                  className="mb-10 scroll-mt-24"
                  aria-labelledby={`heading-${categorySlug(category)}`}
                >
                  <h2
                    id={`heading-${categorySlug(category)}`}
                    className="mb-4 font-display text-3xl text-ink"
                  >
                    {category}
                  </h2>
                  <div className="grid gap-3">
                    {items.every((dish) => dish.course === "drink") ? (
                      <DrinkList items={items} onOpen={setActiveDish} />
                    ) : (
                      items.map((dish) => (
                        <DishCard
                          key={dish.id}
                          dish={dish}
                          inMeal={inMealIds.has(dish.id)}
                          onAdd={addToMeal}
                          onOpen={setActiveDish}
                        />
                      ))
                    )}
                  </div>
                </section>
              ))
            )}
          </main>

          <div className="mt-8 space-y-4 lg:hidden">
            <MealCalculator
              meal={meal}
              onRemove={(course) =>
                setMeal((prev) => ({ ...prev, [course]: null }))
              }
              onClear={() => setMeal(emptyMeal)}
            />
            <HoursTable hours={restaurant.hours} />
          </div>
        </div>
      </div>

      <div className="h-24 lg:hidden" aria-hidden />
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-cream/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <p className="min-w-0 flex-1 text-sm">
            <span className="font-semibold tabular-nums">
              {formatPrice(total)}
            </span>
            <span className="text-ink-muted">
              {" "}
              · {count} plat{count > 1 ? "s" : ""}
            </span>
          </p>
          <ActionButtons
            restaurant={restaurant}
            variant="bar"
            className="flex-1 justify-end [&>a:nth-child(n+3)]:hidden"
          />
        </div>
      </div>

      <dialog
        ref={dialogRef}
        className="w-[min(100%,32rem)] rounded-2xl bg-paper p-0 text-ink shadow-border backdrop:bg-ink/50"
        aria-labelledby={activeDish ? "dish-dialog-title" : undefined}
        onClose={() => setActiveDish(null)}
      >
        {activeDish ? (
          <div className="p-6">
            <p className="text-xs font-semibold tracking-wide text-ink-muted uppercase">
              {activeDish.category}
            </p>
            <h2 id="dish-dialog-title" className="mt-1 font-display text-2xl text-ink">
              {activeDish.name}
            </h2>
            <p className="mt-1 font-semibold tabular-nums">
              {formatPrice(activeDish.price)}
              {activeDish.portion ? ` · ${activeDish.portion}` : ""}
            </p>
            {activeDish.description ? (
              <p className="mt-3 text-sm leading-normal text-ink-muted">
                {activeDish.description}
              </p>
            ) : null}
            {activeDish.ingredients && activeDish.ingredients.length > 0 ? (
              <p className="mt-3 text-sm text-ink-soft">
                <span className="font-semibold text-ink">Ingrédients : </span>
                {activeDish.ingredients.join(", ")}
              </p>
            ) : null}
            {activeDish.allergens.length > 0 ? (
              <p className="mt-2 text-sm text-ink-soft">
                <span className="font-semibold text-ink">Allergènes : </span>
                {activeDish.allergens.join(", ")}
              </p>
            ) : null}
            {activeDish.dietaryTags.length > 0 ? (
              <p className="mt-2 text-sm text-ink-soft">
                {activeDish.dietaryTags.map((t) => DIETARY_LABELS[t]).join(" · ")}
              </p>
            ) : null}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="min-h-11 rounded-full px-4 text-sm font-semibold text-ink-muted hover:text-ink"
                onClick={() => setActiveDish(null)}
              >
                Fermer
              </button>
              <button
                type="button"
                className="min-h-11 rounded-full bg-accent px-4 text-sm font-semibold text-accent-fg"
                onClick={() => {
                  addToMeal(activeDish);
                  setActiveDish(null);
                }}
              >
                Ajouter à mon repas
              </button>
            </div>
          </div>
        ) : null}
      </dialog>
    </div>
  );
}
