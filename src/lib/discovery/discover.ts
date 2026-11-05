import type {
  DiscoveryResult,
  DiscoveredRestaurant,
  PlatformLink,
  VerificationInfo,
} from "@/types/discovery";
import { drawActiveRestaurants } from "./datagouv";
import { findOfficialSiteCandidates, findPlatformLink } from "./websearch";
import { detectMenuFormat, verifyOfficial } from "./site";

const SOURCE =
  "Tirage aléatoire — API Recherche d'entreprises (données Sirene, data.gouv.fr), NAF 56.10A, établissements en activité uniquement.";

const MAX_ATTEMPTS = 10;

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
 * 1. tirage Sirene — SIRET du siège en activité uniquement ;
 * 2. recherche du site officiel puis vérification par le SIRET
 *    (ou l'adresse étendue) dans les mentions légales ou le footer ;
 * 3. détection du format du menu (PDF uniquement = signalé dans l'UI) ;
 * 4. recherche du restaurant sur Uber Eats, Deliveroo et TripAdvisor.
 * Renvoie le premier restaurant dont le site est vérifié ; à défaut, le
 * dernier restaurant actif tiré (site non vérifié), sans jamais lever
 * d'erreur tant qu'un établissement actif a été tiré.
 */
export async function discoverLuckyRestaurant(
  options: { deadlineMs?: number } = {},
): Promise<DiscoveryResult> {
  const deadline = Date.now() + (options.deadlineMs ?? 40_000);
  let fallback: DiscoveryResult | null = null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS && Date.now() < deadline; attempt++) {
    const candidates = await drawActiveRestaurants();
    const candidate = candidates[Math.floor(Math.random() * candidates.length)];
    if (!candidate) {
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

    const menu = siteOfficiel
      ? await detectMenuFormat(siteOfficiel)
      : { format: "inconnu" as const, pdfs: [] as string[] };

    const result: DiscoveryResult = {
      restaurant: candidate,
      siteOfficiel,
      verification,
      menuFormat: menu.format,
      menusPdf: menu.pdfs.slice(0, 4),
      plateformes: [],
      source: SOURCE,
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
  throw new Error("Aucun restaurant actif tire au sort.");
}
