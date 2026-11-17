#!/usr/bin/env python3
"""Provision and synchronize the 5-Pillar Orpheus Google Drive Archive."""

from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONFIG_PATH = ROOT / "config" / "google-suite.json"
DATA_DIR = ROOT / "data"
RESEARCH_DIR = ROOT / "research"
REPORTS_DIR = ROOT / "reports"
NOTEBOOK_PATH = ROOT / "notebooks" / "Orpheus_Diachronic_Go_Lab.ipynb"
SITE_BUNDLE_BUILDER = ROOT / "scripts" / "build_portal_and_report.py"


def resolve_cli(name: str) -> str:
    found = shutil.which(name)
    if found:
        return found
    if os.name == "nt":
        for ext in (".cmd", ".exe", ".bat"):
            cand = shutil.which(name + ext)
            if cand:
                return cand
    return name


def run_cli(cmd: list[str], cwd: Path = ROOT) -> subprocess.CompletedProcess[str]:
    resolved = [resolve_cli(cmd[0]), *cmd[1:]]
    proc = subprocess.run(
        resolved,
        cwd=cwd,
        text=True,
        encoding="utf-8",
        errors="replace",
        capture_output=True,
    )
    if proc.returncode != 0:
        raise RuntimeError(f"Command failed: {' '.join(cmd)}\nSTDOUT:\n{proc.stdout}\nSTDERR:\n{proc.stderr}")
    return proc


def extract_id(output: str) -> str:
    text = output.strip()
    try:
        obj = json.loads(text)
        if isinstance(obj, dict):
            for key in ("id", "fileId", "spreadsheetId", "documentId", "presentationId", "tabId"):
                if obj.get(key):
                    return str(obj[key])
    except json.JSONDecodeError:
        pass
    m = re.search(r'"(?:id|fileId|spreadsheetId|documentId|presentationId|tabId)"\s*:\s*"([^"]+)"', text)
    if m:
        return m.group(1)
    m = re.search(r"\b(?:id|ID|tabId|tab_id)\s*[:=]\s*([A-Za-z0-9._-]{3,})\b", text)
    if m:
        return m.group(1)
    m = re.search(r"\bt\.[A-Za-z0-9]+\b", text)
    if m:
        return m.group(0)
    m = re.search(r"(?:^|[\s(/])(1[A-Za-z0-9_-]{20,})(?:$|[\s)/])", text)
    if m:
        return m.group(1)
    raise RuntimeError(f"Could not extract Google ID from CLI output:\n{text}")


def ensure_drive_folders(cfg: dict) -> tuple[str, dict[str, str]]:
    drive = cfg.setdefault("drive", {})
    root = drive.setdefault("root_folder", {})
    root_id = root.get("id")
    if not root_id:
        proc = run_cli(["gdrive", "mutate", "mkdir", "Orpheus — Antiquity to 2026 Research Archive", "--json"])
        root_id = extract_id(proc.stdout)
        root["id"] = root_id
        root["url"] = f"https://drive.google.com/drive/folders/{root_id}"
        print(f"Created Drive Root Folder: {root['url']}")

    subfolders = drive.setdefault("subfolders", {})
    wanted = [
        "00_Diachronic_Datasets_And_Sheets",
        "01_Monographs_And_Catholic_Canon",
        "02_Time_Lapse_Briefings",
        "03_Go_Colab_And_Transliteration_Lab",
        "04_Automated_Telemetry_Reports",
    ]
    folder_ids: dict[str, str] = {}
    for name in wanted:
        entry = subfolders.get(name) or {}
        fid = entry.get("id")
        if not fid:
            proc = run_cli(["gdrive", "mutate", "mkdir", name, "--parent", root_id, "--json"])
            fid = extract_id(proc.stdout)
            subfolders[name] = {"id": fid, "url": f"https://drive.google.com/drive/folders/{fid}"}
            print(f"  Created Subfolder {name}: {fid}")
        folder_ids[name] = fid
    return root_id, folder_ids


