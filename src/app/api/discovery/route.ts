import { NextResponse } from "next/server";
import { discoverLuckyRestaurant } from "@/lib/discovery/discover";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Bouton « J'ai de la chance » : tirage d'un restaurant actif.
 * Paramètres : ville (ciblage communal, optionnel) et exclude (SIRET déjà
 * enregistrés, pour ne jamais retomber sur un restaurant déjà listé).
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const exclude = (params.get("exclude") ?? "")
    .split(",")
    .map((siret) => siret.trim())
    .filter(Boolean);
  const ville = (params.get("ville") ?? "").trim().slice(0, 80);

  try {
    const result = await discoverLuckyRestaurant({
      deadlineMs: 45_000,
      exclude,
      ville: ville.length > 0 ? ville : undefined,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "VILLE_INCONNUE") {
      return NextResponse.json(
        { error: "Ville introuvable — vérifiez l'orthographe (ex. Strasbourg, Lyon, Bordeaux…)." },
        { status: 400 },
      );
    }
    if (message === "VILLE_EPUISEE") {
      return NextResponse.json(
        { error: "Tous les restaurants actifs de cette ville sont déjà dans votre liste." },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Le tirage n'a abouti à aucun restaurant. Réessayez." },
      { status: 503 },
    );
  }
}
