import type { DiscoveredRestaurant } from "@/types/discovery";

/**
 * API Recherche d'entreprises — données Sirene (INSEE) publiées sur
 * data.gouv.fr. Gratuite, sans authentification.
 */
const API_SEARCH = "https://recherche-entreprises.api.gouv.fr/search";
const NAF_RESTAURATION = "56.10A";
const PER_PAGE = 5;
/** Limite de l'API : page x per_page <= 10 000. */
const MAX_PAGE = 10000 / PER_PAGE;

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
}

/**
 * Tirage aléatoire d'un lot de restaurants (NAF 56.10A).
 * Ne retourne QUE des restaurants dont l'unité légale ET l'établissement
 * du siège (SIRET) sont encore en activité ("A" dans la base Sirene).
 */
export async function drawActiveRestaurants(): Promise<DiscoveredRestaurant[]> {
  const keyword = KEYWORDS[Math.floor(Math.random() * KEYWORDS.length)];
  const page = 1 + Math.floor(Math.random() * MAX_PAGE);
  const url =
    API_SEARCH +
    "?q=" +
    encodeURIComponent(keyword) +
    "&activite_principale=" +
    NAF_RESTAURATION +
    "&per_page=" +
    PER_PAGE +
    "&page=" +
    page;

  try {
    const res = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
      headers: { "Accept-Language": "fr" },
    });
    if (!res.ok) return [];
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
    return out;
  } catch {
    return [];
  }
}
