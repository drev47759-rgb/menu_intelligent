#!/usr/bin/env python3
"""Extract restaurant menus from source HTML into typed JSON.

Prices, names and descriptions stay faithful to the attached cartes.
Dietary tags, allergens, spice and availability are inferred from
explicit badges/tags plus conservative keyword heuristics (never
invented certifications).
"""

from __future__ import annotations

import html as htmlmod
import json
import re
import unicodedata
from pathlib import Path

ROOT = Path("/workspace/attachments")
OUT = Path("/workspace/src/data")

ALLERGEN_MAP = {
    "gluten": "gluten",
    "crustacés": "crustacés",
    "crustaces": "crustacés",
    "œufs": "œufs",
    "oeufs": "œufs",
    "poissons": "poissons",
    "arachides": "arachides",
    "soja": "soja",
    "lait": "lait",
    "fruits à coque": "fruits à coque",
    "fruits a coque": "fruits à coque",
    "céleri": "céleri",
    "celeri": "céleri",
    "moutarde": "moutarde",
    "sésame": "sésame",
    "sesame": "sésame",
    "sulfites": "sulfites",
    "lupin": "lupin",
    "mollusques": "mollusques",
}

def wordish(pattern: str, text: str) -> bool:
    """Accent-safe whole-word search for French menu copy."""
    return bool(re.search(rf"(?<![A-Za-zÀ-ÖØ-öø-ÿ])(?:{pattern})(?![A-Za-zÀ-ÖØ-öø-ÿ])", text, re.I))
SULPHITE_CAT = re.compile(
    r"vin|champagne|spiritueux|cocktail|apéritif|aperitif", re.I
)
SPICE_2 = re.compile(r"steak au poivre|steack au poivre|très relevé", re.I)
SPICE_1 = re.compile(
    r"\b(poivre|piment|piquillos|épicé|epice|harissa|chili|wasabi|curry)\b", re.I
)

VEG_NAME_RE = re.compile(
    r"végétarien|vegetarien|vegan|minestrone|salade de jeunes pousses|"
    r"lasagnes de légumes|caponata|fromage|viennoiser|crêpe au sucre|"
    r"omelette.*champignon|assiette mimolette|thé |infusion|matcha|"
    r"chocolat chaud|macaron|dessert|glace|sorbet|tarte|profiterole|"
    r"moelleux|vacherin|panna? cota|poire pochée|fraisier|crème brûlée",
    re.I,
)

DRINK_CAT = re.compile(
    r"boisson|vin|champagne|cocktail|mocktail|bière|biere|spiritueux|"
    r"gin|whisky|rhum|vodka|thé|thes |café|cafe|soda|eau|jus |nectar|"
    r"apéritif|aperitif|digestif|porto|cognac|armagnac|soft|bar",
    re.I,
)
DESSERT_CAT = re.compile(
    r"dessert|pâtiss|patiss|glace|coupes glac|macaron|fromage|café gourmand|"
    r"cafes gourmands",
    re.I,
)
STARTER_CAT = re.compile(
    r"entrée|entree|cochonnaille|huître|huitre|caviar|sur le pouce|"
    r"assiette|jardin du matin|fraîcheur|fraicheur",
    re.I,
)
MAIN_CAT = re.compile(
    r"plat|poisson|viande|végétal|vegetal|bœuf|boeuf|œuf|oeuf|"
    r"création|creation à partager|incontournable",
    re.I,
)
MENU_CAT = re.compile(r"menu|formule|midi|enfant|brunch|paris-|fête|fete", re.I)


def strip_tags(s: str) -> str:
    s = re.sub(r"<br\s*/?>", " ", s, flags=re.I)
    s = re.sub(r"<sup[^>]*>.*?</sup>", "", s, flags=re.S)
    s = re.sub(r'<span class="badge">.*?</span>', "", s, flags=re.S)
    s = re.sub(r'<span class="en">.*?</span>', "", s, flags=re.S)
    s = re.sub(r"<small[^>]*>.*?</small>", " ", s, flags=re.S)
    s = re.sub(r"<[^>]+>", " ", s)
    s = htmlmod.unescape(s)
    s = s.replace("\xa0", " ").replace("\u2009", " ").replace("\u202f", " ")
    s = re.sub(r"\s+", " ", s).strip()
    return s


