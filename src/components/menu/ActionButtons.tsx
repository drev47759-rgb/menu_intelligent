import { CalendarCheck, MapPin, Phone, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/cn";
import { track } from "@/lib/analytics";
import { mapsHref, telHref } from "@/lib/format";
import type { Restaurant } from "@/types/menu";

type Props = {
  restaurant: Restaurant;
  variant?: "header" | "bar" | "card";
  className?: string;
};

export function ActionButtons({
  restaurant,
  variant = "header",
  className,
}: Props) {
  const call = telHref(restaurant.phone);
  const maps = mapsHref(restaurant.mapsQuery);
  const reserve = restaurant.reservationUrl ?? call;
  const order = restaurant.orderUrl ?? call;

  const baseBtn =
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors duration-(--motion-quick) ease-(--ease-out) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

  const primary = "bg-accent text-accent-fg hover:bg-accent-hover";
  const secondary =
    "bg-cream text-ink shadow-border hover:shadow-border-hover";

  return (
    <nav
      aria-label="Actions"
      className={cn(
        "flex flex-wrap gap-2",
        variant === "bar" && "w-full",
        className,
      )}
    >
      <a
        href={reserve}
        className={cn(baseBtn, primary, variant === "bar" && "flex-1")}
        onClick={() =>
          track("click_reserve", { restaurant: restaurant.slug })
        }
      >
        <CalendarCheck className="size-4" aria-hidden />
        Réserver
      </a>
      <a
        href={order}
        className={cn(baseBtn, secondary)}
        onClick={() => track("click_order", { restaurant: restaurant.slug })}
      >
        <ShoppingBag className="size-4" aria-hidden />
        Commander
      </a>
      <a
        href={call}
        className={cn(baseBtn, secondary)}
        onClick={() => track("click_call", { restaurant: restaurant.slug })}
      >
        <Phone className="size-4" aria-hidden />
        Appeler
      </a>
      <a
        href={maps}
        target="_blank"
        rel="noreferrer"
        className={cn(baseBtn, secondary)}
        onClick={() =>
          track("click_directions", { restaurant: restaurant.slug })
        }
      >
        <MapPin className="size-4" aria-hidden />
        Itinéraire
      </a>
    </nav>
  );
}
