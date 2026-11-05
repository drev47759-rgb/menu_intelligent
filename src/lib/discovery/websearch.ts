import type { PlatformLink, Plateforme } from "@/types/discovery";

const UA =
  "menu-intelligent-discovery/1.0 (+https://github.com/drev47759-rgb/menu_intelligent)";

/** Domaines qui ne sont jamais le site officiel d'un restaurant. */
const DIR_DOMAINS = [
  "tripadvisor.",
  "thefork.",
  "pagesjaunes.",
  "petitfute.",
  "restaurantguru.",
  "yelp.",
  "justeat.",
  "deliveroo.",
  "ubereats.",
  "lacarte.menu",
  "menuweb.menu",
  "eatbu.",
  "eat-list.",
  "societe.com",
  "pappers.",
  "rubypayeur.",
  "verif.",
  "viamichelin.",
  "mappy.",
  "kompass.",
  "annuaire-",
  "gowork.",
  "linkedin.",
  "facebook.",
  "instagram.",
  "gaultmillau.",
  "dandb.",
];

export async function fetchText(
  url: string,
  timeoutMs = 6000,
): Promise<string | null> {
  try {
    const res = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
      headers: { "User-Agent": UA, "Accept-Language": "fr" },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export function safeHost(url: string): string | null {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

function isDirectory(url: string): boolean {
  const host = safeHost(url);
  if (!host) return true;
  return DIR_DOMAINS.some((d) => host.includes(d));
}

/** Décode les liens-redirections de DuckDuckGo (paramètre uddg=). */
function decodeDdgHref(href: string): string | null {
  let raw = href.startsWith("//") ? "https:" + href : href;
  raw = raw.replace(/&amp;/g, "&");
  if (!raw.startsWith("http")) return null;
  try {
    const parsed = new URL(raw);
    if (parsed.host.includes("duckduckgo.com")) {
      const target = parsed.searchParams.get("uddg");
      if (target) raw = target;
    }
  } catch {
    return null;
  }
  if (!raw.startsWith("http")) return null;
  return safeHost(raw) ? raw : null;
}

/** Recherche DuckDuckGo HTML — gratuite, sans clé d'API. */
export async function duckduckgoSearch(
  query: string,
  limit = 5,
): Promise<string[]> {
  const html = await fetchText(
    "https://html.duckduckgo.com/html/?q=" + encodeURIComponent(query),
    8000,
  );
  if (!html) return [];
  const out: string[] = [];
  const re = /<a[^>]+class="result__a"[^>]+href="([^"]+)"/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    const url = decodeDdgHref(match[1]);
    if (!url || out.includes(url)) continue;
    out.push(url);
    if (out.length >= limit) break;
  }
  return out;
}

/** Sites candidats au titre de site officiel (annuaires et plateformes exclus). */
export async function findOfficialSiteCandidates(
  nom: string,
  commune: string,
): Promise<string[]> {
  const urls = await duckduckgoSearch('"' + nom + '" ' + commune + " restaurant", 6);
  return urls.filter((u) => !isDirectory(u));
}

/** Recherche préremplie sur la plateforme, si la page du restaurant est introuvable. */
function platformFallbackUrl(
  plateforme: Plateforme,
  nom: string,
  commune: string,
): string {
  const q = encodeURIComponent(nom + " " + commune);
  if (plateforme === "uber-eats") {
    return "https://www.ubereats.com/fr/search/?find=" + q;
  }
  if (plateforme === "deliveroo") {
    return "https://deliveroo.com/fr-fr/search?q=" + q;
  }
  return "https://www.tripadvisor.fr/Search?q=" + q + "&ssrc=h";
}

function platformHostMatch(plateforme: Plateforme, host: string): boolean {
  if (plateforme === "uber-eats") return host.endsWith("ubereats.com");
  if (plateforme === "deliveroo") return host.includes("deliveroo.");
  return host.includes("tripadvisor.");
}

/**
 * Cherche la page du restaurant sur Uber Eats, Deliveroo ou TripAdvisor.
 * Retourne la page du restaurant si elle est trouvée, sinon une recherche
 * préremplie (direct: false).
 */
export async function findPlatformLink(
  plateforme: Plateforme,
  nom: string,
  commune: string,
): Promise<PlatformLink> {
  const siteFilter =
    plateforme === "uber-eats"
      ? "site:ubereats.com"
      : plateforme === "deliveroo"
        ? "site:deliveroo.com"
        : "site:tripadvisor.fr";
  const urls = await duckduckgoSearch(
    siteFilter + ' "' + nom + '" ' + commune,
    3,
  );
  const found = urls.find((u) => {
    const host = safeHost(u);
    return host !== null && platformHostMatch(plateforme, host);
  });
  if (found) {
    return { plateforme, url: found, direct: true };
  }
  return {
    plateforme,
    url: platformFallbackUrl(plateforme, nom, commune),
    direct: false,
  };
}
