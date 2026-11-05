#!/usr/bin/env python3
"""Decouverte aleatoire de restaurant via les outils gratuits de data.gouv.

Pipeline (teste en conditions reelles, voir discovery/README.md) :

 1. Tirage aleatoire d'un restaurant actif (NAF 56.10A) via l'API Recherche
    d'entreprises (recherche-entreprises.api.gouv.fr) : donnees Sirene de
    l'INSEE publiees sur data.gouv.fr, gratuite et sans authentification.
 2. Recuperation du SIRET du siege et de son adresse etendue.
 3. Recherche du site web officiel du restaurant (DuckDuckGo HTML, gratuit,
    sans cle d'API).
 4. Verification d'officialite : le SIRET (ou le SIREN, ou l'adresse etendue
    normalisee du SIRET) doit apparaitre dans la page Mentions legales ou
    dans le footer du site candidat.
 5. Recherche des menus PDF rattaches au restaurant trouve, sur le site
    officiel verifie (pages carte / menu, liens .pdf).
 6. Peuplement des donnees : telechargement des PDF, extraction du texte
    (pypdf, optionnel) et conversion en catalogue JSON au format Dish du
    projet (src/types/menu.ts). Fallback documente : texte des pages carte
    HTML si aucun PDF n'est telechargeable (--html-fallback).

Utilisation :

    python3 scripts/discover-restaurant.py
    python3 scripts/discover-restaurant.py --seed 42 --max-tries 40
    python3 scripts/discover-restaurant.py --siret 92275605100012
    python3 scripts/discover-restaurant.py --html-fallback

Sorties (discovery/run-<horodatage>-<slug>/) :

    report.json      piste d'audit complete (tirage, candidats, verification, PDF)
    menu-*.pdf       menus PDF telecharges depuis le site officiel
    <slug>.json      plats extraits, au format Dish

Le script n'invente jamais de prix, de plat ni de certification : il ne
retient que ce qui est imprime sur les documents du restaurant.
"""

from __future__ import annotations

import argparse
import json
import random
import re
import sys
import time
import unicodedata
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

API = "https://recherche-entreprises.api.gouv.fr/search"
NAF_RESTAURATION = "56.10A"
PER_PAGE = 5
MAX_PAGE = 10000 // PER_PAGE  # limite : page x per_page <= 10 000
UA = "menu-intelligent-discovery/1.0 (+https://github.com/drev47759-rgb/menu_intelligent)"
TIMEOUT = 20
SLEEP = 1.0  # politesse envers les services gratuits

KEYWORDS = [
    "restaurant", "bistrot", "brasserie", "auberge", "pizzeria",
    "trattoria", "comptoir", "winstub", "hostellerie", "creperie",
]

# Domaines de resultats qui ne sont JAMAIS le site officiel du restaurant.
DIR_DOMAINS = re.compile(
    r"(?:^|\.)(?:"
    r"tripadvisor|thefork|pagesjaunes|petitfute|restaurantguru|yelp|opentable|"
    r"justeat|deliveroo|ubereat|lacarte\.menu|menuweb\.menu|eatbu|eat-list|"
    r"societe\.com|pappers|rubypayeur|verif|viamichelin|mappy|kompass|"
    r"annuaire-entreprises|annuaire-mairie|pagesjaunes|gowork|dandb|linkedin|"
    r"facebook|instagram|xing|goldenpages|kompass|gaultmillau|"
    r"guides-touristiques|visitstrasbourg|tourisme64|en\.|de\.|nl\."
    r")\b|"
    r"^(?:www\.)?(?:societe|pappers|verif|rubypayeur)\.",
    re.I,
)

MENU_HINT = re.compile(r"carte|menu|menus|plats|desserts|entr|food|gastronom", re.I)
MENTIONS_HINT = re.compile(r"mentions?[- ]l[eé]gales?|legal-notice|mentions", re.I)
PRICE_RE = re.compile(r"(\d{1,3})[.,](\d{2})\s*(?:\u20ac|EUR)?", re.I)
PORTION_RE = re.compile(
    r"(petite(?:\s*portion)?)\s*(\d{1,3})[.,](\d{2}).*?"
    r"(grande(?:\s*portion)?)\s*(\d{1,3})[.,](\d{2})",
    re.I,
)

