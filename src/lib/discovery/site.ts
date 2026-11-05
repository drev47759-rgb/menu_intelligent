import type { DiscoveredRestaurant, MenuFormat, VerificationInfo } from "@/types/discovery";
import { htmlToLines, parseRawDishes, type RawDish } from "./menu-extract";
import { extractRawDishesFromPdfs } from "./pdf-menu";
import { fetchText, safeHost } from "./websearch";

const MENTIONS_HINT = /mentions?[-\s]?l[eé]gales?|legal-notice/i;
const MENU_HINT = /carte|menu|menus|plats|desserts|entr|food|gastronom/i;

/** Extraction texte minimale (pas de DOM côté serveur). */
export function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?\s*>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[\t ]+/g, " ");
}

/** Normalisation accents/casse pour comparer adresses et pages. */
export function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();
}

export function extractLinks(html: string, base: string): string[] {
  const out: string[] = [];
  const re = /href=["']([^"']+)["']/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    const href = match[1].replace(/&amp;/g, "&");
    if (/^(#|javascript:|mailto:|tel:)/i.test(href)) continue;
    try {
      out.push(new URL(href, base).href);
    } catch {
      // URL invalide : ignorée.
    }
  }
  return out;
}

/**
 * Vérification d'officialité : le SIRET (à défaut le SIREN, à défaut
 * l'adresse étendue normalisée) doit apparaître dans la page Mentions
 * légales ou dans le texte de la page d'accueil (footer inclus).
 */
export async function verifyOfficial(
  siteUrl: string,
  restaurant: DiscoveredRestaurant,
): Promise<VerificationInfo> {
  const home = await fetchText(siteUrl);
  if (!home) {
    return { statut: "non-verifie", methode: null, page: null };
  }

  const pages: Array<{ url: string; html: string }> = [
    { url: siteUrl, html: home },
  ];
  const seen = new Set<string>([siteUrl]);
  let fetchedMentions = 0;
  for (const link of extractLinks(home, siteUrl)) {
    if (fetchedMentions >= 2 || seen.has(link)) continue;
    if (!MENTIONS_HINT.test(link)) continue;
    seen.add(link);
    const page = await fetchText(link);
    fetchedMentions += 1;
    if (page) pages.push({ url: link, html: page });
  }

  const siret = restaurant.siret.replace(/\s/g, "");
  const siren = restaurant.siren.replace(/\s/g, "");
  const commune = normalizeText(restaurant.commune);
  const codePostal = normalizeText(restaurant.codePostal);
  const voie = restaurant.libelleVoie ? normalizeText(restaurant.libelleVoie) : null;
  const numero = restaurant.numeroVoie ? normalizeText(restaurant.numeroVoie) : null;

  for (const page of pages) {
    const text = stripTags(page.html);
    const compact = text.replace(/\s+/g, "");
    if (compact.includes(siret)) {
      return { statut: "verifie", methode: "siret", page: page.url };
    }
    if (compact.includes(siren)) {
      return { statut: "verifie", methode: "siren", page: page.url };
    }
    const normText = " " + normalizeText(text) + " ";
    const adresseEtendueOk =
      commune !== "" &&
      codePostal !== "" &&
      normText.includes(" " + commune + " ") &&
      normText.includes(" " + codePostal + " ") &&
      ((voie !== null && normText.includes(" " + voie + " ")) ||
        (numero !== null && normText.includes(" " + numero + " ")));
    if (adresseEtendueOk) {
      return { statut: "verifie", methode: "adresse-etendue", page: page.url };
    }
  }
  return { statut: "non-verifie", methode: null, page: null };
}

/** Résultat de l'exploration du menu sur le site officiel. */
export interface MenuExploration {
  format: MenuFormat;
  /** Liens PDF trouvés (carte, menus, brochures). */
  pdfs: string[];
  /** Plats extraits automatiquement (HTML d'abord, PDF ensuite). */
  rawDishes: RawDish[];
}

/**
 * Exploration du menu officiel : parcours en largeur des pages carte/menu
 * (8 pages max, même domaine). Peuplement automatique, sans action de
 * l'utilisateur :
 * 1. plats extraits de chaque page visitée (une carte tient parfois dans
 *    la page d'accueil) ;
 * 2. si rien n'a été trouvé et que des PDF existent, les plats sont
 *    extraits directement DANS les PDF (décompression + lecture des
 *    opérateurs texte, voir pdf-menu.ts).
 * Formats : "pdf" (menu seulement en PDF — plats extraits du PDF),
 * "mixte", "html", "inconnu".
 */
export async function exploreMenu(
  siteUrl: string,
): Promise<MenuExploration> {
  const host = safeHost(siteUrl);
  if (!host) return { format: "inconnu", pdfs: [], rawDishes: [] };

  const queue: string[] = [siteUrl];
  const seen = new Set<string>();
  const pdfs: string[] = [];
  const dishKeys = new Set<string>();
  const rawDishes: RawDish[] = [];
  let menuPages = 0;
  let visited = 0;

  const addDishes = (found: RawDish[]): void => {
    for (const raw of found) {
      const key = raw.name.toLowerCase() + "|" + raw.category;
      if (dishKeys.has(key)) continue;
      dishKeys.add(key);
      rawDishes.push(raw);
    }
  };

  while (queue.length > 0 && visited < 8) {
    const url = queue.shift();
    if (!url) break;
    if (seen.has(url)) continue;
    seen.add(url);
    if (safeHost(url) !== host) continue;
    const html = await fetchText(url);
    if (html === null) continue;
    visited += 1;
    if (MENU_HINT.test(url)) menuPages += 1;
    addDishes(parseRawDishes(htmlToLines(html)));
    for (const link of extractLinks(html, url)) {
      if (/\.pdf($|\?|#)/i.test(link)) {
        if (!pdfs.includes(link)) pdfs.push(link);
      } else if (safeHost(link) === host && MENU_HINT.test(link) && !seen.has(link)) {
        queue.push(link);
      }
    }
  }

  if (rawDishes.length === 0 && pdfs.length > 0) {
    addDishes(await extractRawDishesFromPdfs(pdfs));
  }

  if (pdfs.length > 0 && menuPages === 0) return { format: "pdf", pdfs, rawDishes };
  if (pdfs.length > 0) return { format: "mixte", pdfs, rawDishes };
  if (menuPages > 0) return { format: "html", pdfs, rawDishes };
  return { format: "inconnu", pdfs, rawDishes };
}
