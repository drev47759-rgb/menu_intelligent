import type { RestaurantCatalog } from "@/types/menu";

/** Types du module de découverte aléatoire (bouton « J'ai de la chance »). */

/** Format de menu détecté sur le site officiel du restaurant. */
export type MenuFormat = "pdf" | "html" | "mixte" | "inconnu";

export interface DiscoveredRestaurant {
  /** Dénomination de l'unité légale (Sirene). */
  nomComplet: string;
  siren: string;
  /** SIRET du siège — garanti en activité par le pipeline. */
  siret: string;
  naf: string;
  /** Toujours true : le pipeline ne retient que des établissements actifs. */
  actif: boolean;
  /** Adresse étendue du SIRET : complément + adresse Sirene. */
  adresseEtendue: string;
  numeroVoie: string | null;
  libelleVoie: string | null;
  codePostal: string;
  commune: string;
  enseigne: string | null;
}

export interface VerificationInfo {
  statut: "verifie" | "non-verifie";
  methode: "siret" | "siren" | "adresse-etendue" | null;
  page: string | null;
}

export type Plateforme = "uber-eats" | "deliveroo" | "tripadvisor";

export interface PlatformLink {
  plateforme: Plateforme;
  url: string;
  /** true : page du restaurant ; false : recherche préremplie. */
  direct: boolean;
}

export interface DiscoveryResult {
  restaurant: DiscoveredRestaurant;
  siteOfficiel: string | null;
  verification: VerificationInfo;
  menuFormat: MenuFormat;
  /** Menus PDF trouvés sur le site officiel (URLs). */
  menusPdf: string[];
  plateformes: PlatformLink[];
  source: string;
  /**
   * Catalogue peuplé côté serveur : fiche Restaurant + plats extraits de la
   * carte du site officiel. Intégrable directement dans la liste des
   * restaurants et la page menu (mêmes actions que les maisons préchargées).
   */
  catalogue: RestaurantCatalog;
}
