import { i as __toESM } from "../_runtime.mjs";
import { J as require_react, x as require_jsx_runtime, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as SlidersHorizontal, c as Plus, d as Flame, f as CalendarCheck, i as Trash2, l as Phone, m as ArrowLeft, n as UtensilsCrossed, o as ShoppingBag, s as Search, t as X, u as MapPin } from "../_libs/lucide-react.mjs";
import { n as Route } from "./router-DoayWGu0.mjs";
import { t as clsx } from "../_libs/clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/solutions.restauration.menu._nomDuRestaurant-DCvGR05I.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var DAY_MAP = {
	Lundi: "Monday",
	Mardi: "Tuesday",
	Mercredi: "Wednesday",
	Jeudi: "Thursday",
	Vendredi: "Friday",
	Samedi: "Saturday",
	Dimanche: "Sunday"
};
function offer(price, availability) {
	const schemaAvailability = availability === "unavailable" ? "https://schema.org/OutOfStock" : availability === "seasonal" ? "https://schema.org/LimitedAvailability" : "https://schema.org/InStock";
	return {
		"@type": "Offer",
		price: price.toFixed(2),
		priceCurrency: "EUR",
		availability: schemaAvailability
	};
}
function dietUrls(dish) {
	const urls = [];
	if (dish.dietaryTags.includes("vegan")) urls.push("https://schema.org/VeganDiet");
	else if (dish.dietaryTags.includes("vegetarian")) urls.push("https://schema.org/VegetarianDiet");
	if (dish.dietaryTags.includes("gluten-free")) urls.push("https://schema.org/GlutenFreeDiet");
	if (dish.dietaryTags.includes("halal")) urls.push("https://schema.org/HalalDiet");
	return urls;
}
function toMenuItem(dish) {
	const diets = dietUrls(dish);
	return {
		"@type": "MenuItem",
		name: dish.portion ? `${dish.name} (${dish.portion})` : dish.name,
		description: dish.description || void 0,
		suitableForDiet: diets.length === 1 ? diets[0] : diets.length ? diets : void 0,
		offers: offer(dish.price, dish.availability)
	};
}
function openingHoursSpec(hours) {
	const specs = [];
	for (const h of hours) {
		if (h.open === "Fermé") continue;
		const day = DAY_MAP[h.day];
		if (!day) continue;
		specs.push({
			"@type": "OpeningHoursSpecification",
			dayOfWeek: day,
			opens: h.open,
			closes: h.close === "00:00" ? "23:59" : h.close
		});
	}
	return specs;
}
function buildRestaurantJsonLd(restaurant, dishes) {
	const sections = /* @__PURE__ */ new Map();
	for (const dish of dishes) {
		const key = dish.menuGroup ? `${dish.menuGroup} · ${dish.category}` : dish.category;
		const list = sections.get(key) ?? [];
		list.push(dish);
		sections.set(key, list);
	}
	const hasMenuSection = [...sections.entries()].map(([name, items]) => ({
		"@type": "MenuSection",
		name,
		hasMenuItem: items.map(toMenuItem)
	}));
	const menu = {
		"@type": "Menu",
		name: `Carte — ${restaurant.name}`,
		hasMenuSection
	};
	return {
		"@context": "https://schema.org",
		"@type": "Restaurant",
		name: restaurant.name,
		description: restaurant.description,
		image: restaurant.image,
		telephone: restaurant.phone,
		url: restaurant.website,
		servesCuisine: restaurant.cuisineType,
		priceRange: restaurant.priceHint,
		acceptsReservations: Boolean(restaurant.reservationUrl),
		address: {
			"@type": "PostalAddress",
			streetAddress: restaurant.address,
			addressLocality: restaurant.city,
			addressCountry: "FR"
		},
		openingHoursSpecification: openingHoursSpec(restaurant.hours),
		hasMenu: menu
	};
}
function jsonLdScript(data) {
	return JSON.stringify(data).replace(/</g, "\\u003c");
}
/** Server-safe JSON-LD node — crawlers see Menu / MenuItem / Offer. */
function JsonLd({ restaurant, dishes }) {
	const json = jsonLdScript(buildRestaurantJsonLd(restaurant, dishes));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("script", {
		type: "application/ld+json",
		dangerouslySetInnerHTML: { __html: json }
	});
}
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
function track(event, payload = {}) {
	const entry = {
		event,
		ts: Date.now(),
		...payload
	};
	if (typeof window === "undefined") return;
	window.dataLayer = window.dataLayer ?? [];
	window.dataLayer.push(entry);
}
var euro = new Intl.NumberFormat("fr-FR", {
	style: "currency",
	currency: "EUR"
});
function formatPrice(value) {
	return euro.format(value);
}
function formatPhone(raw) {
	const digits = raw.replace(/\D/g, "");
	if (digits.startsWith("33") && digits.length === 11) {
		const rest = digits.slice(2);
		return `+33 ${rest[0]} ${rest.slice(1, 3)} ${rest.slice(3, 5)} ${rest.slice(5, 7)} ${rest.slice(7, 9)}`;
	}
	return raw;
}
function telHref(raw) {
	return `tel:+${raw.replace(/\D/g, "")}`;
}
function mapsHref(query) {
	return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
}
function isOpenNow(hours, now = /* @__PURE__ */ new Date()) {
	const today = [
		"Dimanche",
		"Lundi",
		"Mardi",
		"Mercredi",
		"Jeudi",
		"Vendredi",
		"Samedi"
	][now.getDay()];
	const minutes = now.getHours() * 60 + now.getMinutes();
	return hours.some((h) => {
		if (h.day !== today || h.open === "Fermé") return false;
		const [oh, om] = h.open.split(":").map(Number);
		const [ch, cm] = h.close.split(":").map(Number);
		let start = oh * 60 + om;
		let end = ch * 60 + cm;
		if (end === 0) end = 1440;
		return minutes >= start && minutes <= end;
	});
}
function isLunchTime(now = /* @__PURE__ */ new Date()) {
	const m = now.getHours() * 60 + now.getMinutes();
	return m >= 660 && m < 960;
}
function ActionButtons({ restaurant, variant = "header", className }) {
	const call = telHref(restaurant.phone);
	const maps = mapsHref(restaurant.mapsQuery);
	const reserve = restaurant.reservationUrl ?? call;
	const order = restaurant.orderUrl ?? call;
	const baseBtn = "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors duration-(--motion-quick) ease-(--ease-out) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
	const primary = "bg-accent text-accent-fg hover:bg-accent-hover";
	const secondary = "bg-cream text-ink shadow-border hover:shadow-border-hover";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
		"aria-label": "Actions",
		className: cn("flex flex-wrap gap-2", variant === "bar" && "w-full", className),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
				href: reserve,
				className: cn(baseBtn, primary, variant === "bar" && "flex-1"),
				onClick: () => track("click_reserve", { restaurant: restaurant.slug }),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarCheck, {
					className: "size-4",
					"aria-hidden": true
				}), "Réserver"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
				href: order,
				className: cn(baseBtn, secondary),
				onClick: () => track("click_order", { restaurant: restaurant.slug }),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShoppingBag, {
					className: "size-4",
					"aria-hidden": true
				}), "Commander"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
				href: call,
				className: cn(baseBtn, secondary),
				onClick: () => track("click_call", { restaurant: restaurant.slug }),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, {
					className: "size-4",
					"aria-hidden": true
				}), "Appeler"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
				href: maps,
				target: "_blank",
				rel: "noreferrer",
				className: cn(baseBtn, secondary),
				onClick: () => track("click_directions", { restaurant: restaurant.slug }),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, {
					className: "size-4",
					"aria-hidden": true
				}), "Itinéraire"]
			})
		]
	});
}
function normalize(s) {
	return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}
