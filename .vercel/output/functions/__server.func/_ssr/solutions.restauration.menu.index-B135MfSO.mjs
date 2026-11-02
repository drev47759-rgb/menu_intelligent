import { r as restaurants } from "./restaurants-B3HizIOi.mjs";
import { x as require_jsx_runtime, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { p as ArrowRight } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/solutions.restauration.menu.index-B135MfSO.js
var import_jsx_runtime = require_jsx_runtime();
function MenuIndex() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto min-h-screen max-w-6xl px-4 py-12 sm:px-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-semibold tracking-[0.16em] text-accent uppercase",
				children: "Restauration"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-2 font-display text-4xl text-ink",
				children: "Menus intelligents"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 max-w-xl text-sm text-ink-muted",
				children: "Choisissez une maison, filtrez selon vos contraintes, estimez l’addition."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-8 grid gap-4 sm:grid-cols-3",
				children: restaurants.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/solutions/restauration/menu/$nomDuRestaurant",
					params: { nomDuRestaurant: r.slug },
					className: "flex h-full flex-col rounded-xl bg-paper p-5 shadow-border hover:shadow-border-hover",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-semibold text-accent uppercase",
							children: r.city
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "mt-1 font-display text-2xl",
							children: r.name
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 flex-1 text-sm text-ink-muted",
							children: r.tagline
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-4 inline-flex items-center gap-1 text-sm font-semibold",
							children: ["Voir le menu ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, {
								className: "size-4",
								"aria-hidden": true
							})]
						})
					]
				}) }, r.slug))
			})
		]
	});
}
//#endregion
export { MenuIndex as component };
