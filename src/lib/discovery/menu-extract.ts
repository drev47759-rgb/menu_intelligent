/**
 * Extraction heuristique d'une carte depuis le HTML d'une page menu :
 * une ligne plat ressemble à « Nom du plat … 12,50 € ».
 */

export interface RawDish {
  name: string;
  price: number;
  category: string;
}

/** Prix en euros en fin de ligne : « 12,50 € », « 18€ », « 12.5 EUR ». */
export const PRICE_RE = /(\d{1,3}(?:[.,]\d{1,2})?)\s*(?:€|eur\b|euros\b)/i;

/** Texte d'une page découpé en lignes (les balises de bloc deviennent \\n). */
export function htmlToLines(html: string): string[] {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(
      /<\/(p|div|li|tr|td|th|h[1-6]|section|article|ul|ol|table|figcaption|blockquote)>/gi,
      "\n",
    )
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function normalize(line: string): string {
  return line
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** Intitulés de rubrique reconnus sur une carte ( Entrées , Plats , …). */
const CATEGORY_RULES: Array<[RegExp, string]> = [
  [/^(nos |les |la |notre )?(entrees?|pour commencer|to start|starters?)\b/, "Entrées"],
  [/^(nos |les |la |notre )?(plats?|dishes|mains?)\b/, "Plats"],
  [/^(nos |les |la |notre )?(desserts?|douceurs)\b/, "Desserts"],
  [
    /^(nos |les |la |notre )?(boissons?|drinks?|la cave|vins?|aperitifs?|cafes?|thes?|eaux)\b/,
    "Boissons",
  ],
  [/^(nos |les |la |notre )?(menus?|formules?|suggestions?)\b/, "Menus"],
];

function detectHeading(line: string): string | null {
  const norm = normalize(line);
  if (norm.length === 0 || norm.length > 42) return null;
  if (PRICE_RE.test(line)) return null;
  for (const [re, category] of CATEGORY_RULES) {
    if (re.test(norm)) return category;
  }
  return null;
}

/**
 * Analyse les lignes d'une page carte : chaque ligne portant un prix €
 * devient un plat. Heuristique volontairement prudente (plafonnée à 80
 * plats, lignes parasites exclues) : les cartes réelles sont irrégulières.
 */
export function parseRawDishes(lines: string[]): RawDish[] {
  const out: RawDish[] = [];
  const seen = new Set<string>();
  let category: string | null = null;

  for (const line of lines) {
    const heading = detectHeading(line);
    if (heading) {
      category = heading;
      continue;
    }
    const match = PRICE_RE.exec(line);
    if (!match) continue;
    if (category === null) category = "La carte";

    let name = line.slice(0, match.index).trim();
    name = name.replace(/[\s.·•\-–—_*]+$/g, "");
    name = name.replace(/^\s*(?:\d+[.)]|[•·*\-–—]+)\s*/, "");
    if (name.length < 3 || name.length > 90) continue;
    if (
      /^(total|tva|prix|livraison|service|commande|sous-total|compte)\b/i.test(
        name,
      )
    ) {
      continue;
    }

    const price = Number(match[1].replace(",", "."));
    if (!Number.isFinite(price) || price < 1 || price > 500) continue;

    const key = normalize(name).slice(0, 60) + "|" + category;
    if (seen.has(key)) continue;
    seen.add(key);

    out.push({ name, price, category });
    if (out.length >= 80) break;
  }
  return out;
}