def build_sheet_rows() -> dict[str, list[list[str]]]:
    bundle = json.loads(
        subprocess.check_output(
            ["go", "run", "./cmd/orpheus-engine", "--mode=enrich-json", "--data-dir=../data"],
            cwd=ROOT / "go-engine",
            text=True,
            encoding="utf-8",
        )
    )
    telemetry = json.loads((REPORTS_DIR / "latest-telemetry.json").read_text(encoding="utf-8"))

    timeline_rows = [[
        "ID", "Year", "Display_Date", "Era", "Title", "Creator_Or_Source",
        "Language", "Discovery_Or_Provenance", "Key_Shift", "Liturgical_Or_Religious_Role", "Societal_Context",
    ]]
    for x in bundle["timeline"]:
        timeline_rows.append([
            x["id"], str(x["year"]), x["display_date"], x["era"], x["title"], x["creator_or_source"],
            x["language"], x["discovery_or_provenance"], x["key_shift"],
            x["liturgical_or_religious_role"], x["societal_context"],
        ])

    translit_rows = [[
        "ID", "Work", "Locus", "Date", "Script_Type", "Original_Text",
        "ISO_843", "ALA_LC", "Attic_IPA", "Byzantine_Liturgical",
        "Classical_Latin", "Ecclesiastical_Latin", "Literal_Gloss", "English_Translation",
    ]]
    for x in bundle["transliterations"]:
        sys_res = x.get("systems") or {}
        translit_rows.append([
            x["id"], x["work"], x["locus"], x["date_label"], x["script_type"], x["original_text"],
            sys_res.get("iso_843", ""), sys_res.get("ala_lc", ""), sys_res.get("attic_ipa", ""),
            sys_res.get("byzantine_liturgical", ""), sys_res.get("classical_latin", ""),
            sys_res.get("ecclesiastical_latin", ""), x["literal_gloss"], x["english_translation"],
        ])

    lit_rows = [[
        "ID", "Tradition", "Period", "Artifact_Or_Text",
        "Theological_Mapping", "Ritual_Or_Liturgical_Use", "Christological_Comparison",
    ]]
    for x in bundle["liturgical_and_catholic"]:
        lit_rows.append([
            x["id"], x["tradition"], x["period"], x["artifact_or_text"],
            x["theological_mapping"], x["ritual_or_liturgical_use"], x["christological_comparison"],
        ])

    anthro_rows = [[
        "ID", "Culture_Or_Region", "Tradition_Or_Myth", "Figures",
        "Taboo_Mechanism", "Outcome_Of_Glance", "Scholar", "Structural_Meaning",
    ]]
    for x in bundle["anthropology_motif_c331"]:
        anthro_rows.append([
            x["id"], x["culture_or_region"], x["tradition_or_myth"], x["figures"],
            x["taboo_mechanism"], x["outcome_of_glance"], x["anthropologist_or_scholar"], x["structural_meaning"],
        ])

    rev_rows = [[
        "ID", "Year", "Work_And_Creator", "Medium",
        "Historical_Crisis_Or_Shift", "How_The_Ending_Changes", "Cultural_Impact",
    ]]
    for x in bundle["societal_revivals"]:
        rev_rows.append([
            x["id"], str(x["year"]), x["work_and_creator"], x["medium"],
            x["historical_crisis_or_shift"], x["how_the_ending_changes"], x["cultural_impact"],
        ])

    go = telemetry.get("go_engine", {})
    sb = telemetry.get("spring_boot", {})
    an = telemetry["corpus"]["analytics"]
    tel_rows = [
        ["Metric", "Value", "Notes"],
        ["Generated_UTC", str(telemetry.get("generated_at", "")), "Automated Orpheus telemetry compiler"],
        ["Chronological_Span", f"{abs(an['earliest_year'])} BCE - {an['latest_year']} CE", f"{an['span_years']} years"],
        ["Timeline_Count", str(an["timeline_count"]), "Archaic Greece through 2026 CE"],
        ["Transliteration_Passages", str(an["transliteration_count"]), "Enriched via Go 1.26 translit package"],
        ["Catholic_Liturgical_Records", str(an["liturgical_count"]), "Gold Lamellae through Medieval Catholic exegesis"],
        ["Anthropology_Motif_C331", str(an["anthropology_count"]), "Cross-cultural looking-back myths"],
        ["Societal_Revivals", str(an["revival_count"]), "1480 Poliziano to 2026 CE"],
        ["Go_Statement_Coverage_Pct", str(go.get("statements_pct")), "go test -coverprofile=coverage.out ./..."],
        ["Spring_Boot_JUnit_Total", str(sb.get("junit_total")), f"Failed: {sb.get('junit_failed')}"],
        ["Spring_Boot_JaCoCo_Line_Pct", str(sb.get("jacoco_line_pct")), "Gradle 8.14.2 + Java 21"],
    ]

    return {
        "01_Master_Timeline": timeline_rows,
        "02_Transliterations": translit_rows,
        "03_Liturgical_And_Catholic": lit_rows,
        "04_Anthropology_Motif_C331": anthro_rows,
        "05_Societal_Revivals": rev_rows,
        "06_CI_Telemetry": tel_rows,
    }