CATEGORIES = [
    ("ENTREES", "Les Entr\u00e9es", "starter"),
    ("STARTERS", "Les Entr\u00e9es", "starter"),
    ("VIANDES", "Viandes", "main"),
    ("PLATS", "Plats", "main"),
    ("ALSACIENNES", "Sp\u00e9cialit\u00e9s Alsaciennes", "main"),
    ("TARTES FLAMBEES", "Les Tartes Flamb\u00e9es", "main"),
    ("FLAMMKUCHEN", "Les Tartes Flamb\u00e9es", "main"),
    ("ROESTI", "Roestis", "main"),
    ("FROMAGE", "Fromage d'Alsace", "dessert"),
    ("DESSERTS", "Desserts", "dessert"),
    ("MENUS", "Nos Menus", "menu"),
    ("FORMULES", "Formules", "menu"),
    ("BOISSONS", "Boissons", "drink"),
    ("VINS", "Vins", "drink"),
]


# ---------------------------------------------------------------- utilitaires

def norm(text: str) -> str:
    """Normalisation accent/espaces pour comparaison d'adresses."""
    text = unicodedata.normalize("NFKD", text)
    text = "".join(c for c in text if not unicodedata.combining(c))
    return re.sub(r"[^A-Z0-9]+", " ", text.upper()).strip()


def slugify(s: str) -> str:
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")
    return s[:72] or "item"


def strip_tags(html: str) -> str:
    html = re.sub(r"<script[^>]*>.*?</script>", " ", html, flags=re.S | re.I)
    html = re.sub(r"<style[^>]*>.*?</style>", " ", html, flags=re.S | re.I)
    html = re.sub(r"<br\s*/?>", " ", html, flags=re.I)
    html = re.sub(r"<[^>]+>", " ", html)
    import html as htmlmod
    text = htmlmod.unescape(html)
    text = text.replace("\xa0", " ").replace("\u202f", " ")
    return re.sub(r"[ \t]+", " ", text)


def fetch(url: str, binary: bool = False) -> tuple[int, bytes]:
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": UA,
            "Accept-Language": "fr",
            "Accept": "text/html,application/pdf;q=0.9,*/*;q=0.8",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as res:
            body = res.read()
            return res.status, (body if binary else body)
    except urllib.error.HTTPError as e:
        return e.code, e.read() if binary else str(e).encode()
    except Exception as e:  # réseau, timeout, SSL...
        return 0, str(e).encode()


def fetch_text(url: str) -> tuple[int, str]:
    status, body = fetch(url)
    return status, body.decode("utf-8", errors="replace")


def extract_links(html: str, base: str) -> list[str]:
    out: list[str] = []
    for m in re.finditer(r"""href=["']([^"']+)["']""", html):
        href = m.group(1)
        if href.startswith(("#", "javascript:", "mailto:", "tel:")):
            continue
        try:
            out.append(urllib.parse.urljoin(base, href))
        except ValueError:
            continue
    return out


# ------------------------------------------------ étape 1-2 : tirage data.gouv

def draw_candidates() -> list[dict]:
    """Tirage aleatoire : mot-cle au hasard + page au hasard de l'API."""
    kw = random.choice(KEYWORDS)
    page = random.randint(1, MAX_PAGE)
    url = (
        f"{API}?q={urllib.parse.quote(kw)}"
        f"&activite_principale={NAF_RESTAURATION}"
        f"&per_page={PER_PAGE}&page={page}"
    )
    status, text = fetch_text(url)
    if status != 200:
        return []
    try:
        payload = json.loads(text)
    except json.JSONDecodeError:
        return []
    out = []
    for r in payload.get("results", []):
        siege = r.get("siege") or {}
        if r.get("etat_administratif") != "A" or siege.get("etat_administratif") != "A":
            continue
        out.append(
            {
                "siren": r.get("siren"),
                "siret_siege": siege.get("siret"),
                "nom_complet": r.get("nom_complet"),
                "naf": r.get("activite_principale"),
                # adresse etendue du SIRET : complement + adresse Sirene
                "adresse_etendue": " ".join(
                    p
                    for p in (siege.get("complement_adresse"), siege.get("adresse"))
                    if p
                ),
                "numero_voie": siege.get("numero_voie"),
                "libelle_voie": siege.get("libelle_voie"),
                "code_postal": siege.get("code_postal"),
                "commune": siege.get("libelle_commune"),
                "mot_cle": kw,
                "page_api": page,
            }
        )
    return out