def parse_euros(chunk: str) -> list[float]:
    text = strip_tags(chunk)
    found: list[float] = []
    for m in re.finditer(
        r"(\d{1,3}(?:[ \u00a0\u202f]\d{3})*|\d+)\s*€\s*(\d{2})", text
    ):
        whole = re.sub(r"\D", "", m.group(1))
        found.append(int(whole) + int(m.group(2)) / 100)
    if found:
        return found
    # Formules written as "60 €" without cents span
    for m in re.finditer(r"(\d{1,4})\s*€", text):
        found.append(float(m.group(1)))
    return found


def first_price(chunk: str) -> float | None:
    euros = parse_euros(chunk)
    return euros[0] if euros else None


def slugify(s: str) -> str:
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = s.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s[:72] or "item"


def split_ingredients(desc: str) -> list[str]:
    if not desc:
        return []
    parts = re.split(r",|;| · | — | – ", desc)
    out = []
    for p in parts:
        p = p.strip(" .").strip()
        if 2 < len(p) < 60:
            out.append(p[0].upper() + p[1:] if p else p)
    return out[:12]


def infer_allergens(name: str, desc: str, cat: str, explicit: list[str]) -> list[str]:
    blob = f"{name} {desc} {cat}"
    found: set[str] = set(explicit)
    if wordish(
        r"pain|brioche|croissant|viennoiser\w*|croûtons?|croutons?|pâtes?|pates?|"
        r"lasagne\w*|macaroni\w*|gnocchi\w*|farine|blé|blinis?|sablé\w*|sable|"
        r"tarte\w*|millefeuille|profiterole\w*|toast|baguette|crêpes?|crepes?|"
        r"gaufre\w*|moelleux|financier|macarons?|ravioli\w*|ravioles?|nouille\w*|"
        r"semoule|biscuit\w*|meringue|éclairs?|eclair\w*|finger|crumble|pané|"
        r"chapelure|pizza|feuillet\w*|canapés?|granola|céréales?|cereales?",
        blob,
    ):
        found.add("gluten")
    if wordish(
        r"crème|creme|beurre|fromage|lait|yaourt|yogurt|burrata|gratin|"
        r"hollandaise|emmental|comté|comte|chantilly|brie|camembert|"
        r"maroilles|parmesan|cappuccino|latte|viennois|panna? cota|mimolette|"
        r"skyr|fromage blanc",
        blob,
    ):
        found.add("lait")
    if wordish(r"œufs?|oeufs?|omelette|hollandaise|mayonnaise|mayo|mimosa", blob):
        found.add("œufs")
    if wordish(
        r"truite|saumon|bar|cabillaud|dorade|lotte|maigre|thon|haddock|"
        r"saint-pierre|poisson|gravlax|gravelax|mulet|anchois|sardine|merlu",
        blob,
    ):
        found.add("poissons")
    if wordish(r"homard|langoustine|crevettes?|gambas|crustacé\w*", blob):
        found.add("crustacés")
    if wordish(
        r"poulpe|huîtres?|huitres?|saint-jacques|calamar\w*|moules?|bulot|"
        r"mollusque\w*",
        blob,
    ):
        found.add("mollusques")
    if wordish(
        r"noix|noisettes?|amandes?|pistaches?|cajou|pécan|pecan|pralin\w*|gianduja",
        blob,
    ):
        found.add("fruits à coque")
    if wordish(r"moutarde|béarnaise|bearnaise", blob):
        found.add("moutarde")
    if wordish(r"céleri|celeri", blob):
        found.add("céleri")
    if wordish(r"soja|miso|tofu", blob):
        found.add("soja")
    if wordish(r"sésame|sesame", blob):
        found.add("sésame")
    if wordish(r"arachides?|cacahuètes?|cacahuetes?", blob):
        found.add("arachides")
    if SULPHITE_CAT.search(cat) or wordish(r"champagne|kir|spritz|porto|vermouth", blob):
        if DRINK_CAT.search(cat):
            found.add("sulfites")
    return sorted(found)