def ensure_file_in_folder(file_id: str, folder_id: str) -> None:
    info = json.loads(run_cli(["gdrive", "readonly", "info", file_id, "--json"]).stdout)
    parents = info.get("parents") or []
    if folder_id not in parents:
        run_cli(["gdrive", "mutate", "mv", file_id, folder_id])


def sync_master_sheet(cfg: dict, folder_id: str) -> None:
    sheet_cfg = cfg["suite"]["master_sheet"]
    sheet_id = sheet_cfg.get("id")
    tabs_data = build_sheet_rows()
    tab_names = list(tabs_data.keys())

    if not sheet_id:
        proc = run_cli(["gsheets", "mutate", "create", "--title", sheet_cfg["title"], "--json"])
        sheet_id = extract_id(proc.stdout)
        sheet_cfg["id"] = sheet_id
        sheet_cfg["url"] = f"https://docs.google.com/spreadsheets/d/{sheet_id}/edit"
        print(f"Created 6-Tab Master Sheet: {sheet_cfg['url']}")

    ensure_file_in_folder(sheet_id, folder_id)

    sheets_meta = json.loads(run_cli(["gsheets", "readonly", "list-sheets", sheet_id, "--json"]).stdout)
    existing_titles = {str(s.get("title")): int(s.get("id", s.get("sheetId", 0))) for s in sheets_meta if isinstance(s, dict)}
    if tab_names[0] not in existing_titles:
        for default_name in ("Sheet 1", "Sheet1"):
            if default_name in existing_titles:
                run_cli(["gsheets", "mutate", "rename-sheet", sheet_id, "--sheet-id", str(existing_titles[default_name]), "--title", tab_names[0]])
                break
    for tab_name in tab_names:
        if tab_name not in existing_titles and tab_name != tab_names[0]:
            run_cli(["gsheets", "mutate", "add-sheet", sheet_id, "--title", tab_name])

    sheets_meta = json.loads(run_cli(["gsheets", "readonly", "list-sheets", sheet_id, "--json"]).stdout)
    batch_ops = []
    for tab_name, rows in tabs_data.items():
        batch_ops.append({"op": "clear", "range": f"{tab_name}!A1:Z200"})
        batch_ops.append({"op": "write", "range": f"{tab_name}!A1", "data": rows})

    tmp = None
    try:
        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", encoding="utf-8", delete=False) as h:
            json.dump(batch_ops, h, ensure_ascii=False)
            tmp = Path(h.name)
        run_cli(["gsheets", "mutate", "batch", sheet_id, "-f", str(tmp)])
    finally:
        if tmp and tmp.exists():
            tmp.unlink(missing_ok=True)

    # Style headers cleanly across tabs
    tab_id_map = {}
    if isinstance(sheets_meta, list):
        for s in sheets_meta:
            if isinstance(s, dict) and s.get("title") is not None:
                tab_id_map[str(s["title"])] = int(s.get("id", s.get("sheetId", 0)))
    for tab_name, rows in tabs_data.items():
        sid = tab_id_map.get(tab_name)
        if sid is None:
            continue
        col_count = len(rows[0])
        run_cli([
            "gsheets", "mutate", "format", sheet_id,
            "--sheet-id", str(sid),
            "--start-row", "0", "--end-row", "1",
            "--start-col", "0", "--end-col", str(col_count),
            "--bold", "--bg-color", "#1E1A15", "--fg-color", "#EBCC92", "--wrap",
        ])
        run_cli(["gsheets", "mutate", "freeze", sheet_id, "--sheet-id", str(sid), "--rows", "1"])
    print("  Populated & formatted all 6 tabs in Master Sheet.")


