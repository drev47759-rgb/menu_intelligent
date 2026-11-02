import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { SlidersHorizontal } from "lucide-react";
import { DIETARY_LABELS, SPICE_LABELS } from "@/components/menu/labels";
import { cn } from "@/lib/cn";
import type { DietaryTag, MenuFiltersState, SpiceLevel } from "@/types/menu";

type Props = {
  filters: MenuFiltersState;
  onChange: (next: MenuFiltersState) => void;
  groups: string[];
  categories: string[];
  maxBound: number;
  priceStep?: number;
};

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
}

export function MenuFilters({
  filters,
  onChange,
  groups,
  categories,
  maxBound,
  priceStep = 1,
}: Props) {
  const set = (patch: Partial<MenuFiltersState>) =>
    onChange({ ...filters, ...patch });

  const sliderValue = filters.maxPrice ?? maxBound;
  const activeCount =
    filters.dietary.length +
    filters.categories.length +
    filters.spiceLevels.length +
    filters.availability.length +
    (filters.maxPrice != null ? 1 : 0);

  const detailsRef = useRef<HTMLDetailsElement>(null);
  // Open in the DOM so desktop screen readers reach the chips (a closed
  // <details> stays hidden to AT even if CSS paints it). Collapse once on phones.
  useEffect(() => {
    const el = detailsRef.current;
    if (!el) return;
    const desktop = window.matchMedia("(min-width: 1024px)").matches;
    if (!desktop) el.open = false;
  }, []);

  return (
    <details ref={detailsRef} open className="menu-filters rounded-xl bg-paper shadow-border">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-semibold text-ink marker:content-none [&::-webkit-details-marker]:hidden lg:pointer-events-none">
        <span className="inline-flex items-center gap-2">
          <SlidersHorizontal className="size-4" aria-hidden />
          Filtres
          {activeCount > 0 ? (
            <span className="rounded-full bg-ink px-2 py-0.5 text-xs font-semibold text-cream tabular-nums">
              {activeCount}
            </span>
          ) : null}
        </span>
        <span className="text-xs font-medium text-ink-muted lg:hidden">
          Afficher / masquer
        </span>
      </summary>

      <div className="flex flex-col gap-5 border-t border-line px-4 py-4">
        {groups.length > 1 ? (
          <fieldset>
            <legend className="mb-2 text-xs font-semibold tracking-wide text-ink-muted uppercase">
              Carte
            </legend>
            <div className="flex flex-wrap gap-1.5">
              <FilterChip
                pressed={filters.menuGroup === null}
                onClick={() => set({ menuGroup: null, categories: [] })}
              >
                Toutes
              </FilterChip>
              {groups.map((g) => (
                <FilterChip
                  key={g}
                  pressed={filters.menuGroup === g}
                  onClick={() =>
                    set({
                      menuGroup: filters.menuGroup === g ? null : g,
                      categories: [],
                    })
                  }
                >
                  {g}
                </FilterChip>
              ))}
            </div>
          </fieldset>
        ) : null}

        <fieldset>
          <legend className="mb-2 text-xs font-semibold tracking-wide text-ink-muted uppercase">
            Catégories
          </legend>
          <div className="flex max-h-44 flex-wrap gap-1.5 overflow-y-auto">
            {categories.map((c) => (
              <FilterChip
                key={c}
                pressed={filters.categories.includes(c)}
                onClick={() =>
                  set({ categories: toggle(filters.categories, c) })
                }
              >
                {c}
              </FilterChip>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-xs font-semibold tracking-wide text-ink-muted uppercase">
            Régimes
          </legend>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(DIETARY_LABELS) as DietaryTag[]).map((tag) => (
              <FilterChip
                key={tag}
                pressed={filters.dietary.includes(tag)}
                onClick={() => set({ dietary: toggle(filters.dietary, tag) })}
              >
                {DIETARY_LABELS[tag]}
              </FilterChip>
            ))}
          </div>
          <p className="mt-2 text-xs leading-normal text-ink-muted">
            Déduit des ingrédients imprimés, pas une certification. Halal :
            uniquement si la carte le mentionne.
          </p>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-xs font-semibold tracking-wide text-ink-muted uppercase">
            Budget maximum
          </legend>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={maxBound}
              step={priceStep}
              value={sliderValue}
              aria-label="Prix maximum"
              aria-valuetext={
                filters.maxPrice == null
                  ? "Tous les prix"
                  : `${sliderValue} euros`
              }
              onChange={(e) => {
                const v = Number(e.target.value);
                set({ maxPrice: v >= maxBound ? null : v });
              }}
              className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-line accent-accent"
            />
            <span className="w-16 text-right text-sm font-semibold tabular-nums text-ink">
              {filters.maxPrice == null ? "Tous" : `${filters.maxPrice} €`}
            </span>
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-xs font-semibold tracking-wide text-ink-muted uppercase">
            Piquant
          </legend>
          <div className="flex flex-wrap gap-1.5">
            {([0, 1, 2] as SpiceLevel[]).map((level) => (
              <FilterChip
                key={level}
                pressed={filters.spiceLevels.includes(level)}
                onClick={() =>
                  set({ spiceLevels: toggle(filters.spiceLevels, level) })
                }
              >
                {SPICE_LABELS[level]}
              </FilterChip>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-xs font-semibold tracking-wide text-ink-muted uppercase">
            Disponibilité
          </legend>
          <div className="flex flex-wrap gap-1.5">
            <FilterChip
              pressed={filters.availability.includes("today")}
              onClick={() =>
                set({
                  availability: toggle(filters.availability, "today"),
                })
              }
            >
              Disponible aujourd’hui
            </FilterChip>
            <FilterChip
              pressed={filters.availability.includes("tonight")}
              onClick={() =>
                set({
                  availability: toggle(filters.availability, "tonight"),
                })
              }
            >
              Ce soir
            </FilterChip>
            <FilterChip
              pressed={filters.availability.includes("seasonal")}
              onClick={() =>
                set({
                  availability: toggle(filters.availability, "seasonal"),
                })
              }
            >
              Saisonnier
            </FilterChip>
          </div>
        </fieldset>

        <button
          type="button"
          className="self-start min-h-11 text-sm font-medium text-ink-muted underline-offset-2 hover:text-ink hover:underline"
          onClick={() =>
            onChange({
              ...filters,
              categories: [],
              dietary: [],
              maxPrice: null,
              spiceLevels: [],
              availability: [],
              menuGroup: filters.menuGroup,
            })
          }
        >
          Réinitialiser les filtres
        </button>
      </div>
    </details>
  );
}

function FilterChip({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "min-h-11 rounded-full px-3 text-xs font-semibold transition-colors duration-(--motion-quick) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        pressed
          ? "bg-ink text-cream"
          : "bg-cream text-ink-soft shadow-border hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}
