import { cn } from "@/lib/cn";
import { availabilityLabel } from "@/lib/menu-query";
import type { Availability } from "@/types/menu";

const styles: Record<Availability, string> = {
  available: "bg-available/15 text-available",
  unavailable: "bg-danger/15 text-danger",
  seasonal: "bg-seasonal/15 text-seasonal",
  "evening-only": "bg-ink/10 text-ink-soft",
  "lunch-only": "bg-ink/10 text-ink-soft",
};

/** Default "Disponible" is omitted on cards — it is noise. */
export function AvailabilityBadge({
  value,
  force = false,
}: {
  value: Availability;
  force?: boolean;
}) {
  if (value === "available" && !force) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold tracking-wide",
        styles[value],
      )}
    >
      {availabilityLabel(value)}
    </span>
  );
}