function categorySlug(name) {
	return normalize(name).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "categorie";
}
function matchesQuery(dish, query) {
	if (!query.trim()) return true;
	const hay = normalize([
		dish.name,
		dish.description,
		dish.category,
		dish.menuGroup ?? "",
		dish.portion ?? "",
		...dish.ingredients ?? [],
		...dish.allergens
	].join(" "));
	return query.split(/\s+/).filter(Boolean).map(normalize).every((token) => hay.includes(token));
}
function availabilityMatches(dish, selected) {
	if (selected.length === 0) return true;
	return selected.some((flag) => {
		if (flag === "seasonal") return dish.availability === "seasonal";
		if (flag === "tonight") return dish.availability === "available" || dish.availability === "evening-only" || dish.availability === "seasonal";
		if (dish.availability === "unavailable") return false;
		if (dish.availability === "lunch-only") return isLunchTime();
		if (dish.availability === "evening-only") return !isLunchTime();
		return dish.availability === "available" || dish.availability === "seasonal";
	});
}
function filterDishes(dishes, filters) {
	return dishes.filter((dish) => {
		if (!matchesQuery(dish, filters.query)) return false;
		if (filters.menuGroup && !filters.query.trim()) {
			if (dish.menuGroup !== filters.menuGroup) return false;
		}
		if (filters.categories.length > 0 && !filters.categories.includes(dish.category)) return false;
		if (filters.dietary.some((tag) => !dish.dietaryTags.includes(tag))) return false;
		if (filters.maxPrice != null && dish.price > filters.maxPrice) return false;
		if (filters.spiceLevels.length > 0 && !filters.spiceLevels.includes(dish.spiceLevel)) return false;
		if (!availabilityMatches(dish, filters.availability)) return false;
		return true;
	});
}
function uniqueGroups(dishes) {
	const seen = [];
	for (const d of dishes) {
		const g = d.menuGroup ?? "Carte";
		if (!seen.includes(g)) seen.push(g);
	}
	return seen;
}
function uniqueCategories(dishes, group) {
	const seen = [];
	for (const d of dishes) {
		if (group && d.menuGroup !== group) continue;
		if (!seen.includes(d.category)) seen.push(d.category);
	}
	return seen;
}
function priceExtent(dishes) {
	if (dishes.length === 0) return {
		min: 0,
		max: 100
	};
	let min = dishes[0].price;
	let max = dishes[0].price;
	for (const d of dishes) {
		if (d.price < min) min = d.price;
		if (d.price > max) max = d.price;
	}
	return {
		min,
		max
	};
}
function emptyFilters() {
	return {
		query: "",
		menuGroup: null,
		categories: [],
		dietary: [],
		maxPrice: null,
		spiceLevels: [],
		availability: []
	};
}
function availabilityLabel(value) {
	switch (value) {
		case "available": return "Disponible";
		case "unavailable": return "Rupture";
		case "seasonal": return "Saisonnier";
		case "evening-only": return "Soir uniquement";
		case "lunch-only": return "Midi uniquement";
	}
}
var styles = {
	available: "bg-available/15 text-available",
	unavailable: "bg-danger/15 text-danger",
	seasonal: "bg-seasonal/15 text-seasonal",
	"evening-only": "bg-ink/10 text-ink-soft",
	"lunch-only": "bg-ink/10 text-ink-soft"
};
/** Default "Disponible" is omitted on cards — it is noise. */
function AvailabilityBadge({ value, force = false }) {
	if (value === "available" && !force) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold tracking-wide", styles[value]),
		children: availabilityLabel(value)
	});
}
var DIETARY_LABELS = {
	vegetarian: "Végétarien",
	vegan: "Vegan",
	"gluten-free": "Sans gluten",
	halal: "Halal",
	"no-pork": "Sans porc"
};
var SPICE_LABELS = {
	0: "Doux",
	1: "Relevé",
	2: "Très relevé",
	3: "Brûlant"
};
var COURSE_LABELS = {
	starter: "Entrée",
	main: "Plat",
	dessert: "Dessert",
	drink: "Boisson",
	menu: "Formule",
	other: "Autre"
};
function DishCard({ dish, inMeal, onAdd, onOpen }) {
	const canAdd = dish.course === "starter" || dish.course === "main" || dish.course === "dessert" || dish.course === "menu";
	const compact = dish.course === "drink";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: cn("group rounded-lg bg-paper shadow-border transition-shadow duration-(--motion-quick) hover:shadow-border-hover", compact ? "px-4 py-3" : "p-4"),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
					className: "min-w-0 font-medium text-pretty text-ink",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "text-left hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
						onClick: () => onOpen(dish),
						children: dish.name
					}), dish.portion ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "ml-2 text-xs font-medium text-ink-muted",
						children: dish.portion
					}) : null]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "shrink-0 font-semibold tabular-nums text-ink",
					children: formatPrice(dish.price)
				})]
			}),
			dish.description ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: cn("mt-1 text-pretty text-sm leading-normal text-ink-muted", compact && "line-clamp-2"),
				children: dish.description
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-2 flex flex-wrap items-center gap-1.5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvailabilityBadge, { value: dish.availability }),
					!compact ? dish.dietaryTags.filter((t) => t !== "no-pork").map((tag) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "rounded-full bg-cream px-2 py-0.5 text-xs font-semibold text-ink-soft",
						children: DIETARY_LABELS[tag]
					}, tag)) : null,
					dish.spiceLevel > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "inline-flex items-center gap-1 rounded-full bg-danger/10 px-2 py-0.5 text-xs font-semibold text-danger",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flame, {
							className: "size-3",
							"aria-hidden": true
						}), SPICE_LABELS[dish.spiceLevel]]
					}) : null,
					dish.allergens.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-xs text-ink-subtle",
						children: ["Allergènes : ", dish.allergens.join(", ")]
					}) : null
				]
			}),
			canAdd ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3 flex justify-end",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => onAdd(dish),
					className: cn("inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent", inMeal ? "bg-ink text-cream" : "bg-cream text-ink shadow-border hover:bg-paper"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
						className: "size-3.5",
						"aria-hidden": true
					}), inMeal ? "Dans mon repas" : "Ajouter à mon repas"]
				})
			}) : null
		]
	});
}
/** One panel for a wine or drink category — scannable prices, not a wall of cards. */
function DrinkList({ items, onOpen }) {
	const sulfitesOnly = items.every((dish) => dish.allergens.length === 1 && dish.allergens[0] === "sulfites");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "overflow-hidden rounded-lg bg-paper shadow-border",
		children: [sulfitesOnly ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "border-b border-line px-4 py-2 text-xs text-ink-muted",
			children: "Sulfites"
		}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { children: items.map((dish) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
			className: "border-b border-line last:border-0",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => onOpen(dish),
				className: "flex w-full min-h-11 items-baseline gap-3 px-4 py-2.5 text-left hover:bg-cream focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "min-w-0 flex-1 font-medium text-ink",
						children: [dish.name, dish.portion ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "ml-2 text-xs font-medium text-ink-muted",
							children: dish.portion
						}) : null]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvailabilityBadge, { value: dish.availability }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "shrink-0 font-semibold tabular-nums text-ink",
						children: formatPrice(dish.price)
					})
				]
			}), dish.description ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "px-4 pb-2 text-xs leading-normal text-ink-muted",
				children: dish.description
			}) : null]
		}, dish.id)) })]
	});
}
function HoursTable({ hours }) {
	const open = isOpenNow(hours);
	const grouped = /* @__PURE__ */ new Map();
	for (const slot of hours) {
		const label = slot.open === "Fermé" ? "Fermé" : `${slot.open} – ${slot.close}`;
		const list = grouped.get(slot.day) ?? [];
		if (!list.includes(label)) list.push(label);
		grouped.set(slot.day, list);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		"aria-labelledby": "hours-heading",
		className: "rounded-xl bg-paper p-4 shadow-border",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-3 flex items-baseline justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				id: "hours-heading",
				className: "font-display text-xl text-ink",
				children: "Horaires"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: open ? "text-xs font-semibold text-available" : "text-xs font-semibold text-ink-muted",
				children: open ? "Ouvert maintenant" : "Actuellement fermé"
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
			className: "w-full text-sm",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("caption", {
				className: "sr-only",
				children: "Horaires d’ouverture"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: [...grouped.entries()].map(([day, slots]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
				className: "border-b border-line last:border-0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
					scope: "row",
					className: "py-2 pr-4 text-left font-medium text-ink",
					children: day
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "py-2 text-ink-muted tabular-nums",
					children: slots.join(" · ")
				})]
			}, day)) })]
		})]
	});
}
var ORDER = [
	"starter",
	"main",
	"dessert"
];
function mealTotal(meal) {
	return ORDER.reduce((sum, key) => sum + (meal[key]?.price ?? 0), 0);
}
function mealCount(meal) {
	return ORDER.filter((key) => meal[key]).length;
}
function MealCalculator({ meal, onRemove, onClear }) {
	const total = mealTotal(meal);
	const count = mealCount(meal);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		"aria-labelledby": "meal-heading",
		className: "rounded-xl bg-paper p-4 shadow-border",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-3 flex items-center justify-between gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
					id: "meal-heading",
					className: "inline-flex items-center gap-2 font-display text-xl text-ink",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UtensilsCrossed, {
						className: "size-4",
						"aria-hidden": true
					}), "Mon repas"]
				}), count > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: onClear,
					className: "min-h-11 px-1 text-xs font-medium text-ink-muted hover:text-ink hover:underline",
					children: "Vider"
				}) : null]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "flex flex-col",
				children: ORDER.map((course) => {
					const dish = meal[course];
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex items-center justify-between gap-2 border-b border-line py-2 last:border-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs font-semibold tracking-wide text-ink-muted uppercase",
								children: COURSE_LABELS[course]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "truncate text-sm text-ink",
								children: dish ? dish.name : "—"
							})]
						}), dish ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm font-semibold tabular-nums",
								children: formatPrice(dish.price)
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "grid size-11 place-items-center rounded-full text-ink-muted hover:bg-cream hover:text-ink",
								"aria-label": `Retirer ${dish.name}`,
								onClick: () => onRemove(course),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, {
									className: "size-3.5",
									"aria-hidden": true
								})
							})]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-sm text-ink-subtle",
							children: "0 €"
						})]
					}, course);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-3 flex items-baseline justify-between text-ink",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-sm font-medium",
					children: "Total estimé"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-display text-2xl tabular-nums",
					children: formatPrice(total)
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-xs text-ink-subtle",
				children: "Hors boissons. Prix indicatifs, service compris selon la carte."
			})
		]
	});
}
function toggle(list, value) {
	return list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
}
function MenuFilters({ filters, onChange, groups, categories, maxBound, priceStep = 1 }) {
	const set = (patch) => onChange({
		...filters,
		...patch
	});
	const sliderValue = filters.maxPrice ?? maxBound;
	const activeCount = filters.dietary.length + filters.categories.length + filters.spiceLevels.length + filters.availability.length + (filters.maxPrice != null ? 1 : 0);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
		className: "menu-filters rounded-xl bg-paper shadow-border",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("summary", {
			className: "flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-semibold text-ink marker:content-none [&::-webkit-details-marker]:hidden lg:pointer-events-none",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "inline-flex items-center gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SlidersHorizontal, {
						className: "size-4",
						"aria-hidden": true
					}),
					"Filtres",
					activeCount > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "rounded-full bg-ink px-2 py-0.5 text-xs font-semibold text-cream tabular-nums",
						children: activeCount
					}) : null
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-xs font-medium text-ink-muted lg:hidden",
				children: "Afficher / masquer"
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col gap-5 border-t border-line px-4 py-4",
			children: [
				groups.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
					className: "mb-2 text-xs font-semibold tracking-wide text-ink-muted uppercase",
					children: "Carte"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap gap-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterChip, {
						pressed: filters.menuGroup === null,
						onClick: () => set({
							menuGroup: null,
							categories: []
						}),
						children: "Toutes"
					}), groups.map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterChip, {
						pressed: filters.menuGroup === g,
						onClick: () => set({
							menuGroup: filters.menuGroup === g ? null : g,
							categories: []
						}),
						children: g
					}, g))]
				})] }) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
					className: "mb-2 text-xs font-semibold tracking-wide text-ink-muted uppercase",
					children: "Catégories"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex max-h-44 flex-wrap gap-1.5 overflow-y-auto",
					children: categories.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterChip, {
						pressed: filters.categories.includes(c),
						onClick: () => set({ categories: toggle(filters.categories, c) }),
						children: c
					}, c))
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
						className: "mb-2 text-xs font-semibold tracking-wide text-ink-muted uppercase",
						children: "Régimes"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex flex-wrap gap-1.5",
						children: Object.keys(DIETARY_LABELS).map((tag) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterChip, {
							pressed: filters.dietary.includes(tag),
							onClick: () => set({ dietary: toggle(filters.dietary, tag) }),
							children: DIETARY_LABELS[tag]
						}, tag))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-xs leading-normal text-ink-muted",
						children: "Déduit des ingrédients imprimés, pas une certification. Halal : uniquement si la carte le mentionne."
					})
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
					className: "mb-2 text-xs font-semibold tracking-wide text-ink-muted uppercase",
					children: "Budget maximum"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "range",
						min: 0,
						max: maxBound,
						step: priceStep,
						value: sliderValue,
						"aria-label": "Prix maximum",
						"aria-valuetext": filters.maxPrice == null ? "Tous les prix" : `${sliderValue} euros`,
						onChange: (e) => {
							const v = Number(e.target.value);
							set({ maxPrice: v >= maxBound ? null : v });
						},
						className: "h-2 flex-1 cursor-pointer appearance-none rounded-full bg-line accent-accent"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "w-16 text-right text-sm font-semibold tabular-nums text-ink",
						children: filters.maxPrice == null ? "Tous" : `${filters.maxPrice} €`
					})]
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
					className: "mb-2 text-xs font-semibold tracking-wide text-ink-muted uppercase",
					children: "Piquant"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex flex-wrap gap-1.5",
					children: [
						0,
						1,
						2
					].map((level) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterChip, {
						pressed: filters.spiceLevels.includes(level),
						onClick: () => set({ spiceLevels: toggle(filters.spiceLevels, level) }),
						children: SPICE_LABELS[level]
					}, level))
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
					className: "mb-2 text-xs font-semibold tracking-wide text-ink-muted uppercase",
					children: "Disponibilité"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap gap-1.5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterChip, {
							pressed: filters.availability.includes("today"),
							onClick: () => set({ availability: toggle(filters.availability, "today") }),
							children: "Disponible aujourd’hui"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterChip, {
							pressed: filters.availability.includes("tonight"),
							onClick: () => set({ availability: toggle(filters.availability, "tonight") }),
							children: "Ce soir"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterChip, {
							pressed: filters.availability.includes("seasonal"),
							onClick: () => set({ availability: toggle(filters.availability, "seasonal") }),
							children: "Saisonnier"
						})
					]
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "self-start min-h-11 text-sm font-medium text-ink-muted underline-offset-2 hover:text-ink hover:underline",
					onClick: () => onChange({
						...filters,
						categories: [],
						dietary: [],
						maxPrice: null,
						spiceLevels: [],
						availability: [],
						menuGroup: filters.menuGroup
					}),
					children: "Réinitialiser les filtres"
				})
			]
		})]
	});
}
function FilterChip({ pressed, onClick, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		"aria-pressed": pressed,
		onClick,
		className: cn("min-h-11 rounded-full px-3 text-xs font-semibold transition-colors duration-(--motion-quick) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent", pressed ? "bg-ink text-cream" : "bg-cream text-ink-soft shadow-border hover:text-ink"),
		children
	});
}
function MenuSearch({ value, onChange, resultCount, totalCount }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-w-0 flex-1 flex-col gap-1",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
				htmlFor: "menu-search",
				className: "sr-only",
				children: "Rechercher un plat, un ingrédient ou un vin"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
						className: "pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-subtle",
						"aria-hidden": true
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						id: "menu-search",
						type: "search",
						value,
						onChange: (e) => onChange(e.target.value),
						placeholder: "Plat, ingrédient, vin…",
						autoComplete: "off",
						enterKeyHint: "search",
						className: "h-11 w-full rounded-full border-0 bg-paper pr-12 pl-10 text-sm text-ink shadow-border placeholder:text-ink-subtle focus:shadow-border-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
					}),
					value ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => onChange(""),
						className: "absolute top-1/2 right-1 grid size-11 -translate-y-1/2 place-items-center rounded-full text-ink-subtle hover:text-ink",
						"aria-label": "Effacer la recherche",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
							className: "size-4",
							"aria-hidden": true
						})
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "px-1 text-xs text-ink-muted tabular-nums",
				"aria-live": "polite",
				children: [
					resultCount,
					" résultat",
					resultCount > 1 ? "s" : "",
					resultCount !== totalCount ? ` sur ${totalCount}` : ""
				]
			})
		]
	});
}
var emptyMeal = {
	starter: null,
	main: null,
	dessert: null
};
function RestaurantMenu({ restaurant, dishes }) {
	const [filters, setFilters] = (0, import_react.useState)(() => ({
		...emptyFilters(),
		menuGroup: uniqueGroups(dishes)[0] ?? null
	}));
	const [meal, setMeal] = (0, import_react.useState)(emptyMeal);
	const [activeDish, setActiveDish] = (0, import_react.useState)(null);
	const dialogRef = (0, import_react.useRef)(null);
	const groups = (0, import_react.useMemo)(() => uniqueGroups(dishes), [dishes]);
	const scope = (0, import_react.useMemo)(() => filters.menuGroup ? dishes.filter((d) => d.menuGroup === filters.menuGroup) : dishes, [dishes, filters.menuGroup]);
	const { max } = (0, import_react.useMemo)(() => priceExtent(scope), [scope]);
	const maxBound = Math.max(10, Math.ceil(max));
	const priceStep = maxBound > 200 ? 5 : 1;
	(0, import_react.useEffect)(() => {
		setFilters((current) => current.maxPrice != null && current.maxPrice > maxBound ? {
			...current,
			maxPrice: null
		} : current);
	}, [maxBound]);
	const categories = (0, import_react.useMemo)(() => uniqueCategories(dishes, filters.menuGroup), [dishes, filters.menuGroup]);
	const visible = (0, import_react.useMemo)(() => filterDishes(dishes, filters), [dishes, filters]);
	const grouped = (0, import_react.useMemo)(() => {
		const map = /* @__PURE__ */ new Map();
		for (const dish of visible) {
			const list = map.get(dish.category) ?? [];
			list.push(dish);
			map.set(dish.category, list);
		}
		return [...map.entries()];
	}, [visible]);
	(0, import_react.useEffect)(() => {
		track("page_view", {
			restaurant: restaurant.slug,
			dishCount: dishes.length
		});
	}, [restaurant.slug, dishes.length]);
	(0, import_react.useEffect)(() => {
		if (filters.query) track("search", {
			q: filters.query,
			results: visible.length
		});
	}, [filters.query, visible.length]);
	(0, import_react.useEffect)(() => {
		const el = dialogRef.current;
		if (!el) return;
		if (activeDish) {
			if (!el.open) el.showModal();
			track("dish_view", {
				id: activeDish.id,
				name: activeDish.name
			});
		} else if (el.open) el.close();
	}, [activeDish]);
	function onFiltersChange(next) {
		const changed = next.dietary.join() !== filters.dietary.join() || next.categories.join() !== filters.categories.join() || next.maxPrice !== filters.maxPrice || next.spiceLevels.join() !== filters.spiceLevels.join() || next.availability.join() !== filters.availability.join() || next.menuGroup !== filters.menuGroup;
		setFilters(next);
		if (changed) track("filter_used", {
			dietary: next.dietary,
			maxPrice: next.maxPrice,
			group: next.menuGroup
		});
	}
	function addToMeal(dish) {
		const course = dish.course === "starter" || dish.course === "main" || dish.course === "dessert" ? dish.course : dish.course === "menu" ? "main" : null;
		if (!course) return;
		setMeal((prev) => ({
			...prev,
			[course]: dish
		}));
		track("meal_add", {
			id: dish.id,
			course
		});
	}
	const inMealIds = new Set([
		meal.starter,
		meal.main,
		meal.dessert
	].filter(Boolean).map((d) => d.id));
	const open = isOpenNow(restaurant.hours);
	const count = mealCount(meal);
	const total = mealTotal(meal);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		"data-theme": restaurant.theme,
		className: "min-h-screen overflow-x-hidden bg-cream text-ink",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
				href: "#menu-results",
				className: "skip-link",
				children: "Aller au menu"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
				className: "border-b border-line bg-cream",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:px-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/",
						className: "inline-flex w-fit min-h-11 items-center gap-1.5 text-sm text-ink-muted hover:text-ink",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, {
							className: "size-4",
							"aria-hidden": true
						}), "Tous les restaurants"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-end",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs font-semibold tracking-[0.16em] text-accent uppercase",
								children: [
									restaurant.cuisineType,
									" · ",
									restaurant.city
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "mt-1 font-display text-4xl leading-tight text-balance text-ink sm:text-5xl",
								children: restaurant.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-ink-muted italic",
								children: restaurant.tagline
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 max-w-xl text-pretty text-sm leading-normal text-ink-muted",
								children: restaurant.description
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-3 text-sm text-ink-soft",
								children: [
									restaurant.address,
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										"aria-hidden": true,
										children: " · "
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
										className: "font-semibold text-ink underline-offset-2 hover:underline",
										href: telHref(restaurant.phone),
										children: formatPhone(restaurant.phone)
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: open ? "mt-2 text-sm font-semibold text-available" : "mt-2 text-sm font-semibold text-ink-muted",
								children: [open ? "Ouvert maintenant" : "Actuellement fermé", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "font-normal text-ink-muted",
									children: [
										" ",
										"· ",
										restaurant.priceHint
									]
								})]
							})
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActionButtons, { restaurant })]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("figure", {
				className: "relative overflow-hidden bg-ink",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: restaurant.image,
					alt: restaurant.imageAlt,
					className: "h-40 w-full object-cover opacity-75 sm:h-52"
				})
			}),
			groups.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
				"aria-label": "Cartes",
				className: "border-b border-line bg-paper",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mx-auto flex min-w-0 max-w-6xl gap-1 overflow-x-auto px-4 sm:px-6",
					children: groups.map((g) => {
						const selected = filters.menuGroup === g;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							"aria-current": selected ? "page" : void 0,
							onClick: () => onFiltersChange({
								...filters,
								menuGroup: g,
								categories: [],
								query: ""
							}),
							className: cn("min-h-12 shrink-0 border-b-2 px-4 text-sm font-semibold whitespace-nowrap", selected ? "border-accent text-ink" : "border-transparent text-ink-muted hover:text-ink"),
							children: g
						}, g);
					})
				})
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "sticky top-0 z-30 border-b border-line bg-cream/95 backdrop-blur-sm",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mx-auto flex max-w-6xl items-start gap-3 px-4 py-3 sm:px-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenuSearch, {
						value: filters.query,
						onChange: (query) => setFilters((f) => ({
							...f,
							query
						})),
						resultCount: visible.length,
						totalCount: dishes.length
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
					className: "lg:sticky lg:top-20 lg:self-start",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenuFilters, {
							filters,
							onChange: onFiltersChange,
							groups,
							categories,
							maxBound,
							priceStep
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-4 hidden lg:block",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MealCalculator, {
								meal,
								onRemove: (course) => {
									setMeal((prev) => ({
										...prev,
										[course]: null
									}));
									track("meal_remove", { course });
								},
								onClear: () => setMeal(emptyMeal)
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-4 hidden lg:block",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HoursTable, { hours: restaurant.hours })
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
						id: "menu-results",
						className: "min-w-0",
						children: [grouped.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
							"aria-label": "Catégories",
							className: "mb-6 flex min-w-0 gap-1.5 overflow-x-auto pb-1",
							children: grouped.map(([category, items]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
								href: `#cat-${categorySlug(category)}`,
								className: "inline-flex min-h-11 shrink-0 items-center rounded-full bg-paper px-3 text-xs font-semibold whitespace-nowrap text-ink-soft shadow-border hover:text-ink",
								children: [category, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "ml-1.5 text-ink-subtle tabular-nums",
									children: items.length
								})]
							}, category))
						}) : null, visible.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-xl bg-paper px-6 py-16 text-center shadow-border",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-display text-2xl text-ink",
									children: "Aucun plat ne correspond à vos critères"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2 text-sm text-ink-muted",
									children: "Élargissez la recherche, augmentez le budget ou retirez un régime."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "mt-5 min-h-11 rounded-full bg-ink px-5 text-sm font-semibold text-cream",
									onClick: () => setFilters({
										...emptyFilters(),
										menuGroup: groups[0] ?? null
									}),
									children: "Réinitialiser"
								})
							]
						}) : grouped.map(([category, items]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							id: `cat-${categorySlug(category)}`,
							className: "mb-10 scroll-mt-24",
							"aria-labelledby": `heading-${categorySlug(category)}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								id: `heading-${categorySlug(category)}`,
								className: "mb-4 font-display text-3xl text-ink",
								children: category
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid gap-3",
								children: items.every((dish) => dish.course === "drink") ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DrinkList, {
									items,
									onOpen: setActiveDish
								}) : items.map((dish) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DishCard, {
									dish,
									inMeal: inMealIds.has(dish.id),
									onAdd: addToMeal,
									onOpen: setActiveDish
								}, dish.id))
							})]
						}, category))]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-8 space-y-4 lg:hidden",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MealCalculator, {
							meal,
							onRemove: (course) => setMeal((prev) => ({
								...prev,
								[course]: null
							})),
							onClear: () => setMeal(emptyMeal)
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HoursTable, { hours: restaurant.hours })]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "h-24 lg:hidden",
				"aria-hidden": true
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-x-0 bottom-0 z-40 border-t border-line bg-cream/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm lg:hidden",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex max-w-6xl items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "min-w-0 flex-1 text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-semibold tabular-nums",
							children: formatPrice(total)
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-ink-muted",
							children: [
								" ",
								"· ",
								count,
								" plat",
								count > 1 ? "s" : ""
							]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActionButtons, {
						restaurant,
						variant: "bar",
						className: "flex-1 justify-end [&>a:nth-child(n+3)]:hidden"
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dialog", {
				ref: dialogRef,
				className: "w-[min(100%,32rem)] rounded-2xl bg-paper p-0 text-ink shadow-border backdrop:bg-ink/50",
				"aria-labelledby": activeDish ? "dish-dialog-title" : void 0,
				onClose: () => setActiveDish(null),
				children: activeDish ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "p-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-semibold tracking-wide text-ink-muted uppercase",
							children: activeDish.category
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							id: "dish-dialog-title",
							className: "mt-1 font-display text-2xl text-ink",
							children: activeDish.name
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 font-semibold tabular-nums",
							children: [formatPrice(activeDish.price), activeDish.portion ? ` · ${activeDish.portion}` : ""]
						}),
						activeDish.description ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 text-sm leading-normal text-ink-muted",
							children: activeDish.description
						}) : null,
						activeDish.ingredients && activeDish.ingredients.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-3 text-sm text-ink-soft",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-semibold text-ink",
								children: "Ingrédients : "
							}), activeDish.ingredients.join(", ")]
						}) : null,
						activeDish.allergens.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-2 text-sm text-ink-soft",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-semibold text-ink",
								children: "Allergènes : "
							}), activeDish.allergens.join(", ")]
						}) : null,
						activeDish.dietaryTags.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm text-ink-soft",
							children: activeDish.dietaryTags.map((t) => DIETARY_LABELS[t]).join(" · ")
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-5 flex justify-end gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "min-h-11 rounded-full px-4 text-sm font-semibold text-ink-muted hover:text-ink",
								onClick: () => setActiveDish(null),
								children: "Fermer"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "min-h-11 rounded-full bg-accent px-4 text-sm font-semibold text-accent-fg",
								onClick: () => {
									addToMeal(activeDish);
									setActiveDish(null);
								},
								children: "Ajouter à mon repas"
							})]
						})
					]
				}) : null
			})
		]
	});
}
function MenuPage() {
	const { restaurant, dishes } = Route.useLoaderData();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(JsonLd, {
		restaurant,
		dishes
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RestaurantMenu, {
		restaurant,
		dishes
	})] });
}
//#endregion
export { MenuPage as component };
