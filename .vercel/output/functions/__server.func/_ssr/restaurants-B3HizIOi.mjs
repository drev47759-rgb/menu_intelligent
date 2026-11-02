//#region node_modules/.nitro/vite/services/ssr/assets/restaurants-B3HizIOi.js
var DAYS = [
	"Lundi",
	"Mardi",
	"Mercredi",
	"Jeudi",
	"Vendredi",
	"Samedi",
	"Dimanche"
];
function splitService(openLunch, closeLunch, openDinner, closeDinner, closed = []) {
	return DAYS.flatMap((day) => {
		if (closed.includes(day)) return [{
			day,
			open: "Fermé",
			close: "Fermé"
		}];
		return [{
			day,
			open: openLunch,
			close: closeLunch
		}, {
			day,
			open: openDinner,
			close: closeDinner
		}];
	});
}
var restaurants = [
	{
		slug: "le-train-bleu",
		name: "Le Train Bleu",
		address: "Place Louis-Armand, 75012 Paris",
		phone: "+33143430906",
		email: "reservation.trainbleu@ssp.fr",
		website: "https://www.le-train-bleu.com",
		reservationUrl: "https://www.le-train-bleu.com",
		hours: splitService("11:15", "14:30", "19:00", "22:30"),
		cuisineType: "Brasserie gastronomique",
		tagline: "Monument historique, Gare de Lyon",
		description: "Inauguré en 1901, classé Monument historique depuis 1972. 41 fresques PLM, partenariat culinaire avec Michel Rostang. Déjeuner 11h15–14h30, dîner 19h–22h30, tous les jours.",
		image: "https://www.le-train-bleu.com/media/cache/jadro_resize/rc/2CMFefIi1741249987/jadroRoot/medias/5aafbd3bc117c/le-train-bleu-008_2800x2100.jpg",
		imageAlt: "La salle Belle Époque du Train Bleu, Gare de Lyon",
		mapsQuery: "Le Train Bleu Gare de Lyon Place Louis-Armand Paris",
		city: "Paris 12e",
		priceHint: "Menus 29–120 €",
		theme: "train-bleu"
	},
	{
		slug: "brasserie-bordelaise",
		name: "Brasserie Bordelaise",
		address: "50 rue Saint-Rémi, 33000 Bordeaux",
		phone: "+33557871191",
		website: "https://www.brasserie-bordelaise.fr",
		reservationUrl: "https://www.brasserie-bordelaise.fr",
		hours: DAYS.map((day) => ({
			day,
			open: "12:00",
			close: "00:00"
		})),
		cuisineType: "Brasserie sud-ouest",
		tagline: "Le goût du Sud-Ouest",
		description: "Cuisine bordelaise, produits de saison et sélection de bœuf maturé. Service continu tous les jours, 12h – minuit. Maison Faber Lascombes.",
		image: "https://www.brasserie-bordelaise.fr/wp-content/themes/brasserie/img/plats-01.jpg",
		imageAlt: "Plats de la Brasserie Bordelaise",
		mapsQuery: "Brasserie Bordelaise 50 rue Saint-Rémi Bordeaux",
		city: "Bordeaux",
		priceHint: "Plats 16–36 €",
		theme: "bordelaise"
	},
	{
		slug: "histoire-ancienne",
		name: "Histoire Ancienne",
		address: "20 rue Royale, 62100 Calais",
		phone: "+33321341120",
		website: "https://www.histoire-ancienne.com",
		reservationUrl: "https://www.histoire-ancienne.com/reservations.php",
		hours: splitService("12:00", "14:30", "18:45", "22:00", ["Lundi"]),
		cuisineType: "Bistrot Bib Gourmand",
		tagline: "Bistrot Bib Gourmand à Calais",
		description: "Cuisine sincère à redécouvrir chaque saison. Bib Gourmand 40 €, formules déjeuner, carte et cave. Mardi–dimanche, fermé le lundi.",
		image: "https://www.histoire-ancienne.com/wp-content/uploads/2015/02/blog2.jpg",
		imageAlt: "Salle du bistrot Histoire Ancienne à Calais",
		mapsQuery: "Histoire Ancienne 20 rue Royale Calais",
		city: "Calais",
		priceHint: "Formules 15–40 €",
		theme: "histoire"
	}
];
var restaurantSlugs = restaurants.map((r) => r.slug);
function getRestaurant(slug) {
	return restaurants.find((r) => r.slug === slug);
}
//#endregion
export { restaurantSlugs as n, restaurants as r, getRestaurant as t };