def sync_monograph_doc(cfg: dict, folder_id: str) -> None:
    doc_cfg = cfg["suite"]["monograph_doc"]
    doc_id = doc_cfg.get("id")
    tab_specs = [
        ("discovery", "I. Discovery & Archaic Origins", "research/01_discovery_and_archaic_origins.md"),
        ("transliteration", "II. Translations & Transliterations", "research/02_translations_and_transliteration_systems.md"),
        ("catholic", "III. Liturgical & Catholic Canon", "research/03_liturgical_and_catholic_narratives.md"),
        ("revivals", "IV. Societal Shifts & Revivals", "research/04_cultural_shifts_and_revivals_to_2026.md"),
        ("anthropology", "V. Anthropology (Motif C331)", "research/05_anthropological_studies_motif_c331.md"),
    ]

    if not doc_id:
        proc = run_cli(["gdocs", "mutate", "create", "--title", doc_cfg["title"], "--json"])
        doc_id = extract_id(proc.stdout)
        doc_cfg["id"] = doc_id
        doc_cfg["url"] = f"https://docs.google.com/document/d/{doc_id}/edit"
        run_cli(["gdrive", "mutate", "mv", doc_id, folder_id])

        tabs_raw = run_cli(["gdocs", "readonly", "list-tabs", doc_id, "--json"]).stdout
        tabs_parsed = json.loads(tabs_raw)
        tabs_list = tabs_parsed.get("tabs", tabs_parsed) if isinstance(tabs_parsed, dict) else tabs_parsed
        first_tab_id = tabs_list[0].get("tabId") or tabs_list[0].get("id") if isinstance(tabs_list, list) and tabs_list else "t.0"
        run_cli(["gdocs", "mutate", "rename-tab", doc_id, first_tab_id, tab_specs[0][1]])
        doc_cfg["tabs"][tab_specs[0][0]] = {"id": first_tab_id, "title": tab_specs[0][1], "file": tab_specs[0][2]}

        for key, title, rel_file in tab_specs[1:]:
            run_cli(["gdocs", "mutate", "create-tab", doc_id, "--title", title])
        tabs_parsed2 = json.loads(run_cli(["gdocs", "readonly", "list-tabs", doc_id, "--json"]).stdout)
        tabs_list2 = tabs_parsed2.get("tabs", tabs_parsed2) if isinstance(tabs_parsed2, dict) else tabs_parsed2
        by_title = {str(t.get("title")): (t.get("tabId") or t.get("id")) for t in tabs_list2 if isinstance(t, dict)}
        for key, title, rel_file in tab_specs[1:]:
            tid = by_title.get(title)
            if not tid:
                raise RuntimeError(f"Could not resolve tab ID for '{title}' from {tabs_list2}")
            doc_cfg["tabs"][key] = {"id": tid, "title": title, "file": rel_file}
        print(f"Created 5-Tab Monograph Google Doc: {doc_cfg['url']}")

    for key, title, rel_file in tab_specs:
        tid = doc_cfg["tabs"][key]["id"]
        run_cli([
            "gdocs", "mutate", "import-md", str(ROOT / rel_file),
            "--update", doc_id, "--tab", tid, "--auto-fit-tables",
        ])
    print("  Imported all 5 Markdown monographs into Google Doc tabs.")


