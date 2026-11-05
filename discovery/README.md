PLACEHOLDER_README

## Bouton « J'ai de la chance » (interface)

La page d'accueil embarque un bouton **J'ai de la chance**
(`src/components/discovery/LuckyDiscovery.tsx`), branché sur la route
`/api/discovery` (`src/lib/discovery/`).

- Tirage aléatoire côté serveur via l'API Recherche d'entreprises :
  **SIRET du siège en activité uniquement** (état administratif « A »
  requis pour l'unité légale ET l'établissement — un SIRET fermé est exclu).
- Recherche des informations du restaurant sur le **site officiel**,
  **Uber Eats**, **Deliveroo** et **TripAdvisor** (page directe du
  restaurant si trouvable, sinon recherche préremplie, signalée).
- Vérification d'officialité : SIRET, sinon SIREN, sinon adresse étendue
  du SIRET — dans la page Mentions légales ou le footer. Le badge affiché
  distingue un site vérifié d'un site non vérifié.
- **Menu PDF uniquement** : un restaurant dont le menu n'existe qu'au
  format PDF est signalé par une **icône distinctive** — badge ambre
  « Menu PDF uniquement » (icône document) + liens directs vers les PDF.