MEAT_PAT = (
    r"bœuf|boeuf|veau|agneau|canard|volaille|poulet|magret|jarret|gigot|"
    r"entrecôte|entrecote|bavette|faux-filet|filet de bœuf|steaks?|steacks?|"
    r"tartare de bœuf|ris de veau|rognons?|foie gras|corned-beef|tête de veau|"
    r"cassoulet|langoustine|homard|jambon|lard|charcut\w*|cochonnaille"
)
PORK_PAT = (
    r"porc|jambon|lard|lardons?|chorizo|saucisson|cochons?|cochonnaille|"
    r"charcuterie|bellota|cebo|greniers?|grattons?|bacon|poitrine|figatellu|"
    r"rillettes?|rosette|ibérique|iberique|andouillette|boudin|pied de cochon|"
    r"crépinette|crepinette|prince de paris"
)


def infer_dietary(
    name: str, desc: str, cat: str, veg_flag: bool, allergens: list[str]
) -> list[str]:
    blob = f"{name} {desc}"
    tags: list[str] = []
    pork = wordish(PORK_PAT, blob) or wordish(PORK_PAT, cat)
    is_drink = bool(DRINK_CAT.search(cat))
    is_beer = bool(re.search(r"bière|biere|beer", cat + " " + blob, re.I))
    is_alcohol = bool(
        re.search(
            r"vin|champagne|cocktail|spiritueux|bière|biere|whisky|rhum|"
            r"gin |vodka|apéritif|kir |spritz|porto|cognac|armagnac|lillet",
            re.sub(r"vinaigr\w*", " ", cat + " " + blob, flags=re.I),
            re.I,
        )
    ) and not re.search(r"sans alcool|0\.0|mocktail", blob + cat, re.I)

    has_animal = bool(
        wordish(MEAT_PAT, blob)
        or wordish(
            r"truite|saumon|bar |cabillaud|dorade|lotte|maigre|thon|poulpe|"
            r"huître|huitre|crevette|gambas|merlu",
            blob,
        )
        or "poissons" in allergens
        or "crustacés" in allergens
        or "mollusques" in allergens
    )

    vegetarian = veg_flag
    if not vegetarian and not pork and not has_animal and not is_alcohol:
        if is_drink or re.search(
            r"salade de jeunes pousses|minestrone|lasagnes de légumes|caponata|"
            r"assiette mimolette|fromage|viennoiser|crêpe au sucre|badine de fruits|"
            r"yaourt|macaron|chocolat|tarte|glace|sorbet|infusion|matcha|"
            r"granola|skyr|fromage blanc|omelette",
            blob,
            re.I,
        ):
            vegetarian = True
        if re.search(r"dessert|pâtiss|viennoiser|thé|café|fromage", cat, re.I) and not has_animal:
            vegetarian = True

    # Alcoholic drinks are not a vegetarian dish decision.
    if is_drink and is_alcohol:
        vegetarian = False

    vegan = False
    if vegetarian and "lait" not in allergens and "œufs" not in allergens and not pork:
        if is_drink and not re.search(
            r"lait|crème|creme|fromage|yaourt|miel|beurre|cappuccino|"
            r"latte|viennois|chocolat chaud|irish|mocha|macchiato",
            blob,
            re.I,
        ):
            if re.search(
                r"evian|badoit|saint-géron|saint-geron|jus |nectar|thé |"
                r"infusion|soda|pepsi|orangina|schweppes|mocktail|limonade|"
                r"san bitter|thé glacé|eau ",
                blob,
                re.I,
            ) or re.search(r"eaux|jus |nectars|mocktails|soft", cat, re.I):
                vegan = True
        if veg_flag and re.search(r"salade de jeunes pousses", blob, re.I):
            vegan = "lait" not in allergens and "œufs" not in allergens

    gluten_free = False
    if "gluten" not in allergens:
        if is_drink and not is_beer:
            gluten_free = True
        elif re.search(r"huître|huitre|caviar", blob, re.I):
            gluten_free = True

    if vegetarian:
        tags.append("vegetarian")
    if vegan:
        tags.append("vegan")
    if gluten_free:
        tags.append("gluten-free")
    # "Sans porc" only when the printed dish doesn't mention pork
    # and isn't an unspecified daily special.
    unspecified = bool(
        re.search(r"selon la saison|marché du chef|plat du jour", blob, re.I)
    )
    if not pork and not unspecified:
        tags.append("no-pork")
    # Halal is a certification — never inferred from ingredients.
    if re.search(r"\bhalal\b", blob, re.I):
        tags.append("halal")
    return tags


