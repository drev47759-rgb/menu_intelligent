import { inflateSync } from "node:zlib";
import { parseRawDishes, PRICE_RE, type RawDish } from "./menu-extract";
import { fetchBytes } from "./websearch";

/**
 * Extraction automatique des plats depuis un menu PDF — côté serveur,
 * sans dépendance : les flux compressés (FlateDecode) sont décompressés
 * via node:zlib, puis les opérateurs d'affichage de texte (Tj / TJ) sont
 * lus directement. L'utilisateur n'a jamais à ouvrir le PDF : le menu est
 * peuplé automatiquement, comme pour les cartes HTML.
 *
 * Best-effort : les PDFs exotiques (polices CID, texte en images)
 * produisent simplement zéro plat et retombent sur les liens PDF.
 */

const MAX_PDF_BYTES = 2_500_000;
const MAX_STREAMS = 30;

/** Décodage WinAnsi (CP1252) : accents français des cartes. */
function decode(bytes: Uint8Array): string {
  return new TextDecoder("windows-1252").decode(bytes);
}

function unescapePdfString(text: string): string {
  return text
    .replace(/\\(\d{1,3})/g, (_, oct: string) =>
      String.fromCharCode(parseInt(oct, 8)),
    )
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\b/g, "\b")
    .replace(/\\f/g, "\f")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\\/g, "\\");
}

/** Lignes affichées par les opérateurs PDF Tj / TJ (chaîne op = une ligne). */
function extractShownLines(content: string): string[] {
  const lines: string[] = [];
  const opRe =
    /\[(?:[^\]\\]|\((?:\\.|[^\\()])*\)|\\[\]])*\]\s*TJ|\((?:\\.|[^\\()])*\)\s*(?:Tj|')/g;
  let match: RegExpExecArray | null;
  while ((match = opRe.exec(content)) !== null) {
    const parts: string[] = [];
    const strRe = /\((?:\\.|[^\\()])*\)/g;
    let s: RegExpExecArray | null;
    while ((s = strRe.exec(match[0])) !== null) {
      parts.push(unescapePdfString(s[0].slice(1, -1)));
    }
    const line = parts.join(" ").replace(/\s+/g, " ").trim();
    if (line !== "") lines.push(line);
  }
  return lines;
}

/**
 * Un même plat est souvent éclaté en deux opérateurs (nom, puis prix) :
 * « Choucroute royale » + « 18,50 € » → « Choucroute royale 18,50 € ».
 */
function mergePriceFragments(lines: string[]): string[] {
  const merged: string[] = [];
  for (const line of lines) {
    const prev = merged.length > 0 ? merged[merged.length - 1] : null;
    if (
      prev !== null &&
      !PRICE_RE.test(prev) &&
      /^\s*[\d]/.test(line) &&
      PRICE_RE.test(line)
    ) {
      merged[merged.length - 1] = (prev + " " + line)
        .replace(/\s+/g, " ")
        .trim();
      continue;
    }
    merged.push(line);
  }
  return merged;
}

/** Toutes les lignes de texte d'un PDF, dans l'ordre du fichier. */
function pdfTextLines(bytes: Uint8Array): string[] {
  const raw = decode(bytes);
  const lines: string[] = [];
  const re = /(?:^|[\\s>])stream(?:\r\n|\n|\r)/g;
  let match: RegExpExecArray | null;
  let streams = 0;

  while ((match = re.exec(raw)) !== null && streams < MAX_STREAMS) {
    const start = match.index + match[0].length;
    const end = raw.indexOf("endstream", start);
    if (end === -1) break;
    streams += 1;
    re.lastIndex = end;

    const header = raw.slice(Math.max(0, match.index - 300), match.index);
    let contentBytesEnd = end;
    while (contentBytesEnd > start && /[\r\n\s]/.test(raw[contentBytesEnd - 1])) {
      contentBytesEnd -= 1;
    }
    const slice = bytes.subarray(start, contentBytesEnd);
    if (slice.length === 0) continue;

    let content: string | null = null;
    if (header.includes("/FlateDecode")) {
      try {
        content = decode(inflateSync(slice));
      } catch {
        content = null;
      }
    } else {
      content = raw.slice(start, contentBytesEnd);
    }
    if (content !== null && (content.includes("Tj") || content.includes("TJ"))) {
      for (const line of extractShownLines(content)) lines.push(line);
    }
  }
  return mergePriceFragments(lines);
}

/**
 * Télécharge les menus PDF du restaurant et en extrait les plats,
 * automatiquement — jusqu'à 2 PDF, 80 plats.
 */
export async function extractRawDishesFromPdfs(
  pdfs: string[],
): Promise<RawDish[]> {
  const out: RawDish[] = [];
  const seen = new Set<string>();

  for (const url of pdfs.slice(0, 2)) {
    const bytes = await fetchBytes(url);
    if (bytes === null || bytes.length === 0 || bytes.length > MAX_PDF_BYTES) {
      continue;
    }
    for (const raw of parseRawDishes(pdfTextLines(bytes))) {
      const key = raw.name.toLowerCase() + "|" + raw.category;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(raw);
      if (out.length >= 80) return out;
    }
  }
  return out;
}