def sync_timelapse_slides(cfg: dict, folder_id: str) -> None:
    slides_cfg = cfg["suite"]["timelapse_slides"]
    pres_id = slides_cfg.get("id")
    if pres_id:
        print(f"Slides deck already exists: {slides_cfg['url']}")
        return

    proc = run_cli(["gslides", "mutate", "create", "--title", slides_cfg["title"], "--json"])
    pres_id = extract_id(proc.stdout)
    slides_cfg["id"] = pres_id
    slides_cfg["url"] = f"https://docs.google.com/presentation/d/{pres_id}/edit"
    run_cli(["gdrive", "mutate", "mv", pres_id, folder_id])

    ops = [
        {"op": "delete-element", "element": "i0"},
        {"op": "delete-element", "element": "i1"},
        {"op": "set-background", "slide": "p", "color": "#12100E"},
        {"op": "add-textbox", "slide": "p", "text": "ORPHEUS: 600 BCE TO 2026 CE", "x": 50, "y": 105, "width": 620, "height": 65, "font_size": 34, "bold": True, "color": "#EBCC92", "font_family": "Georgia", "alignment": "center"},
        {"op": "add-textbox", "slide": "p", "text": "Archaeological Discovery · Multi-System Transliterations · Catholic Liturgy · Motif C331 Anthropology · Polyglot Go & Spring Boot", "x": 70, "y": 185, "width": 580, "height": 70, "font_size": 15, "color": "#EFE8DA", "font_family": "Inter", "alignment": "center"},
        {"op": "add-shape", "slide": "p", "shape_type": "RECTANGLE", "x": 220, "y": 275, "width": 280, "height": 3, "background_color": "#D4A959"},
        {"op": "set-notes", "slide": "p", "text": "Opening overview of the 2,600-year Orpheus research corpus."},
    ]

    slide_defs = [
        ("SLIDE_2", "1. Archaic Origins & Archaeological Discovery (c. 560–340 BCE)",
         "• Ibycus PMG 306 (c. 560 BCE): 'onomaklyton Orphēn' — Argonautic singer before any tragic loss.\n• Euripides Alcestis (438 BCE): assumes Orpheus descended and SUCCEEDED by song.\n• Hipponion Gold Lamella (c. 400 BCE, found 1969): initiate passport ('Child of Earth and starry Heaven').\n• Derveni Papyrus (c. 340 BCE, found 1962): Europe's oldest surviving book; Orphic ritual & physics."),
        ("SLIDE_3", "2. Five Transliteration & Liturgical Phonetic Systems",
         "• ISO 843 Academic: reversible representation preserving macrons (ē, ō) and breathings.\n• ALA-LC Romanization: library standard across humanities catalogs.\n• 5th-c. BCE Attic IPA: aspirated stops (pʰ, tʰ, kʰ) & long vowels as Athens heard Euripides.\n• Byzantine Liturgical Greek: iotacism (η/ι/υ -> /i/) & fricatives used by Patristic cantors.\n• Classical vs. Ecclesiastical Latin: Virgil ([w]/[k]) -> Boethius & Catholic liturgy ([v]/[tʃ])."),
        ("SLIDE_4", "3. Catholic & Liturgical Retellings (195–1340 CE)",
         "• Roman Catacombs (Domitilla, Callixtus): Christus-Orpheus with lyre & sheep prefigures Good Shepherd.\n• Clement of Alexandria (Protrepticus): Christ the Logos sings the 'New Song' transforming human hearts.\n• Boethius (524 CE): 'Vos haec fabula respicit' — looking back warns souls against clinging to shadows.\n• Ovide moralisé & Sir Orfeo: Orpheus = Christ in the Harrowing of Hell; faith restores what tragedy lost."),
        ("SLIDE_5", "4. Cultural & Societal Revivals (1480–2026)",
         "• 1480–1607 (Poliziano, Monteverdi): Renaissance secular theater & birth of modern opera.\n• 1762 (Gluck): Enlightenment 'lieto fine' where Love reverses mortality.\n• 1922–1959 (Rilke, Cocteau, Black Orpheus): Post-war grief, cinema mirrors, and Afro-Brazilian Carnival.\n• 2019–2026 (Hadestown, Portrait of a Lady on Fire, The Sandman S2, Multispectral Derveni): labor, consent, & digital philology."),
        ("SLIDE_6", "5. Global Anthropology: Motif C331 (Tabu: Looking Back)",
         "• Thracian Shamanism (Dodds, Eliade): ecstatic soul-retrieval & prophetic singing head.\n• Japan (Kojiki): Izanagi & Izanami in Yomi establishing human mortality.\n• Ancient Levant (Genesis 19): Lot's wife turning back toward judgment.\n• North America (Åke Hultkrantz, 1957): ~130 Indigenous variants (Yokuts, Cherokee, Huron) helping communities accept loss."),
        ("SLIDE_7", "6. Polyglot Engineering: Go 1.26 + Spring Boot 3.4 + Colab",
         "• Go Engine (:8091): Zero-dep polytonic Greek/Latin transliterator + concurrent Katabasis goroutines (chan<- & context.WithCancel).\n• Spring Boot (:8080): Java 21 + H2 JPA + Actuator + live Go RestClient bridge & Web Atlas.\n• Automated CI Telemetry: GitHub Actions race/bench + JaCoCo coverage -> $GITHUB_STEP_SUMMARY, Google Sheets, & GitHub Pages."),
    ]

    for sid, heading, body in slide_defs:
        ops.extend([
            {"op": "add-slide", "layout": "BLANK", "id": sid},
            {"op": "set-background", "slide": sid, "color": "#171513"},
            {"op": "add-textbox", "slide": sid, "text": heading, "x": 36, "y": 24, "width": 648, "height": 48, "font_size": 20, "bold": True, "color": "#EBCC92", "font_family": "Georgia"},
            {"op": "add-shape", "slide": sid, "shape_type": "RECTANGLE", "x": 36, "y": 76, "width": 648, "height": 2, "background_color": "#D4A959"},
            {"op": "add-textbox", "slide": sid, "text": body, "x": 36, "y": 95, "width": 648, "height": 270, "font_size": 13, "color": "#EFE8DA", "font_family": "Inter", "line_spacing": 145},
            {"op": "set-notes", "slide": sid, "text": heading},
        ])

    tmp = None
    try:
        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", encoding="utf-8", delete=False) as h:
            json.dump(ops, h, ensure_ascii=False)
            tmp = Path(h.name)
        run_cli(["gslides", "mutate", "batch", pres_id, "-f", str(tmp), "--json"])
    finally:
        if tmp and tmp.exists():
            tmp.unlink(missing_ok=True)
    print(f"Created 7-Slide Time-Lapse Deck: {slides_cfg['url']}")


