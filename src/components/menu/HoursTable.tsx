"use client";

import { useEffect, useState } from "react";
import { isOpenNow } from "@/lib/format";
import type { OpeningHours } from "@/types/menu";

export function HoursTable({ hours }: { hours: OpeningHours[] }) {
  // « Ouvert maintenant » calculé côté client uniquement :
  // le rendu serveur ne connaît pas l'heure locale du visiteur.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const open = now !== null && isOpenNow(hours, now);
  const grouped = new Map<string, string[]>();
  for (const slot of hours) {
    const label =
      slot.open === "Fermé" ? "Fermé" : `${slot.open} – ${slot.close}`;
    const list = grouped.get(slot.day) ?? [];
    if (!list.includes(label)) list.push(label);
    grouped.set(slot.day, list);
  }

  return (
    <section aria-labelledby="hours-heading" className="rounded-xl bg-paper p-4 shadow-border">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 id="hours-heading" className="font-display text-xl text-ink">
          Horaires
        </h2>
        <p
          className={
            open
              ? "text-xs font-semibold text-available"
              : "text-xs font-semibold text-ink-muted"
          }
        >
          {open ? "Ouvert maintenant" : "Actuellement fermé"}
        </p>
      </div>
      <table className="w-full text-sm">
        <caption className="sr-only">Horaires d'ouverture</caption>
        <tbody>
          {[...grouped.entries()].map(([day, slots]) => (
            <tr key={day} className="border-b border-line last:border-0">
              <th
                scope="row"
                className="py-2 pr-4 text-left font-medium text-ink"
              >
                {day}
              </th>
              <td className="py-2 text-ink-muted tabular-nums">
                {slots.join(" · ")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
