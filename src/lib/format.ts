const euro = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

export function formatPrice(value: number): string {
  return euro.format(value);
}

export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("33") && digits.length === 11) {
    const rest = digits.slice(2);
    return `+33 ${rest[0]} ${rest.slice(1, 3)} ${rest.slice(3, 5)} ${rest.slice(5, 7)} ${rest.slice(7, 9)}`;
  }
  return raw;
}

export function telHref(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  return `tel:+${digits}`;
}

export function mapsHref(query: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
}

export function isOpenNow(
  hours: { day: string; open: string; close: string }[],
  now = new Date(),
): boolean {
  const days = [
    "Dimanche",
    "Lundi",
    "Mardi",
    "Mercredi",
    "Jeudi",
    "Vendredi",
    "Samedi",
  ];
  const today = days[now.getDay()];
  const minutes = now.getHours() * 60 + now.getMinutes();
  return hours.some((h) => {
    if (h.day !== today || h.open === "Fermé") return false;
    const [oh, om] = h.open.split(":").map(Number);
    const [ch, cm] = h.close.split(":").map(Number);
    let start = oh * 60 + om;
    let end = ch * 60 + cm;
    if (end === 0) end = 24 * 60;
    return minutes >= start && minutes <= end;
  });
}

export function isLunchTime(now = new Date()): boolean {
  const m = now.getHours() * 60 + now.getMinutes();
  return m >= 11 * 60 && m < 16 * 60;
}
