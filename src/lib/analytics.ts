/**
 * Analytics shim — pushes to window.dataLayer (GTM) and console.
 * Ready for Vercel Analytics / GTM without coupling the UI to a vendor.
 */

type MenuEvent =
  | "page_view"
  | "search"
  | "filter_used"
  | "dish_view"
  | "click_reserve"
  | "click_order"
  | "click_call"
  | "click_directions"
  | "meal_add"
  | "meal_remove";

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

export function track(
  event: MenuEvent,
  payload: Record<string, unknown> = {},
): void {
  const entry = {
    event,
    ts: Date.now(),
    ...payload,
  };
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push(entry);
  if (import.meta.env.DEV) {
    console.info("[analytics]", entry);
  }
}