def infer_spice(name: str, desc: str) -> int:
    blob = f"{name} {desc}"
    if SPICE_2.search(blob):
        return 2
    if SPICE_1.search(blob):
        return 1
    return 0


def infer_availability(name: str, desc: str, cat: str, group: str) -> str:
    blob = f"{name} {cat} {group}"
    if re.search(r"selon arrivage", f"{name} {desc}", re.I):
        return "seasonal"
    if re.search(
        r"formule-déjeuner|formule-dejeuner|les midis|petit-déjeuner|"
        r"petit-dejeuner|paris-lyon|paris-vintimille",
        blob,
        re.I,
    ):
        return "lunch-only"
    if re.search(r"brunch", group, re.I) and re.search(r"formule|paris-", name, re.I):
        return "lunch-only"
    if re.search(r"soir uniquement", f"{name} {desc}", re.I):
        return "evening-only"
    return "available"


def infer_course(name: str, cat: str, group: str) -> str:
    """Category decides the course. Group names like « Bar » must not
    swallow savoury dishes into the drinks list (meal calculator)."""
    if re.search(r"menus? &|les formules|menus d", cat, re.I):
        return "menu"
    if re.search(r"végétarien|vegetarien", cat, re.I):
        return "main"
    if re.search(r"sur le pouce", cat, re.I):
        if re.search(
            r"cabillaud|tartare|parmentier|sandwich|croque|club|"
            r"omelette|poisson|agneau|bœuf|boeuf",
            name,
            re.I,
        ):
            return "main"
        return "starter"
    if DESSERT_CAT.search(cat):
        if re.search(r"\bsalade\b", name, re.I):
            return "starter"
        return "dessert"
    if re.search(r"viennoiser|pains?", cat, re.I):
        return "starter"
    if STARTER_CAT.search(cat):
        return "starter"
    if MAIN_CAT.search(cat):
        return "main"
    if DRINK_CAT.search(cat):
        return "drink"
    if re.search(r"formule|menu", cat, re.I) or re.search(r"formule|menu", group, re.I):
        return "menu"
    # Leftovers on a wine or bar carte (magnums, signatures…) are drinks.
    if re.search(r"vin|bar|boisson|champagne", group, re.I):
        return "drink"
    return "other"


def has_veg_badge(frag: str) -> bool:
    return bool(re.search(r"végétarien|vegetarien", frag, re.I))


def explicit_allergens(frag: str) -> list[str]:
    tags = re.findall(r'<ul class="dish-tags">(.*?)</ul>', frag, re.S)
    found: list[str] = []
    veg = False
    for block in tags:
        for li in re.findall(r"<li>(.*?)</li>", block, re.S):
            t = strip_tags(li).lower()
            if "végétarien" in t or "vegetarien" in t:
                veg = True
                continue
            if "alcool" in t:
                continue
            mapped = ALLERGEN_MAP.get(t)
            if mapped:
                found.append(mapped)
    return found, veg  # type: ignore


def parse_size_variants(frag: str) -> list[tuple[str, float]]:
    variants: list[tuple[str, float]] = []
    for sz in re.finditer(r'<span class="sz">(.*?)</span>', frag, re.S):
        inner = sz.group(1)
        lab_m = re.search(r"<small[^>]*>(.*?)</small>", inner, re.S)
        lab = strip_tags(lab_m.group(1)) if lab_m else ""
        p = first_price(inner)
        if p is not None:
            variants.append((lab, p))
    if variants:
        return variants
    for wp in re.finditer(
        r"<span>\s*<b>(.*?)</b>\s*([^<]*)\s*</span>", frag, re.S
    ):
        p = first_price(wp.group(1))
        lab = strip_tags(wp.group(2))
        if p is not None:
            variants.append((lab, p))
    if variants:
        return variants
    return []


