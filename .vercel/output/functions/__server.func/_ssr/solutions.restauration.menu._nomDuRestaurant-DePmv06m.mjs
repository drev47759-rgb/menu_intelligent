import { n as restaurantSlugs } from "./restaurants-B3HizIOi.mjs";
import { x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/solutions.restauration.menu._nomDuRestaurant-DePmv06m.js
var import_jsx_runtime = require_jsx_runtime();
function MenuNotFound() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 px-6 text-center text-ink",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-3xl",
				children: "Restaurant introuvable"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm text-ink-muted",
				children: [
					"Ce menu n’est pas dans le catalogue. Maisons disponibles :",
					" ",
					restaurantSlugs.join(", "),
					"."
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
				href: "/",
				className: "min-h-11 rounded-full bg-ink px-5 text-sm font-semibold leading-11 text-cream",
				children: "Retour"
			})
		]
	});
}
//#endregion
export { MenuNotFound as notFoundComponent };
