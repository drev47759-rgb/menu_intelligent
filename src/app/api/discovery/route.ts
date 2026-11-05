import { NextResponse } from "next/server";
import { discoverLuckyRestaurant } from "@/lib/discovery/discover";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Bouton « J'ai de la chance » : tirage aléatoire d'un restaurant actif. */
export async function GET() {
  try {
    const result = await discoverLuckyRestaurant({ deadlineMs: 45_000 });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Le tirage n'a abouti à aucun restaurant. Réessayez." },
      { status: 503 },
    );
  }
}