def price_and_portion(frag: str) -> list[tuple[str, float]]:
    variants = parse_size_variants(frag)
    if variants:
        return variants
    # dedicated price node
    for cls in ("rprice", "price", "price-tag"):
        i = frag.find(f'class="{cls}"')
        if i >= 0:
            chunk = frag[i : i + 160]
            p = first_price(chunk)
            if p is not None:
                extra = re.search(r"<small[^>]*>(.*?)</small>", frag, re.S)
                portion = strip_tags(extra.group(1)) if extra else ""
                tag = re.search(r'<span class="rtag">(.*?)</span>', frag, re.S)
                if not portion and tag:
                    portion = strip_tags(tag.group(1))
                return [(portion, p)]
    p = first_price(frag)
    if p is not None:
        tag = re.search(r'<span class="rtag">(.*?)</span>', frag, re.S)
        return [(strip_tags(tag.group(1)) if tag else "", p)]
    return []


def clean_cat_title(raw: str) -> str:
    t = strip_tags(raw)
    t = re.sub(r"\s+", " ", t).strip()
    return t


def parse_section_items(body: str, cat_title: str, cat_id: str, group: str) -> list[dict]:
    items: list[dict] = []
    events: list[tuple[int, str, str]] = []

    for m in re.finditer(r'<h3 class="subhead"[^>]*>(.*?)</h3>', body, re.S):
        events.append((m.start(), "sub", strip_tags(m.group(1))))
    for m in re.finditer(
        r'<div class="wine-region-block">\s*<h4>(.*?)</h4>', body, re.S
    ):
        events.append((m.start(), "sub", strip_tags(m.group(1))))
    for m in re.finditer(r"<article class=\"dish\">(.*?)</article>", body, re.S):
        events.append((m.start(), "dish", m.group(1)))
    for m in re.finditer(r"<ul class=\"rows\">(.*?)</ul>", body, re.S):
        events.append((m.start(), "rows", m.group(1)))
    for m in re.finditer(r'<div class="wine-row">(.*?)</div>', body, re.S):
        events.append((m.start(), "wine", m.group(1)))
    for m in re.finditer(
        r'<div class="(?:menu-card|simple-card)"[^>]*>(.*?)(?=<div class="(?:menu-card|simple-card)"|</div></div>\s*</section>|$)',
        body,
        re.S,
    ):
        events.append((m.start(), "card", m.group(1)))

    events.sort(key=lambda x: x[0])
    current_sub = ""
    seen_card_names: set[str] = set()

    def cat_now() -> str:
        return f"{cat_title} — {current_sub}" if current_sub else cat_title

    def emit(name: str, desc: str, portion: str, price: float, frag: str, featured: bool = False):
        explicit, veg_from_tags = explicit_allergens(frag)
        veg = veg_from_tags or has_veg_badge(frag)
        allergens = infer_allergens(name, desc, cat_now(), explicit)
        dietary = infer_dietary(name, desc, cat_now(), veg, allergens)
        items.append(
            {
                "name": name,
                "description": desc,
                "price": price,
                "category": cat_now(),
                "categoryId": cat_id,
                "menuGroup": group,
                "ingredients": split_ingredients(desc),
                "allergens": allergens,
                "dietaryTags": dietary,
                "spiceLevel": infer_spice(name, desc),
                "availability": infer_availability(name, desc, cat_now(), group),
                "portion": portion or None,
                "isFeatured": featured
                or bool(re.search(r"caviar|signature|train bleu|bib gourmand", name, re.I)),
                "course": infer_course(name, cat_now(), group),
                "origin": None,
            }
        )

    for _, kind, payload in events:
        if kind == "sub":
            current_sub = payload.split("+")[0].strip()
            current_sub = re.split(r"[A-Z][a-z].*€", current_sub)[0].strip()
            if len(current_sub) > 60:
                current_sub = current_sub[:60]
            continue
        if kind == "dish":
            name_m = re.search(r"<h4>(.*?)</h4>", payload, re.S)
            if not name_m:
                continue
            name = strip_tags(name_m.group(1))
            desc = ""
            dm = re.search(r'<p class="desc">(.*?)</p>', payload, re.S)
            nm = re.search(r'<p class="note">(.*?)</p>', payload, re.S)
            if dm:
                desc = strip_tags(dm.group(1))
            if nm:
                note = strip_tags(nm.group(1))
                desc = f"{desc} — {note}".strip(" —")
            variants = price_and_portion(payload)
            if not variants:
                continue
            for lab, p in variants:
                emit(name, desc, lab, p, payload)
        elif kind == "rows":
            for li in re.finditer(r"<li>(.*?)</li>", payload, re.S):
                frag = li.group(1)
                name_m = re.search(r'<span class="rname">(.*?)</span>', frag, re.S)
                if not name_m:
                    continue
                name = strip_tags(name_m.group(1))
                desc_m = re.search(
                    r'<p class="(?:rdesc|bar-item-desc|rnote)">(.*?)</p>', frag, re.S
                )
                desc = strip_tags(desc_m.group(1)) if desc_m else ""
                variants = price_and_portion(frag)
                if not variants:
                    continue
                for lab, p in variants:
                    emit(name, desc, lab, p, frag)
        elif kind == "wine":
            name_m = re.search(r'<span class="wname">(.*?)</span>', payload, re.S)
            if not name_m:
                continue
            name = strip_tags(name_m.group(1))
            note_m = re.search(r'<span class="wnote">(.*?)</span>', payload, re.S)
            meta_m = re.search(r'<span class="wmeta">(.*?)</span>', payload, re.S)
            bits = []
            if meta_m:
                bits.append(strip_tags(meta_m.group(1)))
            if note_m:
                bits.append(strip_tags(note_m.group(1)))
            desc = " — ".join(bits)
            variants = price_and_portion(payload)
            if not variants:
                # fallback: any euros in the row
                prices = parse_euros(payload)
                labs = re.findall(r"</b>\s*([^<]+)", payload)
                if prices:
                    for i, p in enumerate(prices):
                        lab = strip_tags(labs[i]) if i < len(labs) else ""
                        emit(name, desc, lab, p, payload)
                continue
            for lab, p in variants:
                emit(name, desc, lab, p, payload)
        elif kind == "card":
            h3 = re.search(r"<h3[^>]*>(.*?)</h3>", payload, re.S)
            if not h3:
                continue
            name = strip_tags(h3.group(1))
            if name in seen_card_names:
                continue
            if name in {"Adresse & accès", "Horaires", "Contact & réservation"}:
                continue
            seen_card_names.add(name)
            sc_items = re.findall(
                r'<span class="sc-name">(.*?)</span>\s*<b>(.*?)</b>', payload, re.S
            )
            if sc_items:
                sched = re.search(r'class="schedule">(.*?)</p>', payload, re.S)
                note = re.search(r'<p class="note"[^>]*>(.*?)</p>', payload, re.S)
                extra = []
                if sched:
                    extra.append(strip_tags(sched.group(1)))
                if note:
                    extra.append(strip_tags(note.group(1)))
                suffix = " — ".join(extra)
                for scn, scp in sc_items:
                    price = first_price(scp)
                    if price is None:
                        continue
                    dname = f"{name} — {strip_tags(scn)}"
                    emit(dname, suffix, "", price, payload, featured=True)
                continue
            p = first_price(payload)
            if p is None:
                meta = re.search(r'class="special-meta"[^>]*>(.*?)</p>', payload, re.S)
                if meta:
                    p = first_price(meta.group(1))
            if p is None:
                mprice = re.search(r"(\d+)\s*€", name)
                p = float(mprice.group(1)) if mprice else None
            if p is None:
                continue
            lis = [strip_tags(x) for x in re.findall(r"<li[^>]*>(.*?)</li>", payload, re.S)]
            courses = [
                strip_tags(x) for x in re.findall(r'<p class="course">(.*?)</p>', payload, re.S)
            ]
            desc_parts = courses or lis
            desc = " · ".join(d for d in desc_parts if d)[:480]
            sched = re.search(r'class="schedule">(.*?)</p>', payload, re.S)
            note = re.search(r'<p class="note"[^>]*>(.*?)</p>', payload, re.S)
            extra = []
            if sched:
                extra.append(strip_tags(sched.group(1)))
            if note:
                extra.append(strip_tags(note.group(1)))
            if extra:
                desc = (" — ".join(extra) + (" — " + desc if desc else "")).strip(" —")
            emit(name, desc, "", p, payload, featured=True)

    return items