def get_by_siret(siret: str) -> dict | None:
    status, text = fetch_text(f"{API}?q={siret}&per_page=1")
    if status != 200:
        return None
    try:
        payload = json.loads(text)
        r = (payload.get("results") or [None])[0]
    except (json.JSONDecodeError, IndexError):
        return None
    if not r:
        return None
    siege = r.get("siege") or {}
    return {
        "siren": r.get("siren"),
        "siret_siege": siege.get("siret") or siret,
        "nom_complet": r.get("nom_complet"),
        "naf": r.get("activite_principale"),
        "adresse_etendue": " ".join(
            p for p in (siege.get("complement_adresse"), siege.get("adresse")) if p
        ),
        "numero_voie": siege.get("numero_voie"),
        "libelle_voie": siege.get("libelle_voie"),
        "code_postal": siege.get("code_postal"),
        "commune": siege.get("libelle_commune"),
    }


# --------------------------------------------- étape 3 : recherche du site web

def ddg_search(query: str, limit: int = 6) -> list[str]:
    """Recherche DuckDuckGo HTML (gratuit, sans cle) -> URLs candidates."""
    url = "https://html.duckduckgo.com/html/?q=" + urllib.parse.quote(query)
    status, html = fetch_text(url)
    if status != 200:
        return []
    out = []
    for m in re.finditer(
        r"""<a[^>]+class="result__a"[^>]+href=["']([^"']+)["']""", html
    ):
        href = m.group(1)
        # liens-redirections DuckDuckGo : decoder uddg=
        if "duckduckgo.com/l/" in href:
            qs = urllib.parse.parse_qs(urllib.parse.urlparse(href).query)
            href = (qs.get("uddg") or [href])[0]
        if not href.startswith("http"):
            continue
        if DIR_DOMAINS.search(urllib.parse.urlparse(href).netloc):
            continue
        if href not in out:
            out.append(href)
        if len(out) >= limit:
            break
    return out


# ------------------------------- étape 4 : verification mentions legales/footer

def verify_official(site_url: str, candidate: dict) -> dict | None:
    """Le SIRET / SIREN / adresse etendue doit figurer dans les mentions
    legales ou le footer du site. Renvoie la preuve, sinon None."""
    siret = candidate["siret_siege"] or ""
    siren = candidate["siren"] or ""
    tokens = [
        norm(x)
        for x in (candidate["numero_voie"], candidate["libelle_voie"],
                  candidate["code_postal"], candidate["commune"])
        if x
    ]

    status, home = fetch_text(site_url)
    if status != 200 or not home:
        return None
    pages: list[tuple[str, str]] = [(site_url, home)]
    seen = {site_url}
    for link in extract_links(home, site_url):
        if link in seen:
            continue
        if MENTIONS_HINT.search(link) or MENTIONS_HINT.search(
            re.sub(r"[^A-Za-z\u00c0-\u017f]+", " ", link)
        ):
            st, page_html = fetch_text(link)
            if st == 200 and page_html:
                pages.append((link, page_html))
            seen.add(link)

    for page_url, page_html in pages[:6]:
        # footer inclus : le texte de la page enti ere est examine
        text = strip_tags(page_html)
        compact = re.sub(r"\s", "", text)
        if siret and siret in compact:
            return {"methode": "siret", "page": page_url, "preuve": "SIRET " + siret}
        if siren and siren in compact:
            return {"methode": "siren", "page": page_url, "preuve": "SIREN " + siren}
        ntext = " " + norm(text) + " "
        if tokens and all(t in ntext for t in tokens):
            return {
                "methode": "adresse-etendue",
                "page": page_url,
                "preuve": "adresse " + candidate["adresse_etendue"],
            }
    return None


# ---------------------------------------- étape 5 : recherche des menus PDF

def find_menu_pdfs(site_url: str, max_pages: int = 12) -> list[str]:
    """Parcours en largeur des pages carte/menu du site -> liens PDF."""
    host = urllib.parse.urlparse(site_url).netloc
    pdfs: list[str] = []
    queue = [site_url]
    seen = set()
    while queue and len(seen) < max_pages:
        url = queue.pop(0)
        if url in seen:
            continue
        seen.add(url)
        if urllib.parse.urlparse(url).netloc != host:
            continue
        status, html = fetch_text(url)
        if status != 200:
            continue
        for link in extract_links(html, url):
            if re.search(r"\.pdf(\?|#|$)", link, re.I):
                if link not in pdfs:
                    pdfs.append(link)
            elif (
                urllib.parse.urlparse(link).netloc == host
                and MENU_HINT.search(link)
                and link not in seen
            ):
                queue.append(link)
    return pdfs


