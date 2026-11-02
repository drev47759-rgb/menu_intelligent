import { r as restaurants } from "./restaurants-B3HizIOi.mjs";
import { x as require_jsx_runtime, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as SlidersHorizontal, n as UtensilsCrossed, p as ArrowRight, s as Search } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-BvdcmOkU.js
var import_jsx_runtime = require_jsx_runtime();
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-cream text-ink",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
				href: "#restaurants",
				className: "skip-link",
				children: "Aller aux restaurants"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
				className: "border-b border-line",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-2xl",
						children: "Menu Intelligent"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "hidden text-sm text-ink-muted sm:block",
						children: "Avant la visite, pas après l’addition"
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-semibold tracking-[0.18em] text-accent uppercase",
						children: "Restauration"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-3 max-w-3xl font-display text-5xl leading-[1.05] text-balance sm:text-6xl",
						children: "La carte, comme un outil de décision."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-5 max-w-xl text-lg leading-normal text-ink-muted",
						children: "Est-ce que ça me plaît, est-ce que ça passe mes contraintes, combien je vais payer — et que faire maintenant."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "border-y border-line bg-paper",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3 sm:px-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Step, {
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
								className: "size-5",
								"aria-hidden": true
							}),
							title: "Chercher",
							text: "Nom, description, ingrédients — résultats instantanés."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Step, {
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SlidersHorizontal, {
								className: "size-5",
								"aria-hidden": true
							}),
							title: "Filtrer",
							text: "Régime, budget, piquant, disponibilité. Combinables."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Step, {
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UtensilsCrossed, {
								className: "size-5",
								"aria-hidden": true
							}),
							title: "Estimer",
							text: "Entrée + plat + dessert. Puis réserver, appeler, y aller."
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				id: "restaurants",
				className: "mx-auto max-w-6xl px-4 py-16 sm:px-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-3xl",
						children: "Trois maisons"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 max-w-xl text-sm text-ink-muted",
						children: "Données reprises à l’identique des cartes publiées. Prix en euros, TTC."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-8 grid gap-6 lg:grid-cols-3",
						children: restaurants.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/solutions/restauration/menu/$nomDuRestaurant",
							params: { nomDuRestaurant: r.slug },
							className: "group flex h-full flex-col overflow-hidden rounded-2xl bg-paper shadow-border transition-shadow duration-(--motion-fast) hover:shadow-border-hover",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: r.image,
								alt: r.imageAlt,
								className: "h-48 w-full object-cover"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-1 flex-col p-5",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs font-semibold tracking-wide text-accent uppercase",
										children: r.city
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "mt-1 font-display text-2xl",
										children: r.name
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 text-sm text-ink-muted italic",
										children: r.tagline
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-3 flex-1 text-sm text-ink-soft",
										children: r.priceHint
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "mt-4 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-ink",
										children: ["Voir le menu", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-4 transition-transform group-hover:translate-x-0.5" })]
									})
								]
							})]
						}) }, r.slug))
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("footer", {
				className: "border-t border-line py-8 text-center text-xs text-ink-subtle",
				children: "Menu Intelligent — interface de décision avant visite. L’abus d’alcool est dangereux pour la santé."
			})
		]
	});
}
function Step({ icon, title, text }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mb-3 grid size-10 place-items-center rounded-full bg-cream text-ink",
			children: icon
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "font-display text-xl",
			children: title
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-sm leading-normal text-ink-muted",
			children: text
		})
	] });
}
//#endregion
export { Home as component };
