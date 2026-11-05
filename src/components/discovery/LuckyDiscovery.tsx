"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import {
  BadgeCheck,
  Bike,
  Dices,
  ExternalLink,
  FileText,
  Globe,
  Loader2,
  MapPin,
  RotateCcw,
  ShoppingBag,
  Star,
  UtensilsCrossed,
} from "lucide-react";
import type { DiscoveryResult, PlatformLink } from "@/types/discovery";

type Status = "idle" | "loading" | "done" | "error";

const PLATFORM_META: Record<
  PlatformLink["plateforme"],
  { label: string; icon: ReactNode }
> = {
  "uber-eats": {
    label: "Uber Eats",
    icon: <Bike className="size-4" aria-hidden />,
  },
  deliveroo: {
    label: "Deliveroo",
    icon: <ShoppingBag className="size-4" aria-hidden />,
  },
  tripadvisor: {
    label: "TripAdvisor",
    icon: <Star className="size-4" aria-hidden />,
  },
};

const VERIF_LABEL: Record<string, string> = {
  siret: "SIRET — mentions légales",
  siren: "SIREN",
  "adresse-etendue": "adresse Sirene",
};

const linkClass =
  "inline-flex items-center gap-1.5 rounded-full bg-cream px-3 py-1.5 text-sm font-medium text-ink shadow-border hover:bg-paper";

export function LuckyDiscovery() {
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<DiscoveryResult | null>(null);

  async function roll() {
    setStatus("loading");
    setResult(null);
    try {
      const res = await fetch("/api/discovery", { cache: "no-store" });
      if (!res.ok) throw new Error("discovery_failed");
      const data = (await res.json()) as DiscoveryResult;
      setResult(data);
      setStatus("done");
    } catch {
      setResult(null);
      setStatus("error");
    }
  }

  const busy = status === "loading";

  return (
    <div className="rounded-2xl bg-paper p-6 shadow-border">
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={roll}
          disabled={busy}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-6 text-sm font-semibold text-accent-fg transition-colors duration-(--motion-fast) hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Dices className="size-4" aria-hidden />
          )}
          {busy ? "Tirage en cours…" : "J’ai de la chance"}
        </button>
        <p className="text-sm leading-normal text-ink-muted">
          Un restaurant au hasard, <strong>SIRET en activité</strong> uniquement —
          données Sirene de data.gouv, recherche sur Uber Eats, Deliveroo et
          TripAdvisor.
        </p>
      </div>

      <div aria-live="polite">
        {status === "error" && (
          <p className="mt-4 text-sm text-danger">
            Le tirage a échoué. Relancez : la base Sirene reste gratuite.
          </p>
        )}
        {status === "done" && result && (
          <DiscoveryCard result={result} onRelance={roll} />
        )}
      </div>
    </div>
  );
}

function DiscoveryCard({
  result,
  onRelance,
}: {
  result: DiscoveryResult;
  onRelance: () => void;
}) {
  const r = result.restaurant;
  return (
    <div className="mt-6 rounded-xl bg-cream p-5 shadow-border">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-2xl">
            {r.enseigne ?? r.nomComplet}
          </h3>
          {r.enseigne && (
            <p className="mt-0.5 text-sm text-ink-muted italic">{r.nomComplet}</p>
          )}
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-cream px-3 py-1 text-xs font-semibold text-available shadow-border">
          <span className="size-2 rounded-full bg-available" aria-hidden />
          SIRET en activité
        </span>
      </div>

      <p className="mt-3 flex items-start gap-2 text-sm text-ink-soft">
        <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>{r.adresseEtendue}</span>
      </p>
      <p className="mt-1 text-xs text-ink-subtle">
        SIRET {r.siret} — NAF {r.naf} — {r.codePostal} {r.commune}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <MenuFormatBadge format={result.menuFormat} />
        {result.verification.statut === "verifie" ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cream px-3 py-1 text-xs font-semibold text-ink shadow-border">
            <BadgeCheck className="size-3.5 text-available" aria-hidden />
            Site officiel vérifié
            {result.verification.methode
              ? " (" + VERIF_LABEL[result.verification.methode] + ")"
              : ""}
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-cream px-3 py-1 text-xs font-semibold text-ink-subtle shadow-border">
            Site officiel non vérifié
          </span>
        )}
      </div>

      <ul className="mt-4 flex flex-wrap gap-2">
        {result.siteOfficiel && (
          <li>
            <a
              href={result.siteOfficiel}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              <Globe className="size-4" aria-hidden />
              Site officiel
              <ExternalLink className="size-3 text-ink-subtle" aria-hidden />
            </a>
          </li>
        )}
        {result.plateformes.map((p) => (
          <li key={p.plateforme}>
            <a
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              {PLATFORM_META[p.plateforme].icon}
              {PLATFORM_META[p.plateforme].label}
              {!p.direct && (
                <span className="text-xs text-ink-subtle">— recherche</span>
              )}
              <ExternalLink className="size-3 text-ink-subtle" aria-hidden />
            </a>
          </li>
        ))}
      </ul>

      {result.menusPdf.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-2">
          {result.menusPdf.map((pdf) => (
            <li key={pdf}>
              <a
                href={pdf}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-seasonal px-3 py-1.5 text-sm font-medium text-cream hover:opacity-90"
              >
                <FileText className="size-4" aria-hidden />
                Menu PDF
                <ExternalLink className="size-3" aria-hidden />
              </a>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-md text-xs leading-normal text-ink-subtle">
          {result.source}
        </p>
        <button
          type="button"
          onClick={onRelance}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink hover:text-accent"
        >
          <RotateCcw className="size-4" aria-hidden />
          Relancer
        </button>
      </div>
    </div>
  );
}

/**
 * Format du menu détecté. Un restaurant dont le menu n’existe qu’au format
 * PDF porte une icône distinctive (badge ambre « Menu PDF uniquement »).
 */
function MenuFormatBadge({ format }: { format: DiscoveryResult["menuFormat"] }) {
  if (format === "pdf") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-seasonal px-3 py-1 text-xs font-semibold text-cream">
        <FileText className="size-3.5" aria-hidden />
        Menu PDF uniquement
      </span>
    );
  }
  if (format === "mixte") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-cream px-3 py-1 text-xs font-semibold text-ink-soft shadow-border">
        <FileText className="size-3.5" aria-hidden />
        Carte en ligne + menu PDF
      </span>
    );
  }
  if (format === "html") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-cream px-3 py-1 text-xs font-semibold text-ink-soft shadow-border">
        <UtensilsCrossed className="size-3.5" aria-hidden />
        Carte en ligne
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-cream px-3 py-1 text-xs font-semibold text-ink-subtle shadow-border">
      Menu non localisé
    </span>
  );
}
