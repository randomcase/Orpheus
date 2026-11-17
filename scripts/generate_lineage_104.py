#!/usr/bin/env python3
"""Generate data/06_generational_lineage_104.json modeling 104 generational links (565 BCE - 2026 CE)."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TIMELINE_PATH = ROOT / "data" / "01_master_timeline.json"
OUT_PATH = ROOT / "data" / "06_generational_lineage_104.json"

MYTHEME_KEYS = [
    "threshold_voice",
    "argonaut_voyage",
    "mystery_passport",
    "katabasis_descent",
    "named_eurydice",
    "taboo_c331_glance",
    "sparagmos_head_oracle",
    "redemptive_return",
]

ERA_RANGES = [
    (-565, -460, "Archaic_Greece"),
    (-459, -350, "Classical_Greece"),
    (-349, -41, "Hellenistic_Orphic"),
    (-40, 150, "Augustan_Rome"),
    (151, 499, "Early_Christian_Patristic"),
    (500, 1459, "Medieval_Catholic"),
    (1460, 1749, "Renaissance_Baroque"),
    (1750, 1984, "Enlightenment_Modern"),
    (1985, 2026, "Contemporary_To_2026"),
]

# Generation pins where a parallel-era stream is historically locked.
FORCED_STREAM = {
    22: "latin_monastic",   # Virgil (29 BCE)
    23: "latin_monastic",   # Horace (15 BCE) & Ovid (8 CE)
    24: "greek_byzantine",  # First Imperial Greek branch from G-021
    31: "greek_byzantine",  # Clement of Alexandria (195 CE)
    33: "greek_byzantine",  # Dura-Europos (244 CE) & Roman Catacombs Greek/Latin synthesis
    37: "greek_byzantine",  # Orphic Hymns (350 CE) & Eusebius (336 CE)
    44: "latin_monastic",   # Boethius (524 CE)
    76: "latin_monastic",   # Ovide Moralise (1320 CE) & Sir Orfeo (1330 CE)
}

CAPSULE_ORIGINS = {
    1: "Delphi Sicyonian Limestone Metope (ΟΡΦΑΣ, c. 565 BCE)",
    4: "Three Olbia Pontica Inscribed Bone Tablets (c. 485 BCE)",
    7: "Hipponion & Calabrian Gold Funeral Lamella (c. 400 BCE)",
    10: "Derveni Carbonized Funeral Pyre Papyrus Scroll (c. 340 BCE)",
}

CAPSULE_RECOVERIES = {
    99: (["G-001"], "1894 French excavation of the Delphi ΟΡΦΑΣ metope restores pre-tragedy Archaic visual evidence"),
    101: (["G-004"], "1951 excavation of the Olbia Bone Plaques reveals 5th-c. BCE 'ΒΙΟΣ ΘΑΝΑΤΟΣ ΒΙΟΣ · ΟΡΦΙΚΟΙ' liturgy"),
    102: (["G-007", "G-010"], "1962 Derveni Papyrus & 1969 Hipponion Gold Lamella recoveries bypass ~90 living generations"),
    103: (["G-007"], "1985 Pelinna ivy-leaf gold lamellae corroborate subterranean Dionysiac-Orphic afterlife passports"),
}

WITNESS_LABELS = {
    1: "Delphic Sanctuary Masons & Ibycus of Rhegium (TL-01, TL-02)",
    2: "Onomacritus & Peisistratid Oracle Recension at Athens (TL-03)",
    3: "Simonides of Ceos & Late Archaic Symposiasts (TL-04)",
    4: "Olbia Pontica Orphic-Dionysiac Brotherhood (TL-05)",
    5: "Pindar of Thebes, Aeschylus & Polygnotus of Thasos (TL-06, TL-07)",
    6: "Euripides & Classical Athenian Tragic Stage (TL-08)",
    7: "Aristophanes & Hipponion Gold-Tablet Initiates (TL-09, TL-11)",
    8: "Plato's Academy & Athenian Philosophical Dialectics (TL-10)",
    10: "Derveni Funeral-Pyre Ritualist & Commentator (TL-12)",
    13: "Apollonius of Rhodes at the Ptolemaic Mouseion (TL-13)",
    19: "Pseudo-Moschus ('Lament for Bion') Naming Eurydice",
    22: "Publius Vergilius Maro — Georgics IV (TL-15)",
    23: "Horace & Publius Ovidius Naso — Metamorphoses X (TL-16, TL-17)",
    31: "Clement of Alexandria — Protrepticus Ch. 1 (TL-18)",
    33: "Dura-Europos Artisans & Roman Catacomb Painters (TL-19, TL-20)",
    37: "Anatolian Orphic Hymns Guild & Eusebius of Caesarea (TL-14, TL-21)",
    44: "Anicius Manlius Severinus Boethius at Pavia (TL-22)",
    76: "Ovide Moralisé Master, Pierre Bersuire & Auchinleck Poet (TL-23, TL-24)",
    82: "Marsilio Ficino & Angelo Poliziano in Florence/Mantua (TL-25, TL-26)",
    87: "Peri, Rinuccini & Claudio Monteverdi — Florentine/Mantuan Opera (TL-27, TL-28)",
    94: "Christoph Willibald Gluck & Calzabigi in Vienna/Paris (TL-29)",
    97: "Jacques Offenbach — Théâtre des Bouffes-Parisiens (TL-30)",
    99: "French Delphic Excavators & Fin-de-Siècle Symbolist Circle",
    100: "Rainer Maria Rilke — Sonnets to Orpheus (TL-31)",
    101: "Jean Cocteau, Vinicius de Moraes, Marcel Camus & Olbia Excavators (TL-32, TL-33)",
    102: "Thessaloniki Derveni Excavators & Calabrian Epigraphers (1962–1969)",
    103: "Harrison Birtwistle, Philip Glass, Sarah Ruhl & Pelinna Editors (TL-34, TL-35)",
    104: "Anaïs Mitchell, Céline Sciamma, Digital Derveni & Global Audiences (TL-36, TL-37)",
}

CUSTODIAN_NAMES = {
    "hellenic_archaic": [
        "Attic Rhapsodes & Lyre-Players of the Dionysia",
        "South Italian Pythagorean-Orphic Mystery Circles",
        "Alexandrian Mouseion Papyrologists (Zenodotus–Eratosthenes)",
        "Rhodian & Pergamene Grammatical Copyists",
        "Hellenistic Grammarians (Aristophanes of Byzantium–Didymus)",
    ],
    "latin_monastic": [
        "Imperial Roman Grammatici & School Copyists of Virgil",
        "Late Latin Grammarians (Servius & Macrobius Tradition)",
        "Vivarium Abbey Scriptorium (Cassiodorus Legacy)",
        "Monte Cassino & Bobbio Benedictine Parchment Scriptoria",
        "Northumbrian & Irish Monastic Copyists (Bede Circle)",
        "Carolingian Palace School at Aachen (Alcuin of York)",
        "Reichenau, St. Gall & Cluny Cloister Libraries",
        "Cathedral Schools of Chartres, Orléans & Paris (Loire Poets)",
        "Dominican & Franciscan University Glossators",
    ],
    "greek_byzantine": [
        "Greco-Roman Epigraphers & Second Sophistic Orators",
        "Alexandrian & Caesarean Patristic Catenae Scribes",
        "Athenian & Alexandrian Neoplatonists (Proclus & Damascius Tradition)",
        "Constantinopolitan Justinianic Imperial Codices",
        "Studite Monastery Minuscule Scriptorium (Script Reform)",
        "Circle of Patriarch Photius & the Suda Lexicographers",
        "Tzetzes & Komnenian Byzantine Classical Scholars",
        "Palaeologan Scriptoria & 1453 Émigré Greek Scholars (Bessarion)",
    ],
    "vernacular_stage": [
        "Venetian Aldine Press Editors & Florentine Camerata Hosts",
        "European Court Librettists & Baroque Conservatories",
        "18th–19th c. European Classical Lexicographers & Opera Houses",
    ],
}

CARRIER_PROFILES = {
    "hellenic_archaic": {
        "substrate": "Papyrus scroll (supplemented underground by stone, bone & gold foil)",
        "language_gate": "Archaic Doric / Classical Attic -> Hellenistic Koine Greek",
        "redundancy_tier": "Fragile (small ritual brotherhoods & Mouseion rolls)",
        "host_institution": "Athenian theater archives, private teletai, & Ptolemaic Library",
    },
    "latin_monastic": {
        "substrate": "Vellum & parchment codices (uncial -> Carolingian minuscule)",
        "language_gate": "Classical Latin -> Medieval Ecclesiastical Latin / Vernaculars",
        "redundancy_tier": "Moderate-High (monastic & cathedral curriculum canons)",
        "host_institution": "Benedictine & Dominican Abbeys; European cathedral schools",
    },
    "greek_byzantine": {
        "substrate": "Papyrus codex -> Byzantium vellum minuscule manuscripts",
        "language_gate": "Koine Greek -> Byzantine Literary Greek",
        "redundancy_tier": "Low-Moderate (vulnerable to iconoclasm & 1204/1453 sieges)",
        "host_institution": "Constantinople imperial libraries, monasteries & Patristic catenae",
    },
    "vernacular_stage": {
        "substrate": "Movable-type printed scores, libretti & national dictionaries",
        "language_gate": "Neo-Latin & Greek -> Italian, French, German, English print",
        "redundancy_tier": "High (multi-city European print runs)",
        "host_institution": "Medici/Mantua courts, Venetian presses, Paris & Vienna stages",
    },
    "global_digital": {
        "substrate": "Global print, celluloid cinema, digital repositories & multispectral HSI",
        "language_gate": "Multilingual global vernaculars + Unicode Polytonic Greek",
        "redundancy_tier": "Extreme (distributed global servers + excavated artifacts)",
        "host_institution": "Public stages, cinema archives, universities & open-source repositories",
    },
}

LOST_SIBLINGS_BY_ERA = {
    "Archaic_Greece": "Lost Archaic Argonautica epics & pre-550 BCE Thracian oral hymns",
    "Classical_Greece": "Aeschylus's complete Bassarids tragedy & Polygnotus's mural at Delphi",
    "Hellenistic_Orphic": "Pre-Virgilian Hellenistic Orpheus poems of Phanocles & early Alexandrians",
    "Augustan_Rome": "Cornelius Gallus's erotic elegies & Imperial stage pantomimes of Orpheus",
    "Early_Christian_Patristic": "Most non-Christian Neoplatonic Orphic Rhapsodies burnt/un-copied after 529 CE",
    "Medieval_Catholic": "Numerous unglossed vernacular minstrel lays prior to Auchinleck MS",
    "Renaissance_Baroque": "Early ephemerally staged Mantuan intermezzi & unprinted Florentine airs",
    "Enlightenment_Modern": "Provincial 19th-c. parodies and damaged pre-digital silent-film prints",
    "Contemporary_To_2026": "Ephemeral regional productions archived only in partial performance notes",
}


def fmt_span(y0: int, y1: int) -> str:
    if y1 <= 0:
        return f"{abs(y0)}–{abs(y1)} BCE"
    if y0 < 0 and y1 > 0:
        return f"{abs(y0)} BCE–{y1} CE"
    return f"{y0}–{y1} CE"


def infer_era(y0: int, y1: int, milestones: list[dict]) -> str:
    if milestones:
        return milestones[0]["era"]
    mid = (y0 + y1) // 2
    for lo, hi, era in ERA_RANGES:
        if lo <= mid <= hi:
            return era
    return "Contemporary_To_2026"


def determine_stream(g: int) -> str:
    if g <= 21:
        return "hellenic_archaic"
    if g in FORCED_STREAM:
        return FORCED_STREAM[g]
    if g <= 81:
        return "latin_monastic" if g % 2 == 0 else "greek_byzantine"
    if g <= 98:
        return "vernacular_stage"
    return "global_digital"


def compute_mythemes(g: int, stream: str) -> tuple[dict[str, int], list[str]]:
    vec = {k: 0 for k in MYTHEME_KEYS}
    introduced: list[str] = []

    vec["threshold_voice"] = 1
    vec["argonaut_voyage"] = 1
    if g == 1:
        introduced.extend(["threshold_voice", "argonaut_voyage"])

    if g >= 2:
        if stream == "greek_byzantine" and g in (31, 37):
            vec["mystery_passport"] = -1  # Patristic critique/reinterpretation of pagan mysteries
        elif stream == "latin_monastic" and g >= 44:
            vec["mystery_passport"] = -1  # Christianized monastic allegory replaces Dionysiac passport
        elif stream == "vernacular_stage" and 84 <= g <= 98:
            vec["mystery_passport"] = 0
        else:
            vec["mystery_passport"] = 1
        if g == 2:
            introduced.append("mystery_passport")

    if g >= 5:
        vec["sparagmos_head_oracle"] = -1 if g == 87 else (0 if g in (76, 94, 97) else 1)
        if g == 5:
            introduced.append("sparagmos_head_oracle")

    if g >= 6:
        vec["katabasis_descent"] = 1
        if g == 6:
            introduced.append("katabasis_descent")

    if g >= 19:
        if g == 104:
            vec["named_eurydice"] = 1
        elif stream == "greek_byzantine" and g == 37:
            vec["named_eurydice"] = 0
        else:
            vec["named_eurydice"] = 1
        if g == 19:
            introduced.append("named_eurydice")

    if g >= 22:
        if stream == "latin_monastic":
            vec["taboo_c331_glance"] = -1 if g == 76 else 1
        elif stream == "greek_byzantine":
            vec["taboo_c331_glance"] = 0  # Eastern tradition centers Hymns & Logos rather than Latin glance tragedy
        elif g in (87, 94, 97, 104):
            vec["taboo_c331_glance"] = -1 if g in (94, 97, 104) else 1
        else:
            vec["taboo_c331_glance"] = 1
        if g == 22:
            introduced.append("taboo_c331_glance")

    if g >= 6:
        if g == 6:
            vec["redemptive_return"] = 1
            introduced.append("redemptive_return")
        elif 8 <= g <= 21:
            vec["redemptive_return"] = -1
        elif stream == "latin_monastic":
            vec["redemptive_return"] = 1 if g == 76 else -1
        elif stream == "greek_byzantine":
            vec["redemptive_return"] = 1  # Christological victory / Hymnic cosmic harmony
        elif g in (87, 94, 100, 101):
            vec["redemptive_return"] = 1
        elif g == 104:
            vec["redemptive_return"] = -1  # Hadestown tragic-ritual & Sandman release polarity
        else:
            vec["redemptive_return"] = -1

    return vec, introduced


def build_lineage() -> list[dict]:
    timeline = json.loads(TIMELINE_PATH.read_text(encoding="utf-8"))
    by_gen: dict[int, list[dict]] = {g: [] for g in range(1, 105)}
    for item in timeline:
        gen = ((int(item["year"]) + 565) // 25) + 1
        if not 1 <= gen <= 104:
            raise ValueError(f"Timeline {item['id']} ({item['year']}) mapped to out-of-range gen {gen}")
        by_gen[gen].append(item)

    nodes: list[dict] = []
    last_latin_id = None
    last_greek_id = None
    custodian_counters = {k: 0 for k in CUSTODIAN_NAMES}

    for g in range(1, 105):
        gid = f"G-{g:03d}"
        y0 = -565 + (g - 1) * 25
        y1 = min(2026, y0 + 24)
        span = fmt_span(y0, y1)
        milestones = by_gen[g]
        era = infer_era(y0, y1, milestones)
        stream = determine_stream(g)

        if g == 1:
            upstream = []
        elif g <= 21:
            upstream = [f"G-{g - 1:03d}"]
        elif 22 <= g <= 81:
            if stream == "latin_monastic":
                upstream = [last_latin_id if last_latin_id else "G-021"]
                last_latin_id = gid
            else:
                upstream = [last_greek_id if last_greek_id else "G-021"]
                last_greek_id = gid
        elif g == 82:
            upstream = [x for x in (last_latin_id, last_greek_id) if x]
        else:
            upstream = [f"G-{g - 1:03d}"]

        capsule_upstream = CAPSULE_RECOVERIES[g][0] if g in CAPSULE_RECOVERIES else []
        is_capsule_origin = g in CAPSULE_ORIGINS

        if milestones or g in WITNESS_LABELS:
            role = "capsule_recovery" if g in (99, 102) else "mutation_witness"
        elif g in CAPSULE_RECOVERIES:
            role = "capsule_recovery"
        else:
            role = "silent_custodian"

        if g in WITNESS_LABELS:
            custodian = WITNESS_LABELS[g]
        else:
            pool = CUSTODIAN_NAMES.get(stream, CUSTODIAN_NAMES["vernacular_stage"])
            idx = custodian_counters.get(stream, 0) % len(pool)
            custodian_counters[stream] = custodian_counters.get(stream, 0) + 1
            custodian = f"{pool[idx]} (Gen #{g})"

        mythemes, introduced = compute_mythemes(g, stream)
        profile = CARRIER_PROFILES[stream]
        carrier = {
            "substrate": profile["substrate"],
            "language_gate": profile["language_gate"],
            "redundancy_tier": profile["redundancy_tier"],
            "host_institution": profile["host_institution"],
            "lost_siblings": LOST_SIBLINGS_BY_ERA[era],
        }

        if g in CAPSULE_ORIGINS:
            carrier["substrate"] = f"{CAPSULE_ORIGINS[g]} + contemporary papyrus copies"

        if g in CAPSULE_RECOVERIES:
            note = CAPSULE_RECOVERIES[g][1]
        elif milestones:
            titles = "; ".join(m["title"] for m in milestones)
            note = f"Direct witness link: {titles}."
        elif g == 19:
            note = "First surviving Greek attribution of the name 'Eurydice' as Orpheus's bride in the Lament for Bion (~100 BCE)."
        elif stream == "latin_monastic":
            note = "Western monastic copyist relay keeping Ovidian, Virgilian, and Boethian hexameters intact across political collapse."
        elif stream == "greek_byzantine":
            note = "Eastern Greek/Byzantine manuscript chain preserving Argonautic, Patristic, and Hymnic texts outside Rome."
        else:
            note = "Generational custodian link preserving inherited performance, print, or schoolroom editions across a 25-year span."

        nodes.append({
            "id": gid,
            "gen_number": g,
            "year_start": y0,
            "year_end": y1,
            "display_span": span,
            "era": era,
            "role": role,
            "primary_stream": stream,
            "upstream_ids": upstream,
            "capsule_upstream_ids": capsule_upstream,
            "is_capsule_origin": is_capsule_origin,
            "capsule_artifact": CAPSULE_ORIGINS.get(g, ""),
            "milestone_ids": [m["id"] for m in milestones],
            "custodian_or_witness": custodian,
            "introduced_mythemes": introduced,
            "mythemes": mythemes,
            "carrier": carrier,
            "transmission_note": note,
        })

    return nodes


def main() -> int:
    nodes = build_lineage()
    OUT_PATH.write_text(json.dumps(nodes, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    mapped = sum(len(n["milestone_ids"]) for n in nodes)
    print(f"OK: Generated {len(nodes)} generational links in {OUT_PATH.relative_to(ROOT)} covering {mapped} milestones.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
