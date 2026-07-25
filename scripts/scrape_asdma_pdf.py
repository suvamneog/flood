#!/usr/bin/env python3
"""
Scrape the latest ASDMA Daily Flood Report PDF and update the React app data.

Source
------
    https://sdrf.assam.gov.in/dfr/  (Assam State Disaster Management Authority
    / SDRF — Daily Flood Report portal, backed by DRIMS)

What it does
------------
1. Walks back day-by-day from today up to N days, POSTing the DFR download
   form until it finds the newest available flood report PDF.
2. Downloads and caches it in scripts/raw/.
3. Parses the PDF (via pdfplumber) — extracts CWC river levels, per-district
   population / crop area / villages / relief camps / human lives lost /
   revenue-circle level details.
4. Writes JSON files that match the React app's data schema in src/data/.

Usage
-----
    python3 -m pip install -r scripts/requirements.txt
    python3 scripts/scrape_asdma_pdf.py               # newest available
    python3 scripts/scrape_asdma_pdf.py --date 2026-07-24
    python3 scripts/scrape_asdma_pdf.py --lookback 14 # search up to 14 days back
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import re
import sys
import time
from pathlib import Path
from typing import Any, Callable, Iterable

import requests

try:
    import pdfplumber
except ImportError:  # pragma: no cover
    sys.stderr.write(
        "pdfplumber is required. Install with:\n"
        "    python3 -m pip install -r scripts/requirements.txt\n"
    )
    sys.exit(1)


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "src" / "data"
RAW_DIR = ROOT / "scripts" / "raw"
UA = (
    "FloodAssistAssam/1.0 (+public disaster-info scraper; "
    "contacts local-dev; respects robots)"
)

DFR_URL = "https://sdrf.assam.gov.in/dfr/download?type=flood"
DFR_POST = "https://sdrf.assam.gov.in/dfr/download"


# ---------------------------------------------------------------------------
# Assam district canonical list + approximate centroids for map pins.
# ---------------------------------------------------------------------------
DISTRICTS: dict[str, dict[str, float]] = {
    "Baksa": {"lat": 26.6935, "lng": 91.5082},
    "Barpeta": {"lat": 26.3228, "lng": 91.0065},
    "Biswanath": {"lat": 26.7333, "lng": 93.15},
    "Bongaigaon": {"lat": 26.4833, "lng": 90.55},
    "Cachar": {"lat": 24.8333, "lng": 92.7789},
    "Charaideo": {"lat": 27.0333, "lng": 95.0},
    "Chirang": {"lat": 26.525, "lng": 90.5},
    "Darrang": {"lat": 26.45, "lng": 92.03},
    "Dhemaji": {"lat": 27.4855, "lng": 94.556},
    "Dhubri": {"lat": 26.0234, "lng": 89.9867},
    "Dibrugarh": {"lat": 27.4728, "lng": 94.912},
    "Dima Hasao": {"lat": 25.5, "lng": 93.0},
    "Dima-Hasao": {"lat": 25.5, "lng": 93.0},
    "Goalpara": {"lat": 26.1734, "lng": 90.6263},
    "Golaghat": {"lat": 26.5234, "lng": 93.9623},
    "Hailakandi": {"lat": 24.6848, "lng": 92.561},
    "Hojai": {"lat": 26.0, "lng": 92.8667},
    "Jorhat": {"lat": 26.7509, "lng": 94.2037},
    "Kamrup": {"lat": 26.3161, "lng": 91.5986},
    "Kamrup Metro": {"lat": 26.1445, "lng": 91.7362},
    "Karbi Anglong": {"lat": 26.0, "lng": 93.45},
    "Karimganj": {"lat": 24.8667, "lng": 92.35},
    "Kokrajhar": {"lat": 26.4015, "lng": 90.2667},
    "Lakhimpur": {"lat": 27.2364, "lng": 94.1036},
    "Majuli": {"lat": 26.95, "lng": 94.1667},
    "Morigaon": {"lat": 26.2523, "lng": 92.3423},
    "Nagaon": {"lat": 26.3509, "lng": 92.6925},
    "Nalbari": {"lat": 26.445, "lng": 91.439},
    "Sivasagar": {"lat": 26.9844, "lng": 94.6378},
    "Sibsagar": {"lat": 26.9844, "lng": 94.6378},
    "Sonitpur": {"lat": 26.634, "lng": 92.79},
    "South Salmara": {"lat": 25.85, "lng": 89.95},
    "South Salmara-Mankachar": {"lat": 25.85, "lng": 89.95},
    "Sribhumi": {"lat": 24.87, "lng": 92.36},
    "Tinsukia": {"lat": 27.4922, "lng": 95.3468},
    "Udalguri": {"lat": 26.7536, "lng": 92.102},
    "West Karbi Anglong": {"lat": 25.85, "lng": 92.65},
}


def slugify(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def coords_for(name: str) -> dict[str, float]:
    if name in DISTRICTS:
        return DISTRICTS[name]
    # case-insensitive fallback
    for k, v in DISTRICTS.items():
        if k.lower() == name.lower():
            return v
    return {"lat": 26.2, "lng": 92.9}


# ---------------------------------------------------------------------------
# Download the newest available PDF from the SDRF DFR portal
# ---------------------------------------------------------------------------
def request_with_retries(
    do_request: Callable[[], requests.Response],
    *,
    label: str,
    attempts: int = 5,
    base_delay: float = 8.0,
) -> requests.Response:
    """Retry transient network failures against the ASDMA portal."""
    last_exc: Exception | None = None
    for attempt in range(1, attempts + 1):
        try:
            return do_request()
        except (
            requests.exceptions.ConnectTimeout,
            requests.exceptions.ReadTimeout,
            requests.exceptions.ConnectionError,
        ) as exc:
            last_exc = exc
            if attempt >= attempts:
                break
            delay = base_delay * attempt
            print(
                f"  ⟳ {label} timed out (attempt {attempt}/{attempts}); "
                f"retrying in {delay:.0f}s…",
                flush=True,
            )
            time.sleep(delay)
    assert last_exc is not None
    raise last_exc


def fetch_pdf(target_date: dt.date, lookback: int) -> tuple[bytes, dt.date, str]:
    session = requests.Session()
    session.headers.update({"User-Agent": UA})

    print(f"→ Fetching DFR form (CSRF, session cookie)…", flush=True)
    page = request_with_retries(
        lambda: session.get(DFR_URL, timeout=60),
        label="DFR form GET",
    )
    page.raise_for_status()
    token_match = re.search(r'name="_token" value="([^"]+)"', page.text)
    if not token_match:
        raise RuntimeError("Could not extract CSRF _token from DFR page")
    token = token_match.group(1)

    tried: list[str] = []
    for i in range(lookback + 1):
        candidate = target_date - dt.timedelta(days=i)
        date_str = candidate.isoformat()
        print(f"→ Trying date {date_str} …", end=" ", flush=True)
        resp = request_with_retries(
            lambda ds=date_str, tok=token: session.post(
                DFR_POST,
                data={"_token": tok, "type": "flood", "date": ds},
                headers={"Referer": DFR_URL},
                timeout=90,
                allow_redirects=True,
            ),
            label=f"DFR POST {date_str}",
        )
        ct = resp.headers.get("Content-Type", "")
        if resp.status_code == 200 and "pdf" in ct.lower() and len(resp.content) > 1024:
            print(f"✓ found ({len(resp.content):,} bytes)")
            return resp.content, candidate, date_str
        tried.append(f"{date_str}({resp.status_code})")
        print(f"× {resp.status_code}")
        # 419 usually means session expired — refresh token
        if resp.status_code == 419:
            page = request_with_retries(
                lambda: session.get(DFR_URL, timeout=60),
                label="DFR form refresh",
            )
            token_match = re.search(r'name="_token" value="([^"]+)"', page.text)
            if token_match:
                token = token_match.group(1)

    raise RuntimeError(f"No flood report found within lookback. Tried: {', '.join(tried)}")


# ---------------------------------------------------------------------------
# PDF parsing — pdfplumber gives us clean per-line text that we can regex.
# ---------------------------------------------------------------------------
# Word-wrap fixes: pdfplumber can split a district cell across two lines when
# adjacent columns wrap. Two flavours:
#   A) DIGIT-GLUED: "Biswanat0 ..." (last letter cut off, next-column digit
#      immediately follows) — repair to "Biswanath 0 ..."
#   B) LETTER-CONTINUATION: "Biswanat0 ...\nCentres h\n" — the missing letter
#      appears at the start of a later line as a lone token — drop that token.
GLUED_TRUNCATIONS = [
    ("Biswanat", "Biswanath"),
    ("Charaide", "Charaideo"),
    ("Dibrugar", "Dibrugarh"),
    ("Kokraj",   "Kokrajhar"),
    ("Sivasa",   "Sivasagar"),
    ("Hailak",   "Hailakandi"),
    ("Bongaig",  "Bongaigaon"),
    ("Karim",    "Karimganj"),
]
CONTINUATION_LETTERS = ["h", "o", "har", "ganj", "gar", "andi", "aon"]

WORDWRAP_FIXES = [
    (r"Karbi\s*\n?\s*Anglong\b", "Karbi Anglong"),
    (r"Dima\s*\n?\s*Hasao\b", "Dima Hasao"),
    (r"Kamrup\s*\n?\s*\(M\)", "Kamrup Metro"),
    (r"Kamrup\s*\(M\)", "Kamrup Metro"),
    (r"South\s*\n?\s*Salmara(?:-\s*\n?\s*Mankachar)?", "South Salmara"),
    (r"West\s*\n?\s*Karbi\s*\n?\s*Anglong", "West Karbi Anglong"),
]


def normalize_text(text: str) -> str:
    """Fix district-name word-wraps and other pdfplumber artefacts."""
    out = text
    # A) Repair digit-glued truncations: "Biswanat0" -> "Biswanath 0"
    for short, full in GLUED_TRUNCATIONS:
        out = re.sub(rf"\b{short}(?=\d)", f"{full} ", out)
    # B) Drop leftover single-letter continuation tokens like "\nCentres h\n"
    #    or " h " that pdfplumber emitted after a broken cell.
    #    We only strip when the letter is a whole token AND is one of the
    #    known continuation letters.
    for tail in CONTINUATION_LETTERS:
        out = re.sub(rf"(?<=[A-Za-z0-9\)])\s+{tail}\s*(?=\n)", "", out)
    # C) Multi-line district-name fixes
    for pat, repl in WORDWRAP_FIXES:
        out = re.sub(pat, repl, out)
    return out


DISTRICT_NAMES_RE = "|".join(
    sorted({re.escape(k) for k in DISTRICTS}, key=len, reverse=True)
)

# Population line: District Male Female Children Total Crop
POP_LINE_RE = re.compile(
    rf"^\s*({DISTRICT_NAMES_RE})\s+(\d[\d,]*)\s+(\d[\d,]*)\s+(\d[\d,]*)\s+(\d[\d,]*)\s+([\d,\.]+)"
)
# Circle-level detail inside Population section
CIRCLE_DETAIL_RE = re.compile(
    r"\(([^|()]+?)\s*\|\s*Population Affected:\s*([\d,\.]+)\s*\|\s*Crop Area Submerged:\s*([\d,\.]+)\)",
    re.IGNORECASE,
)
# Relief camp line
# Relief Camps section: District | Total | ReliefCamp count | (details) | RDC count | (details)
# Capture Total (grp 2), Relief-Camp count (grp 3), and RDC count if present.
CAMP_LINE_RE = re.compile(
    rf"^\s*({DISTRICT_NAMES_RE})\s+(\d[\d,]*)\s+(\d[\d,]*)\b"
)
# Human lives lost — Total is the 3rd column after District, first is a "date"
# but format is: District Total FloodDeath General Male Female Children Others ...
HLL_LINE_RE = re.compile(
    rf"^\s*({DISTRICT_NAMES_RE})\s+(\d[\d,]*)\s+(\d[\d,]*)\s+(\d[\d,]*)"
)


def to_int(v: str) -> int:
    try:
        return int(v.replace(",", ""))
    except Exception:
        return 0


def to_float(v: str) -> float:
    try:
        return float(v.replace(",", ""))
    except Exception:
        return 0.0


def extract_report_date(text: str) -> dt.date | None:
    m = re.search(r"Assam Flood Report as on\s+(\d{1,2})-(\d{1,2})-(\d{4})", text)
    if not m:
        return None
    d, mo, y = (int(x) for x in m.groups())
    try:
        return dt.date(y, mo, d)
    except ValueError:
        return None


def slice_section(text: str, start_pattern: str, next_patterns: Iterable[str]) -> str:
    """Return the block of text from a section header until the next section header.
    Patterns are regex (whitespace-tolerant so section labels wrapped across
    lines still match).
    """
    m = re.search(start_pattern, text)
    if not m:
        return ""
    start = m.start()
    end = len(text)
    for np in next_patterns:
        nm = re.search(np, text[m.end():])
        if nm:
            end = min(end, m.end() + nm.start())
    return text[start:end]


SECTION_ORDER = [
    "Rivers\nflowing",
    "District\nAffected",
    "No. Of\nRevenue",
    "Name Of",
    "Villages",
    "Population",
    "Relief Camps",
    "Inmates In",
    "Non Camp",
    "Human Lives Lost",
    "Human Lives Missing",
    "Animals\nAffected",
    "Animals\nWashed Away",
    "Houses\nDamaged",
    "Rescue",
    "Relief\nDistributed",
    "Baby Food",
    "Infrastructure",
    "Embankment",
    "Wildlife",
    "Remarks",
]


def parse_pdf(pdf_path: Path) -> dict[str, Any]:
    with pdfplumber.open(pdf_path) as pdf:
        pages_text = [p.extract_text() or "" for p in pdf.pages]
    full = normalize_text("\n".join(pages_text))

    result: dict[str, Any] = {
        "reportDate": None,
        "rivers": {"danger": [], "flood": []},
        "affectedDistricts": [],
        "population": {},
        "reliefCamps": {},
        "hll": {},
        "camps": {},
    }
    result["reportDate"] = extract_report_date(full)

    # --- Rivers section ---
    # In some PDFs the danger-level list appears BEFORE the label; grab both
    # patterns by locating each label independently.
    danger = re.search(
        r"([^\n]{2,400})\s*Rivers flowing above danger level|"
        r"Rivers flowing above danger level\s*([^\n]{2,400})",
        full,
    )
    flood = re.search(
        r"Rivers flowing above highest flood level\s*([^\n]{1,400})",
        full,
    )

    def clean_rivers(raw: str | None) -> list[str]:
        if not raw:
            return []
        raw = raw.strip()
        if raw.lower().startswith("nil") or not raw:
            return []
        # Strip label-fragment prefixes that sometimes leak from adjacent cells
        raw = re.sub(
            r"^(?:flowing|above|Danger|Level|Rivers|CWC|bulletin|issued|AM|Nil|[\s\-])+",
            "",
            raw,
            flags=re.IGNORECASE,
        ).strip()
        parts = [
            re.sub(r"\s+", " ", r).strip()
            for r in raw.split(",")
        ]
        return [
            p for p in parts
            if p and p.lower() != "nil" and len(p) <= 80
            and re.search(r"[A-Za-z]{3,}", p)  # must contain a real word
        ]

    if danger:
        result["rivers"]["danger"] = clean_rivers(danger.group(1) or danger.group(2))
    if flood:
        result["rivers"]["flood"] = clean_rivers(flood.group(1))
    # Rivers can span multiple lines — also look for continuation lines with
    # station patterns like `Xyz (Location)` immediately after the label.
    danger_block = slice_section(
        full,
        r"Rivers flowing above danger level",
        [r"Rivers flowing above highest flood level", r"District\s+No\. of"],
    )
    extra = re.findall(r"[A-Z][A-Za-z]+\s*\([^)]+\)", danger_block)
    if extra and not result["rivers"]["danger"]:
        result["rivers"]["danger"] = extra
    elif extra:
        # merge unique
        seen = set(result["rivers"]["danger"])
        for r in extra:
            if r not in seen:
                result["rivers"]["danger"].append(r)
                seen.add(r)

    # --- Affected districts list ---
    # Format: "12 Golaghat, Charaideo, Dibrugarh, Hojai, Nagaon, Biswanath, ..."
    # (Count on its own line, then the comma-separated names)
    ad_match = re.search(
        r"Name of Affected Districts.*?\n\s*(\d+)\s+([^\n]+)",
        full,
        re.DOTALL,
    )
    if ad_match:
        raw = ad_match.group(2)
        # Continuation line if names wrap
        m2 = re.search(
            r"Name of Affected Districts.*?\n\s*\d+\s+[^\n]+\n\s*([A-Za-z][A-Za-z ,\-\(\)]+)",
            full,
            re.DOTALL,
        )
        if m2 and "," in m2.group(1):
            raw += " " + m2.group(1)
        result["affectedDistricts"] = [
            d.strip() for d in raw.split(",") if d.strip() and len(d.strip()) <= 40
        ]

    # --- Population & Crop Area section ---
    pop_block = slice_section(
        full,
        r"Population\s+District\s+Male",
        [r"Relief\s+District\s+Total\s+Relief Camp", r"Inmates\s+In\s+Relief"],
    )
    if not pop_block:
        # fallback: any 'Population' near 'And Crop'
        pop_block = slice_section(
            full,
            r"Population\s+District\s+Male|And Crop\s+Area",
            [r"Relief\s+District", r"Inmates\s+In"],
        )
    # Iterate line-by-line so we grab per-district totals AND collect circle details
    pop_data: dict[str, dict[str, Any]] = {}
    current_district: str | None = None
    detail_buffer: list[str] = []

    def flush_detail(district: str | None, buf: list[str]) -> None:
        if not district or district not in pop_data:
            return
        buf_text = " ".join(buf)
        circles = []
        for m in CIRCLE_DETAIL_RE.finditer(buf_text):
            circles.append(
                {
                    "circle": m.group(1).strip(),
                    "population": to_int(m.group(2)),
                    "cropArea": to_float(m.group(3)),
                }
            )
        pop_data[district]["circles"] = circles

    for raw_line in pop_block.splitlines():
        line = raw_line.strip()
        m = POP_LINE_RE.match(raw_line)
        if m:
            flush_detail(current_district, detail_buffer)
            current_district = m.group(1)
            pop_data[current_district] = {
                "male": to_int(m.group(2)),
                "female": to_int(m.group(3)),
                "children": to_int(m.group(4)),
                "population": to_int(m.group(5)),
                "cropArea": to_float(m.group(6)),
                "circles": [],
            }
            detail_buffer = [line]
        elif current_district and line and not line.startswith("Total"):
            detail_buffer.append(line)
        elif line.startswith("Total"):
            flush_detail(current_district, detail_buffer)
            current_district = None
            detail_buffer = []
    flush_detail(current_district, detail_buffer)
    result["population"] = pop_data

    # --- Relief Camps opened section ---
    camps_block = slice_section(
        full,
        r"Relief\s+District\s+Total\s+Relief Camp|Relief Camps\s*/\s*Centres Opened",
        [
            r"Inmates\s+In\b",
            r"Non\s*Camp\b",
            r"Human\s+Lives",
            r"Animals\s+District",
            r"Animals\s+Affected",
        ],
    )
    camps_data: dict[str, dict[str, int]] = {}
    for raw_line in camps_block.splitlines():
        m = CAMP_LINE_RE.match(raw_line)
        if not m:
            continue
        d = m.group(1)
        total = to_int(m.group(2))
        rc = to_int(m.group(3))
        prev = camps_data.get(d, {"total": 0, "rc": 0})
        camps_data[d] = {
            "total": max(prev["total"], total),
            "rc": max(prev["rc"], rc),
        }
    # Store both — "reliefCamps" is Relief Camp column proper; "campsAndCentres" total.
    result["reliefCamps"] = {k: v["rc"] for k, v in camps_data.items()}
    result["campsAndCentres"] = {k: v["total"] for k, v in camps_data.items()}

    # --- Inmates in Relief Camps (state-level totals per district) ---
    # The "Non Camp Inmates" section that follows uses a different column
    # order — we terminate BEFORE reaching it to keep numbers clean.
    inmates_block = slice_section(
        full,
        r"Inmates\s+In\b",
        [
            r"Non\s*Camp\b",
            r"Human\s+Lives",
            r"Animals\s+District",
            r"Animals\s+Affected",
        ],
    )
    inmates_data: dict[str, int] = {}
    for raw_line in inmates_block.splitlines():
        m = re.match(rf"^\s*({DISTRICT_NAMES_RE})\s+(\d[\d,]*)\b", raw_line)
        if m:
            # Inmates in Relief Camps is the first number after district
            inmates_data[m.group(1)] = max(
                inmates_data.get(m.group(1), 0), to_int(m.group(2))
            )
    result["camps"] = inmates_data

    # --- Human Lives Lost ---
    hll_block = slice_section(
        full,
        r"Human\s+Lives\s+Lost",
        [
            r"Human\s+Lives\s+Missing",
            r"Animals\s+Affected",
            r"Animals\s+Washed",
            r"Animals\s+District",
        ],
    )
    hll_data: dict[str, int] = {}
    for raw_line in hll_block.splitlines():
        m = HLL_LINE_RE.match(raw_line)
        if m:
            hll_data[m.group(1)] = to_int(m.group(2))
    result["hll"] = hll_data

    # --- Villages Affected ---
    villages_block = slice_section(
        full,
        r"Villages\s+District\s+Total|Villages\s+Affected",
        [
            r"Population\s+District",
            r"And Crop",
            r"Population\s+And\s+Crop",
            r"Relief\s+District",
        ],
    )
    villages_data: dict[str, int] = {}
    for raw_line in villages_block.splitlines():
        m = re.match(rf"^\s*({DISTRICT_NAMES_RE})\s+(\d[\d,]*)\s", raw_line)
        if m:
            villages_data[m.group(1)] = to_int(m.group(2))
    result["villages"] = villages_data

    return result


# ---------------------------------------------------------------------------
# Transform → React app schemas
# ---------------------------------------------------------------------------
def severity_for(population: int, camps: int, is_affected: bool) -> str:
    if population >= 10_000 or camps >= 5:
        return "severe"
    if population >= 1_000 or camps >= 1:
        return "moderate"
    if population > 0 or is_affected:
        return "waterlogging"
    return "normal"


def flood_status_for(severity: str) -> str:
    return {
        "severe": "flooded",
        "moderate": "waterlogging",
        "waterlogging": "waterlogging",
        "normal": "safe",
    }[severity]


def rivers_for_district(rivers: dict[str, list[str]], district: str) -> str | None:
    """Return CWC river names that mention this district (or station in it).

    Official ASDMA/CWC lines look like ``Dikhou (Sivasagar)``. We only attach a
    river when the parenthetical or name clearly matches the district — never
    invent a default river for every district.
    """
    matched: list[str] = []
    d_key = district.lower().replace(" ", "")
    aliases = {
        "kamrupmetro": "kamrupmetropolitan",
        "sribhumi": "karimganj",
        "southsalmaramankachar": "southsalmara",
    }
    d_keys = {d_key, aliases.get(d_key, d_key)}

    for raw in rivers.get("flood", []) + rivers.get("danger", []):
        m = re.search(r"\(([^)]+)\)", raw)
        loc_raw = (m.group(1) if m else "").strip()
        loc = loc_raw.lower().replace(" ", "")
        # Ignore single-letter station suffixes like "(S)"
        if len(loc) < 4:
            loc = ""
        name = raw.split("(")[0].strip()
        river_key = re.sub(r"[^a-z]", "", raw.lower())

        if loc and any(k and (k in loc or loc in k) for k in d_keys if len(k) >= 4):
            if name and name not in matched:
                matched.append(name)
        # Station / district name equality (e.g. SRIBHUMI)
        elif any(k and len(k) >= 6 and k in river_key for k in d_keys):
            if name and name not in matched:
                matched.append(name)

    return ", ".join(matched) if matched else None


def build_datasets(parsed: dict[str, Any], report_date: dt.date, pdf_url: str) -> dict[str, Any]:
    last_updated = dt.datetime.combine(report_date, dt.time(8, 0)).isoformat() + "Z"
    scraped_at = dt.datetime.utcnow().isoformat(timespec="seconds") + "Z"

    affected_names = set(parsed["affectedDistricts"])
    all_names = set(parsed["population"].keys()) | affected_names | set(parsed["reliefCamps"].keys())

    districts_out: list[dict[str, Any]] = []
    flood_reports_out: list[dict[str, Any]] = []
    relief_camps_out: list[dict[str, Any]] = []

    for name in sorted(all_names):
        pop = parsed["population"].get(name, {})
        population = int(pop.get("population", 0))
        camps = int(parsed["reliefCamps"].get(name, 0))
        inmates = int(parsed["camps"].get(name, 0))
        crop_area = float(pop.get("cropArea", 0.0))
        villages = int(parsed["villages"].get(name, 0))
        circles = pop.get("circles", []) or []
        is_affected = name in affected_names
        sev = severity_for(population, camps, is_affected)

        # Human lives lost from this month/day
        hll = int(parsed["hll"].get(name, 0))

        d_slug = slugify(name)
        coords = coords_for(name)

        river_names = rivers_for_district(parsed["rivers"], name)

        districts_out.append(
            {
                "id": d_slug,
                "name": name,
                # Impact level derived from ASDMA population/camp counts (not an official severity code)
                "severity": sev,
                "affectedVillages": villages or len([c for c in circles if c["population"] > 0]),
                "river": river_names,
                "populationAffected": population,
                "reliefCamps": camps,
                "campInmates": inmates,
                "cropAreaHa": crop_area,
                "humanLivesLost": hll,
                "lastUpdated": last_updated,
                "coordinates": coords,
                "coordinatesNote": "Approximate district headquarters location",
                "source": "ASDMA Daily Flood Report (SDRF/DFR)",
            }
        )

        # Skip unaffected districts from map reports
        if sev == "normal" and population == 0 and camps == 0:
            continue

        status = flood_status_for(sev)

        # One map pin per district at HQ coords — never invent jittered circle pins.
        # Circle-level ASDMA numbers stay in the description when available.
        circle_bits = []
        for c in circles:
            if c["population"] <= 0 and c["cropArea"] <= 0:
                continue
            bit = f"{c['circle']}: {c['population']:,} people"
            if c["cropArea"] > 0:
                bit += f", {c['cropArea']:g} ha crop"
            circle_bits.append(bit)

        description = (
            f"ASDMA report {report_date.strftime('%d %b %Y')}: "
            f"{population:,} people affected, {villages} villages, {camps} relief camps."
        )
        if circle_bits:
            description += " Revenue circles — " + "; ".join(circle_bits) + "."

        flood_reports_out.append(
            {
                "id": f"asdma-{d_slug}",
                "district": name,
                "districtId": d_slug,
                "location": f"{name} district",
                "status": status,
                "description": description,
                "lastUpdated": last_updated,
                "coordinates": coords,
                "coordinatesNote": "Approximate district headquarters location",
                "source": "ASDMA Daily Flood Report",
            }
        )

        # District-level camp totals only — individual camp addresses are not in the state PDF
        if camps > 0:
            relief_camps_out.append(
                {
                    "id": f"asdma-camp-{d_slug}",
                    "name": f"{name} — district relief camps (total)",
                    "district": name,
                    "districtId": d_slug,
                    "campCount": camps,
                    "summary": (
                        f"{camps} relief camp(s) reported open in {name} district "
                        f"with {inmates:,} inmates (ASDMA {report_date.strftime('%d %b %Y')}). "
                        f"Individual camp addresses are published by the District Administration — "
                        f"call District Control Room (1077)."
                    ),
                    "campInmates": inmates,
                    "phone": "1077",
                    "coordinates": coords,
                    "coordinatesNote": "Approximate district headquarters location",
                    "source": "ASDMA Daily Flood Report",
                }
            )

    total_pop = sum(d["populationAffected"] for d in districts_out)
    total_camps = sum(d["reliefCamps"] for d in districts_out)
    total_inmates = sum(d["campInmates"] for d in districts_out)
    flooded_count = sum(1 for d in districts_out if d["severity"] != "normal")

    stats = {
        "floodedDistricts": flooded_count,
        "reliefCamps": total_camps,
        "lastUpdated": last_updated,
        "peopleAffected": total_pop,
        "campInmates": total_inmates,
        "activeAlerts": len(parsed["rivers"]["danger"]) + len(parsed["rivers"]["flood"]),
        "riverWarnings": len(parsed["rivers"]["danger"]) + len(parsed["rivers"]["flood"]),
        "source": "ASDMA Daily Flood Report (SDRF/DFR)",
        "period": report_date.isoformat(),
        "reportDate": report_date.isoformat(),
    }

    # River / impact alerts from ASDMA+CWC only (no fabricated IMD forecasts)
    weather = [
        {
            "id": "asdma-cwc-danger",
            "type": "river-level",
            "title": "Rivers Above Danger Level",
            "level": "red" if parsed["rivers"]["danger"] else "green",
            "value": (
                f"{len(parsed['rivers']['danger'])} rivers"
                if parsed["rivers"]["danger"]
                else "None"
            ),
            "unit": "CWC bulletin · 8 AM (via ASDMA)",
            "description": (
                ", ".join(parsed["rivers"]["danger"])
                if parsed["rivers"]["danger"]
                else "No rivers flowing above danger level as per today's CWC bulletin."
            ),
            "validUntil": last_updated,
            "source": "CWC via ASDMA Daily Flood Report",
        },
        {
            "id": "asdma-cwc-flood",
            "type": "river-level",
            "title": "Rivers Above Highest Flood Level",
            "level": "red" if parsed["rivers"]["flood"] else "green",
            "value": (
                f"{len(parsed['rivers']['flood'])} rivers"
                if parsed["rivers"]["flood"]
                else "None"
            ),
            "unit": "CWC bulletin · 8 AM (via ASDMA)",
            "description": (
                ", ".join(parsed["rivers"]["flood"])
                if parsed["rivers"]["flood"]
                else "No rivers flowing above highest flood level today."
            ),
            "validUntil": last_updated,
            "source": "CWC via ASDMA Daily Flood Report",
        },
        {
            "id": "asdma-impact",
            "type": "impact",
            "title": "Flood Impact Snapshot",
            "level": "orange" if flooded_count >= 5 else "warning",
            "value": f"{flooded_count} districts",
            "unit": f"{total_pop:,} people affected",
            "description": (
                f"ASDMA report as on {report_date.strftime('%d %b %Y')}: "
                f"{total_camps} relief camps housing {total_inmates:,} inmates."
            ),
            "validUntil": last_updated,
            "source": "ASDMA Daily Flood Report",
        },
    ]

    updates = [
        {
            "id": f"asdma-{report_date.isoformat()}",
            "title": f"ASDMA Daily Flood Report — {report_date.strftime('%d %b %Y')}",
            "date": last_updated,
            "source": "ASDMA / SDRF",
            "summary": (
                f"{flooded_count} districts affected. "
                f"{total_pop:,} people affected across "
                f"{sum(d['affectedVillages'] for d in districts_out)} villages. "
                f"{total_camps} relief camps with {total_inmates:,} inmates. "
                + (
                    "Rivers above danger level: "
                    + ", ".join(parsed["rivers"]["danger"]) + ". "
                    if parsed["rivers"]["danger"]
                    else ""
                )
                + f"Source: {pdf_url}"
            ),
        },
    ]
    if parsed["rivers"]["danger"]:
        updates.append(
            {
                "id": f"cwc-danger-{report_date.isoformat()}",
                "title": "CWC: rivers flowing above danger level",
                "date": last_updated,
                "source": "CWC via ASDMA",
                "summary": ", ".join(parsed["rivers"]["danger"]),
            }
        )

    meta = {
        "scrapedAt": scraped_at,
        "period": report_date.isoformat(),
        "reportDate": report_date.isoformat(),
        "floodDataOrigin": "asdma-daily-pdf",
        "pdfUrl": pdf_url,
        "sources": [
            {
                "name": "ASDMA / SDRF Daily Flood Report",
                "url": "https://sdrf.assam.gov.in/dfr/",
                "notes": "Official Daily Flood Report portal (DRIMS-backed).",
            },
            {
                "name": "ASDMA website",
                "url": "https://asdma.assam.gov.in",
                "notes": "Toll-free numbers, safety tips and disaster info.",
            },
        ],
        "counts": {
            "districts": len(districts_out),
            "floodReports": len(flood_reports_out),
            "reliefCamps": len(relief_camps_out),
            "updates": len(updates),
        },
    }

    return {
        "districts": districts_out,
        "floodReports": flood_reports_out,
        "reliefCamps": relief_camps_out,
        "stats": stats,
        "weather": weather,
        "updates": updates,
        "meta": meta,
    }


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"  ✓ Wrote {path.relative_to(ROOT)}")


def build_history_entry(data: dict[str, Any], parsed: dict[str, Any], report_date: dt.date) -> dict[str, Any]:
    """Compact snapshot used for trends, comparison and timeline."""
    top = sorted(
        data["districts"],
        key=lambda d: d.get("populationAffected", 0),
        reverse=True,
    )[:10]
    return {
        "date": report_date.isoformat(),
        "scrapedAt": data["meta"]["scrapedAt"],
        "stats": {
            "peopleAffected": data["stats"]["peopleAffected"],
            "floodedDistricts": data["stats"]["floodedDistricts"],
            "reliefCamps": data["stats"]["reliefCamps"],
            "campInmates": data["stats"].get("campInmates", 0),
            "riverWarnings": data["stats"].get("activeAlerts", 0),
            "activeAlerts": data["stats"].get("activeAlerts", 0),
        },
        "rivers": {
            "danger": parsed.get("rivers", {}).get("danger", []),
            "flood": parsed.get("rivers", {}).get("flood", []),
        },
        "topDistricts": [
            {
                "id": d["id"],
                "name": d["name"],
                "populationAffected": d["populationAffected"],
                "severity": d["severity"],
                "reliefCamps": d.get("reliefCamps", 0),
                "affectedVillages": d.get("affectedVillages", 0),
                "campInmates": d.get("campInmates", 0),
                "humanLivesLost": d.get("humanLivesLost", 0),
            }
            for d in top
        ],
        "districts": data["districts"],
        "summary": {
            "affectedNames": parsed.get("affectedDistricts", []),
        },
    }


def upsert_history(entry: dict[str, Any]) -> None:
    history_path = DATA_DIR / "history.json"
    if history_path.exists():
        try:
            history = json.loads(history_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            history = {"reports": []}
    else:
        history = {"reports": []}

    reports = [r for r in history.get("reports", []) if r.get("date") != entry["date"]]
    reports.append(entry)
    reports.sort(key=lambda r: r.get("date", ""), reverse=True)
    history = {
        "reports": reports,
        "updatedAt": dt.datetime.utcnow().isoformat(timespec="seconds") + "Z",
    }
    write_json(history_path, history)


def process_one_day(
    target: dt.date,
    lookback: int,
    *,
    archive_only: bool,
    keep_existing_camps: bool,
) -> dt.date:
    pdf_bytes, report_date, date_str = fetch_pdf(target, lookback)

    RAW_DIR.mkdir(parents=True, exist_ok=True)
    pdf_path = RAW_DIR / f"asdma_flood_{date_str}.pdf"
    pdf_path.write_bytes(pdf_bytes)
    print(f"  ✓ Saved PDF → {pdf_path.relative_to(ROOT)}")

    parsed = parse_pdf(pdf_path)
    if parsed.get("reportDate"):
        report_date = parsed["reportDate"]

    print(
        f"\nParsed report {report_date.isoformat()}: "
        f"{len(parsed['affectedDistricts'])} affected districts, "
        f"{sum(d['population'] for d in parsed['population'].values()):,} people, "
        f"{sum(parsed['reliefCamps'].values())} relief camps, "
        f"{len(parsed['rivers']['danger'])} rivers > danger."
    )

    pdf_url = "https://sdrf.assam.gov.in/dfr/"
    data = build_datasets(parsed, report_date, pdf_url)
    upsert_history(build_history_entry(data, parsed, report_date))

    if not archive_only:
        write_json(DATA_DIR / "districts.json", data["districts"])
        write_json(DATA_DIR / "floodReports.json", data["floodReports"])
        if data["reliefCamps"] and not keep_existing_camps:
            write_json(DATA_DIR / "reliefCamps.json", data["reliefCamps"])
        write_json(DATA_DIR / "stats.json", data["stats"])
        write_json(DATA_DIR / "weather.json", data["weather"])
        write_json(DATA_DIR / "updates.json", data["updates"])
        write_json(DATA_DIR / "meta.json", data["meta"])
        print(
            f"\n✓ Live dashboard updated from ASDMA report dated "
            f"{report_date.strftime('%d %b %Y')}."
        )
    else:
        print(f"\n✓ Archived {report_date.isoformat()} into history (live files unchanged).")

    return report_date


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--date", help="Target date YYYY-MM-DD (defaults to today, will walk backwards).")
    parser.add_argument("--lookback", type=int, default=7, help="Days to walk back (default 7).")
    parser.add_argument("--keep-existing-camps", action="store_true",
                        help="Keep existing reliefCamps.json instead of overwriting with district-aggregate.")
    parser.add_argument(
        "--archive-only",
        action="store_true",
        help="Only append to history.json — do not overwrite live dashboard JSON.",
    )
    parser.add_argument(
        "--seed-history",
        type=int,
        metavar="N",
        help="Also archive up to N previous report days into history for trends.",
    )
    args = parser.parse_args()

    target = dt.date.fromisoformat(args.date) if args.date else dt.date.today()

    print(f"FloodAssist Assam — ASDMA daily PDF scraper")
    print(f"Target: {target.isoformat()}, lookback: {args.lookback} day(s)")

    latest = process_one_day(
        target,
        args.lookback,
        archive_only=args.archive_only,
        keep_existing_camps=args.keep_existing_camps,
    )

    if args.seed_history and args.seed_history > 0:
        print(f"\n→ Seeding up to {args.seed_history} earlier report day(s)…")
        cursor = latest - dt.timedelta(days=1)
        collected = 0
        attempts = 0
        while collected < args.seed_history and attempts < args.seed_history * 3:
            attempts += 1
            try:
                found = process_one_day(
                    cursor,
                    lookback=2,
                    archive_only=True,
                    keep_existing_camps=True,
                )
                collected += 1
                cursor = found - dt.timedelta(days=1)
            except Exception as err:
                print(f"  ⚠ {cursor.isoformat()}: {err}")
                cursor = cursor - dt.timedelta(days=1)

    return 0


if __name__ == "__main__":
    sys.exit(main())