def sync_colab_and_reports(cfg: dict, colab_folder_id: str, reports_folder_id: str) -> None:
    colab_cfg = cfg["suite"]["colab_notebook"]
    if not colab_cfg.get("id"):
        proc = run_cli([
            "gdrive", "mutate", "upload", str(NOTEBOOK_PATH),
            "--parent", colab_folder_id,
            "--mime-type", "application/vnd.google.colaboratory",
            "--json",
        ])
        cid = extract_id(proc.stdout)
        colab_cfg["id"] = cid
        colab_cfg["url"] = f"https://colab.research.google.com/drive/{cid}"
        print(f"Uploaded Go Colab Notebook: {colab_cfg['url']}")
    else:
        run_cli(["gdrive", "mutate", "update", colab_cfg["id"], str(NOTEBOOK_PATH), "--mime-type", "application/vnd.google.colaboratory"])

    rep_cfg = cfg["suite"]["telemetry_report"]
    rep_path = REPORTS_DIR / "latest-report.md"
    if not rep_cfg.get("id"):
        proc = run_cli(["gdrive", "mutate", "upload", str(rep_path), "--parent", reports_folder_id, "--json"])
        rid = extract_id(proc.stdout)
        rep_cfg["id"] = rid
        rep_cfg["url"] = f"https://drive.google.com/file/d/{rid}/view"
        print(f"Uploaded Telemetry Report: {rep_cfg['url']}")
    else:
        run_cli(["gdrive", "mutate", "update", rep_cfg["id"], str(rep_path)])


def save_config(cfg: dict) -> None:
    CONFIG_PATH.write_text(json.dumps(cfg, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def main() -> int:
    cfg = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    _, folders = ensure_drive_folders(cfg)
    save_config(cfg)
    sync_master_sheet(cfg, folders["00_Diachronic_Datasets_And_Sheets"])
    save_config(cfg)
    sync_monograph_doc(cfg, folders["01_Monographs_And_Catholic_Canon"])
    save_config(cfg)
    sync_timelapse_slides(cfg, folders["02_Time_Lapse_Briefings"])
    save_config(cfg)
    sync_colab_and_reports(
        cfg,
        folders["03_Go_Colab_And_Transliteration_Lab"],
        folders["04_Automated_Telemetry_Reports"],
    )
    save_config(cfg)
    subprocess.run([sys.executable, str(SITE_BUNDLE_BUILDER)], cwd=ROOT, check=True)
    print("OK: 5-Pillar Orpheus Google Drive Archive synchronized & web bundle rebuilt.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
