import type { DiscoveredRestaurant } from "@/types/discovery";

/**
 * APIs publiques et gratuites (data.gouv) :
 * - Recherche d'entreprises (base Sirene) pour le tirage ;
 * - API Geo pour résoudre une saisie « ville » en commune réelle.
 * Aucune authentification pour les deux.
 */
const API_SEARCH = "https://recherche-entreprises.api.gouv.fr/search";
const API_GEO = "https://geo.api.gouv.fr/communes";
const NAF_RESTAURATION = "56.10A";
const PER_PAGE = 5;
/** Limite de l'API : page x per_page <= 10 000. */
const MAX_PAGE = 10000 / PER_PAGE;
const PER_PAGE_VILLE = 25;
/** Limite de l'API en mode ville : page x per_page <= 10 000. */
const MAX_PAGE_VILLE = 10000 / PER_PAGE_VILLE;

const KEYWORDS = [
  "restaurant",
  "bistrot",
  "brasserie",
  "auberge",
  "pizzeria",
  "trattoria",
  "comptoir",
  "winstub",
  "hostellerie",
  "creperie",
];

interface SireneSiege {
  siret?: string;
  etat_administratif?: string;
  adresse?: string;
  complement_adresse?: string | null;
  numero_voie?: string;
  libelle_voie?: string;
  code_postal?: string;
  libelle_commune?: string;
  liste_enseignes?: string[] | null;
}

interface SireneResult {
  nom_complet?: string;
  siren?: string;
  activite_principale?: string;
  etat_administratif?: string;
  siege?: SireneSiege;
}

interface SirenePayload {
  results?: SireneResult[];
  total_pages?: number;
}

/** Commune résolue depuis la saisie utilisateur. */
export interface CommuneCiblee {
  nom: string;
  /** Code INSEE (code commune). */
  codeInsee: string;
  codesPostaux: string[];
}

const communeCache = new Map<string, CommuneCiblee | null>();

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Résout une saisie libre (« strasbourg », « paris », « Lyon ») en commune
 * réelle via l'API Geo de data.gouv — match exact privilégié, sinon
 * meilleure pertinence. Retourne null si la ville est inconnue.
 */
export async function resolveCommune(saisie: string): Promise<CommuneCiblee | null> {
  const cle = saisie.trim().toLowerCase();
  if (cle.length < 2) return null;
  if (communeCache.has(cle)) return communeCache.get(cle) ?? null;

  let commune: CommuneCiblee | null = null;
  try {
    const res = await fetch(
      API_GEO +
        "?nom=" +
        encodeURIComponent(cle) +
        "&fields=nom,code,codesPostaux&format=json",
      { cache: "no-store", signal: AbortSignal.timeout(5000) },
    );
    if (res.ok) {
      const data = (await res.json()) as Array<{
        nom?: string;
        code?: string;
        codesPostaux?: string[];
      }>;
      const saisieNorm = normalize(saisie);
      const exact = data.find((c) => c.nom && normalize(c.nom) === saisieNorm);
      const best = exact ?? data[0];
      if (best?.nom && best?.code) {
        commune = {
          nom: best.nom,
          codeInsee: best.code,
          codesPostaux: best.codesPostaux ?? [],
        };
      }
    }
  } catch {
    commune = null;
  }
  communeCache.set(cle, commune);
  return commune;
}

interface SireneDraw {
  restaurants: DiscoveredRestaurant[];
  totalPages: number;
}

async function queryRestaurants(params: URLSearchParams): Promise<SireneDraw> {
  try {
    const res = await fetch(API_SEARCH + "?" + params.toString(), {
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
      headers: { "Accept-Language": "fr" },
    });
    if (!res.ok) return { restaurants: [], totalPages: 0 };
    const data = (await res.json()) as SirenePayload;

    const out: DiscoveredRestaurant[] = [];
    for (const r of data.results ?? []) {
      const siege = r.siege ?? {};
      // Filtre « SIRET encore en activité » : état "A" requis côté unité
      // légale ET côté établissement (siège).
      if (r.etat_administratif !== "A" || siege.etat_administratif !== "A") {
        continue;
      }
      if (!r.nom_complet || !r.siren || !siege.siret || !siege.libelle_commune) {
        continue;
      }
      out.push({
        nomComplet: r.nom_complet,
        siren: r.siren,
        siret: siege.siret,
        naf: r.activite_principale ?? NAF_RESTAURATION,
        actif: true,
        adresseEtendue: [siege.complement_adresse, siege.adresse]
          .filter((x): x is string => Boolean(x))
          .join(" "),
        numeroVoie: siege.numero_voie ?? null,
        libelleVoie: siege.libelle_voie ?? null,
        codePostal: siege.code_postal ?? "",
        commune: siege.libelle_commune,
        enseigne: siege.liste_enseignes?.[0] ?? null,
      });
    }
    return { restaurants: out, totalPages: data.total_pages ?? 0 };
  } catch {
    return { restaurants: [], totalPages: 0 };
  }
}

function filtersVille(extra: Record<string, string>): URLSearchParams {
  const params = new URLSearchParams();
  params.set("activite_principale", NAF_RESTAURATION);
  params.set("per_page", String(PER_PAGE_VILLE));
  params.set("page", "1");
  for (const [key, value] of Object.entries(extra)) {
    params.set(key, value);
  }
  return params;
}

/**
 * Tirage aléatoire d'un lot de restaurants (NAF 56.10A).
 * - Avec ville : la saisie est résolue en commune (API Geo), puis le tirage
 *   filtre sur code_commune (codes postaux en repli) ; la page est tirée
 *   au hasard dans tout le bassin de la commune.
 * - Sans ville : mot-clé au hasard + page aléatoire, partout en France.
 * Ne retourne QUE des restaurants dont l'unité légale ET l'établissement
 * du siège (SIRET) sont encore en activité ("A" dans la base Sirene).
 */
export async function drawActiveRestaurants(
  ville?: string,
): Promise<DiscoveredRestaurant[]> {
  const saisie = ville?.trim() ?? "";
  const cible = saisie.length >= 2 ? await resolveCommune(saisie) : null;

  if (saisie.length >= 2) {
    if (!cible) return [];

    const first = await queryRestaurants(
      filtersVille({ code_commune: cible.codeInsee }),
    );
    const drawn =
      first.restaurants.length > 0
        ? first
        : await queryRestaurants(
            cible.codesPostaux.length > 0
              ? filtersVille({ code_postal: cible.codesPostaux.join(",") })
              : filtersVille({ code_commune: cible.codeInsee }),
          );
    if (drawn.restaurants.length === 0) return [];

    // Page au hasard dans tout le bassin (borné par la limite API).
    const totalPages = Math.min(drawn.totalPages, MAX_PAGE_VILLE);
    if (totalPages <= 1) return drawn.restaurants;

    const page = 2 + Math.floor(Math.random() * (totalPages - 1));
    const random = await queryRestaurants(
      filtersVille({ code_commune: cible.codeInsee, page: String(page) }),
    );
    return random.restaurants.length > 0 ? random.restaurants : drawn.restaurants;
  }

  // Mode national : mot-clé au hasard + page aléatoire.
  const keyword = KEYWORDS[Math.floor(Math.random() * KEYWORDS.length)];
  const page = 1 + Math.floor(Math.random() * MAX_PAGE);
  const params = new URLSearchParams();
  params.set("q", keyword);
  params.set("activite_principale", NAF_RESTAURATION);
  params.set("per_page", String(PER_PAGE));
  params.set("page", String(page));
  return (await queryRestaurants(params)).restaurants;
}
