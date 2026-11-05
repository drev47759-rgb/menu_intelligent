import type {
  DiscoveryResult,
  DiscoveredRestaurant,
  MenuFormat,
  PlatformLink,
  VerificationInfo,
} from "@/types/discovery";
import { drawActiveRestaurants } from "./datagouv";
import { findOfficialSiteCandidates, findPlatformLink } from "./websearch";
import { verifyOfficial, exploreMenu, type MenuExploration } from "./site";
import { buildCatalog } from "./mapping";

const SOURCE =
  "Tirage aléatoire — API Recherche d'entreprises (données Sirene, data.gouv.fr), NAF 56.10A, établissements en activité uniquement.";

const MAX_ATTEMPTS = 10;
/** Pages tirées au hasard dont tous les restaurants sont déjà enregistrés
 *  avant de conclure que le ciblage (ville ou nom) est épuisé : une seule
 *  page de 25 ne suffit pas, le bassin peut être plus vaste que la liste
 *  de l'utilisateur. */
const MAX_PAGES_EPUISES = 3;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function platformLinksFor(
  restaurant: DiscoveredRestaurant,
): Promise<PlatformLink[]> {
  const results = await Promise.allSettled([
    findPlatformLink("uber-eats", restaurant.nomComplet, restaurant.commune),
    findPlatformLink("deliveroo", restaurant.nomComplet, restaurant.commune),
    findPlatformLink("tripadvisor", restaurant.nomComplet, restaurant.commune),
  ]);
  return results
    .filter(
      (r): r is PromiseFulfilledResult<PlatformLink> => r.status === "fulfilled",
    )
    .map((r) => r.value);
}

/**
 * Découverte d'un restaurant au hasard :
 * 1. tirage Sirene — SIRET du siège en activité uniquement (les SIRET
 *    déjà enregistrés chez l'utilisateur sont exclus via exclude) ;
 *    ciblage optionnel par nom (recherche plein texte sur la
 *    dénomination) et/ou par ville (résolue en commune via l'API Geo),
 *    le tirage reste aléatoire dans tout le bassin visé ;
 * 2. recherche du site officiel puis vérification par le SIRET
 *    (ou l'adresse étendue) dans les mentions légales ou le footer ;
 * 3. exploration automatique du menu : plats extraits des cartes HTML,
 *    sinon directement depuis les PDF (jamais à la main) ;
 * 4. catalogue complet (Restaurant + Dish) — le restaurant rejoint la
 *    liste avec les mêmes actions que les maisons préchargées ;
 * 5. recherche du restaurant sur Uber Eats, Deliveroo et TripAdvisor.
 * Renvoie le premier restaurant dont le site est vérifié ; à défaut, le
 * dernier restaurant actif tiré (site non vérifié), sans jamais lever
 * d'erreur tant qu'un établissement actif a été tiré.
 */
export async function discoverLuckyRestaurant(
  options: {
    deadlineMs?: number;
    exclude?: string[];
    ville?: string;
    nom?: string;
  } = {},
): Promise<DiscoveryResult> {
  const deadline = Date.now() + (options.deadlineMs ?? 40_000);
  const excluded = new Set(options.exclude ?? []);
  const saisieVille = options.ville?.trim() ?? "";
  const ville = saisieVille.length >= 2 ? saisieVille : undefined;
  const saisieNom = options.nom?.trim() ?? "";
  const nom = saisieNom.length >= 2 ? saisieNom : undefined;
  let fallback: DiscoveryResult | null = null;
  let vides = 0;
  let videsNom = 0;
  let epuisees = 0;

  for (let attempt = 0; attempt < MAX_ATTEMPTS && Date.now() < deadline; attempt++) {
    const drawn = await drawActiveRestaurants(ville, nom);
    const pool = drawn.filter((c) => !excluded.has(c.siret));
    const candidate = pool[Math.floor(Math.random() * pool.length)];
    if (!candidate) {
      if (drawn.length > 0 && (ville !== undefined || nom !== undefined)) {
        // Cette page tirée au hasard ne contient que des restaurants déjà
        // enregistrés : on retente d'autres pages avant de conclure.
        epuisees += 1;
        if (epuisees >= MAX_PAGES_EPUISES) {
          throw new Error(
            nom !== undefined ? "NOM_EPUISE" : "VILLE_EPUISEE",
          );
        }
        await delay(200);
        continue;
      }
      if (nom !== undefined) {
        // Nom ciblé sans aucun restaurant actif correspondant (éventuel
        // bornage ville) : inutile d'insister, la recherche est
        // déterministe.
        videsNom += 1;
        if (videsNom >= 2) throw new Error("NOM_SANS_RESULTAT");
      } else if (ville !== undefined) {
        vides += 1;
        if (vides >= 2) throw new Error("VILLE_INCONNUE");
      }
      await delay(400);
      continue;
    }

    const siteCandidates = await findOfficialSiteCandidates(
      candidate.nomComplet,
      candidate.commune,
    );

    let siteOfficiel: string | null = null;
    let verification: VerificationInfo = {
      statut: "non-verifie",
      methode: null,
      page: null,
    };
    for (const siteUrl of siteCandidates.slice(0, 3)) {
      const v = await verifyOfficial(siteUrl, candidate);
      if (v.statut === "verifie") {
        siteOfficiel = siteUrl;
        verification = v;
        break;
      }
    }

    const menu: MenuExploration = siteOfficiel
      ? await exploreMenu(siteOfficiel)
      : { format: "inconnu" as MenuFormat, pdfs: [], rawDishes: [] };

    const catalogue = buildCatalog(candidate, siteOfficiel, verification, menu);

    const result: DiscoveryResult = {
      restaurant: candidate,
      siteOfficiel,
      verification,
      menuFormat: menu.format,
      menusPdf: menu.pdfs.slice(0, 4),
      plateformes: [],
      source: SOURCE,
      catalogue,
    };

    if (verification.statut === "verifie") {
      result.plateformes = await platformLinksFor(candidate);
      return result;
    }
    fallback ??= result;
    await delay(300);
  }

  if (fallback) {
    fallback.plateformes = await platformLinksFor(fallback.restaurant);
    return fallback;
  }
  throw new Error("Aucun restaurant actif tiré au sort.");
}