def download_pdfs(pdfs: list[str], out_dir: Path) -> list[Path]:
    saved = []
    for i, url in enumerate(pdfs, 1):
        status, body = fetch(url, binary=True)
        if status == 200 and body[:4] == b"%PDF":
            path = out_dir / f"menu-{i}.pdf"
            path.write_bytes(body)
            saved.append(path)
        time.sleep(SLEEP)
    return saved


# ------------------------------------------- étape 6 : peuplement des donnees

def pdf_text(path: Path) -> str | None:
    try:
        from pypdf import PdfReader  # optionnel
    except ImportError:
        return None
    try:
        reader = PdfReader(str(path))
        return "\n".join((page.extract_text() or "") for page in reader.pages)
    except Exception:
        return None


def carte_pages_text(site_url: str) -> list[tuple[str, str]]:
    """Fallback documente : texte visible des pages carte HTML."""
    host = urllib.parse.urlparse(site_url).netloc
    texts = []
    queue = [site_url]
    seen = set()
    while queue and len(seen) < 8:
        url = queue.pop(0)
        if url in seen:
            continue
        seen.add(url)
        if urllib.parse.urlparse(url).netloc != host:
            continue
        status, html = fetch_text(url)
        if status != 200:
            continue
        for link in extract_links(html, url):
            if (
                urllib.parse.urlparse(link).netloc == host
                and MENU_HINT.search(link)
                and link not in seen
            ):
                queue.append(link)
        texts.append((url, strip_tags(html)))
    return texts


def parse_dishes(text: str, menu_group: str = "La Carte") -> list[dict]:
    """Extraction conservatrice nom/prix depuis le texte d'une carte.

    Ne garde que les lignes qui portent un prix imprime ; les regimes,
    allergenes et certifications ne sont JAMAIS infers ici (le catalogue
    enrichi reste le travail de scripts/extract-menus.py).
    """
    dishes: list[dict] = []
    category, course = "La Carte", "other"
    name_buf: list[str] = []

    def flush():
        nonlocal name_buf
        name_buf = []

    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        up = norm(line)
        if len(line) <= 40 and up == line.upper() and not PRICE_RE.search(line):
            for key, cat, crs in CATEGORIES:
                if key in up:
                    category, course = cat, crs
                    flush()
                    break
            continue
        portion = PORTION_RE.search(line)
        if portion and name_buf:
            name = " ".join(name_buf).strip()
            dishes.append({"name": name, "price": float(portion.group(2) + "." + portion.group(3)),
                           "portion": "Petite portion", "category": category, "course": course,
                           "menuGroup": menu_group})
            dishes.append({"name": name, "price": float(portion.group(5) + "." + portion.group(6)),
                           "portion": "Grande portion", "category": category, "course": course,
                           "menuGroup": menu_group})
            flush()
            continue
        price = PRICE_RE.search(line)
        if price and name_buf:
            name = " ".join(name_buf).strip()
            dishes.append({"name": name,
                           "price": float(price.group(1) + "." + price.group(2)),
                           "portion": None, "category": category,
                           "course": course, "menuGroup": menu_group})
            flush()
            continue
        if len(line) > 2 and not re.search(r"^\W+$", line):
            name_buf.append(line)
        if len(name_buf) > 6:
            flush()
    return dishes


def to_dish_catalog(items: list[dict], prefix: str) -> list[dict]:
    """Convertit les plats extraits au format Dish (src/types/menu.ts)."""
    catalog = []
    used: dict[str, int] = {}
    for it in items:
        base = f"{prefix}-{slugify(it['name'])}"
        n = used.get(base, 0) + 1
        used[base] = n
        dish_id = base if n == 1 else f"{base}-{n}"
        if it.get("portion"):
            dish_id += "-" + slugify(it["portion"])
        catalog.append(
            {
                "id": dish_id,
                "name": it["name"],
                "description": "",
                "price": it["price"],
                "category": it["category"],
                "menuGroup": it.get("menuGroup", "La Carte"),
                "ingredients": [],
                "allergens": [],
                "dietaryTags": [],
                "spiceLevel": 0,
                "availability": "available",
                "portion": it.get("portion"),
                "isFeatured": False,
                "course": it.get("course", "other"),
                "origin": None,
            }
        )
    return catalog


