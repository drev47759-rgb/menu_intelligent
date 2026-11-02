import { Search, X } from "lucide-react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  resultCount: number;
  totalCount: number;
};

export function MenuSearch({
  value,
  onChange,
  resultCount,
  totalCount,
}: Props) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <label htmlFor="menu-search" className="sr-only">
        Rechercher un plat, un ingrédient ou un vin
      </label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-subtle"
          aria-hidden
        />
        <input
          id="menu-search"
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Plat, ingrédient, vin…"
          autoComplete="off"
          enterKeyHint="search"
          className="h-11 w-full rounded-full border-0 bg-paper pr-12 pl-10 text-sm text-ink shadow-border placeholder:text-ink-subtle focus:shadow-border-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        />
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-1/2 right-1 grid size-11 -translate-y-1/2 place-items-center rounded-full text-ink-subtle hover:text-ink"
            aria-label="Effacer la recherche"
          >
            <X className="size-4" aria-hidden />
          </button>
        ) : null}
      </div>
      <p
        className="px-1 text-xs text-ink-muted tabular-nums"
        aria-live="polite"
      >
        {resultCount} résultat{resultCount > 1 ? "s" : ""}
        {resultCount !== totalCount ? ` sur ${totalCount}` : ""}
      </p>
    </div>
  );
}
