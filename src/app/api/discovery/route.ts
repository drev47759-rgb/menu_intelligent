import { NextResponse } from "next/server";
import { discoverLuckyRestaurant } from "@/lib/discovery/discover";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Bouton « J'ai de la chance » : tirage d'un restaurant actif,
 * hors ceux déjà enregistrés dans la liste de l'utilisateur (exclude). */
export async function GET(request: Request) {
  const exclude = (new URL(request.url).searchParams.get("exclude") ?? "")
    .split(",")
    .map((siret) => siret.trim())
    .filter(Boolean);
  try {
    const result = await discoverLuckyRestaurant({ deadlineMs: 45_000, exclude });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Le tirage n'a abouti à aucun restaurant. Réessayez." },
      { status: 503 },
    );
  }
}