# ------------------------------------------------------------------------ main

def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--seed", type=int, default=None)
    ap.add_argument("--max-tries", type=int, default=40, help="nb max de candidats evalues")
    ap.add_argument("--siret", help="mode cible : d\xc3\xa9couvre depuis un SIRET connu")
    ap.add_argument("--html-fallback", action="store_true",
                    help="accepter le texte des pages carte HTML si aucun PDF")
    ap.add_argument("--out-dir", default="discovery")
    args = ap.parse_args()

    if args.seed is not None:
        random.seed(args.seed)

    report: dict = {
        "run": {
            "date": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "script": "scripts/discover-restaurant.py",
            "api": API,
            "parametres": vars(args),
        },
        "candidats_evalues": [],
        "resultat": None,
    }

    candidates: list[dict] = []
    if args.siret:
        c = get_by_siret(args.siret)
        candidates = [c] if c else []
    else:
        candidates = draw_candidates()

    tries = 0
    while candidates and tries < args.max_tries:
        cand = candidates.pop(0)
        tries += 1
        query = f"{cand['nom_complet']} {cand['commune']} restaurant"
        sites = ddg_search(query)
        verdict = {
            "nom": cand["nom_complet"],
            "siret_siege": cand["siret_siege"],
            "commune": cand["commune"],
            "sites_candidats": sites[:3],
            "issue": "aucun site candidat hors annuaires",
        }
        for site in sites[:3]:
            proof = verify_official(site, cand)
            if not proof:
                continue
            pdfs = find_menu_pdfs(site)
            entry = dict(verdict)
            entry.update({"site_officiel": site, "verification": proof, "menus_pdf": pdfs})
            if pdfs:
                saved = download_pdfs(pdfs, Path(args.out_dir))
                entry["pdf_telecharges"] = [p.name for p in saved]
            if pdfs and any((Path(args.out_dir) / n).exists() for n in entry["pdf_telecharges"]):
                texts = [t for p in saved if (t := pdf_text(p))]
                dishes = [d for t in texts for d in parse_dishes(t)]
                entry["source_peuplement"] = "menu PDF"
                entry["nb_plats"] = len(dishes)
            elif args.html_fallback and not pdfs:
                pages = carte_pages_text(site)
                dishes = [d for _, t in pages for d in parse_dishes(t)]
                entry["source_peuplement"] = "pages carte HTML (fallback documente)"
                entry["nb_plats"] = len(dishes)
            else:
                entry["issue"] = "site officiel verifie mais aucun menu PDF"
                report["candidats_evalues"].append(entry)
                continue
            catalog = to_dish_catalog(dishes, slugify(str(cand["nom_complet"]))[:2])
            report["candidats_evalues"].append(entry)
            report["resultat"] = {
                "restaurant": cand,
                "site_officiel": site,
                "verification": proof,
                "peuplement": entry,
            }
            slug = slugify(str(cand["nom_complet"]))
            run_dir = Path(args.out_dir)
            run_dir.mkdir(parents=True, exist_ok=True)
            (run_dir / "report.json").write_text(
                json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
            )
            (run_dir / f"{slug}.json").write_text(
                json.dumps(catalog, ensure_ascii=False, indent=2), encoding="utf-8"
            )
            print(f"[ok] {cand['nom_complet']} ({cand['commune']})")
            print(f"     site officiel verifie : {site} ({proof['methode']})")
            print(f"     {entry['nb_plats']} plats extraits ({entry['source_peuplement']})")
            return 0
        report["candidats_evalues"].append(verdict)
        if not candidates:
            candidates = draw_candidates()

    report["resultat"] = None
    Path(args.out_dir).mkdir(parents=True, exist_ok=True)
    (Path(args.out_dir) / "report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"[echec] aucun restaurant verifie avec menu PDF apres {tries} candidats.")
    print("        Relancer (tirage aleatoire different) ou augmenter --max-tries.")
    print("        Detail : " + str(Path(args.out_dir) / "report.json"))
    return 1


if __name__ == "__main__":
    sys.exit(main())