def parse_file(path: Path, group: str) -> list[dict]:
    text = path.read_text(encoding="utf-8")
    items: list[dict] = []
    for m in re.finditer(
        r'<section class="(?:category|cards-wrap)[^"]*" id="([^"]*)"(.*?)</section>',
        text,
        re.S,
    ):
        sid = m.group(1)
        body = m.group(2)
        title_m = re.search(
            r'<h2 class="cat-title"[^>]*>(.*?)</h2>|'
            r'<h2 class="script-title"[^>]*>(.*?)</h2>',
            body,
            re.S,
        )
        if title_m:
            cat_title = clean_cat_title(title_m.group(1) or title_m.group(2) or sid)
        else:
            cat_title = sid
        items.extend(parse_section_items(body, cat_title, sid, group))
    return items


def assign_ids(items: list[dict], prefix: str) -> list[dict]:
    used: dict[str, int] = {}
    out = []
    for it in items:
        base = f"{prefix}-{slugify(it['name'])}"
        n = used.get(base, 0) + 1
        used[base] = n
        did = base if n == 1 else f"{base}-{n}"
        if it.get("portion"):
            extra = slugify(it["portion"])
            if extra:
                did = f"{did}-{extra}"
        # unique still
        final = did
        k = 2
        existing = {x["id"] for x in out}
        while final in existing:
            final = f"{did}-{k}"
            k += 1
        row = {"id": final, **it}
        if not row["portion"]:
            row["portion"] = None
        out.append(row)
    return out


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    train = []
    train += parse_file(ROOT / "tb-a-la-carte-1.html", "À la Carte")
    train += parse_file(ROOT / "tb-sur-le-pouce-1.html", "Sur le Pouce & Bar")
    train += parse_file(
        ROOT / "tb-petit-dejeuner-brunch-1.html", "Petit-Déjeuner & Brunch"
    )

    borde = []
    borde += parse_file(ROOT / "brasserie-bordelaise-la-carte-1.html", "La Carte")
    borde += parse_file(
        ROOT / "brasserie-bordelaise-carte-des-vins-1.html", "Carte des Vins"
    )

    hist = parse_file(ROOT / "menu-histoire-ancienne-apercu-1.html", "La Carte")

    datasets = {
        "le-train-bleu": assign_ids(train, "tb"),
        "brasserie-bordelaise": assign_ids(borde, "bb"),
        "histoire-ancienne": assign_ids(hist, "ha"),
    }

    for slug, dishes in datasets.items():
        prices = [d["price"] for d in dishes]
        missing = [d["name"] for d in dishes if d["price"] is None]
        print(
            f"{slug}: {len(dishes)} dishes | "
            f"min {min(prices) if prices else '-'} max {max(prices) if prices else '-'} | "
            f"missing {len(missing)}"
        )
        if missing:
            print("  missing:", missing[:8])
        # sanity: train bleu langoustines should be 38
        sample = [d for d in dishes if "Langoustines" in d["name"]]
        if sample:
            print("  langoustines", sample[0]["price"])
        sample = [d for d in dishes if "Mouton Rothschild" in d["name"]]
        if sample:
            print("  mouton", sample[0]["price"], sample[0]["name"])
        sample = [d for d in dishes if d["name"].startswith("Café ou déca") and d["price"] < 10]
        if sample:
            print("  cafe", sample[0]["name"], sample[0]["price"])
        (OUT / f"{slug}.json").write_text(
            json.dumps(dishes, ensure_ascii=False, indent=2), encoding="utf-8"
        )


if __name__ == "__main__":
    main()
