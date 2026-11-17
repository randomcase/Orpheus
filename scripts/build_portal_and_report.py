#!/usr/bin/env python3
"""Compile Orpheus web bundle, parse Go & Spring Boot telemetry, and generate automated reports."""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
RESEARCH_DIR = ROOT / "research"
CONFIG_PATH = ROOT / "config" / "google-suite.json"
GO_DIR = ROOT / "go-engine"
SPRING_DIR = ROOT / "springboot-app"
SITE_DIR = ROOT / "site"
SPRING_STATIC_DIR = SPRING_DIR / "src" / "main" / "resources" / "static"
REPORTS_DIR = ROOT / "reports"


def check_no_pii() -> None:
    """Ensure no personal email address appears in any tracked repository text file."""
    skip_dirs = {".git", ".gradle", "build", "bin", "__pycache__"}
    forbidden = "@" + "gmail.com"
    for path in ROOT.rglob("*"):
        if not path.is_file() or any(part in skip_dirs for part in path.parts):
            continue
        if path.suffix in {".jar", ".exe", ".png", ".jpg", ".pyc", ".out"}:
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        if forbidden in text.lower():
            raise RuntimeError(f"PII guard failed: personal email pattern found in {path.relative_to(ROOT)}")


def run_go_enrichment() -> dict:
    """Invoke go-engine in enrich-json mode so static pages carry exact Go transliterations."""
    proc = subprocess.run(
        ["go", "run", "./cmd/orpheus-engine", "--mode=enrich-json", "--data-dir=../data"],
        cwd=GO_DIR,
        capture_output=True,
        text=True,
        encoding="utf-8",
        check=True,
    )
    return json.loads(proc.stdout)


def parse_go_coverage() -> dict:
    cov_path = GO_DIR / "coverage.out"
    if not cov_path.exists():
        return {"available": False, "statements_pct": None, "packages": []}
    proc = subprocess.run(
        ["go", "tool", "cover", "-func=coverage.out"],
        cwd=GO_DIR,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    if proc.returncode != 0:
        return {"available": False, "statements_pct": None, "packages": []}
    total_pct = None
    lines = [line.strip() for line in proc.stdout.splitlines() if line.strip()]
    if lines and lines[-1].startswith("total:"):
        m = re.search(r"([0-9.]+)%", lines[-1])
        if m:
            total_pct = float(m.group(1))
    return {"available": True, "statements_pct": total_pct}


def parse_springboot_metrics() -> dict:
    junit_dir = SPRING_DIR / "build" / "test-results" / "test"
    jacoco_xml = SPRING_DIR / "build" / "reports" / "jacoco" / "test" / "jacocoTestReport.xml"

    tests_total = 0
    tests_failed = 0
    tests_skipped = 0
    if junit_dir.exists():
        for xml_file in junit_dir.glob("TEST-*.xml"):
            root = ET.fromstring(xml_file.read_text(encoding="utf-8"))
            tests_total += int(root.attrib.get("tests", 0))
            tests_failed += int(root.attrib.get("failures", 0)) + int(root.attrib.get("errors", 0))
            tests_skipped += int(root.attrib.get("skipped", 0))

    line_cov_pct = None
    if jacoco_xml.exists():
        root = ET.fromstring(jacoco_xml.read_text(encoding="utf-8"))
        for counter in root.findall("counter"):
            if counter.attrib.get("type") == "LINE":
                covered = int(counter.attrib.get("covered", 0))
                missed = int(counter.attrib.get("missed", 0))
                if covered + missed > 0:
                    line_cov_pct = round(100.0 * covered / (covered + missed), 2)
                break

    return {
        "junit_total": tests_total,
        "junit_failed": tests_failed,
        "junit_skipped": tests_skipped,
        "jacoco_line_pct": line_cov_pct,
    }


def load_monographs() -> list[dict]:
    out = []
    for path in sorted(RESEARCH_DIR.glob("*.md")):
        out.append({"filename": path.name, "markdown": path.read_text(encoding="utf-8")})
    return out


def render_markdown_report(telemetry: dict) -> str:
    a = telemetry["corpus"]["analytics"]
    go = telemetry["go_engine"]
    sb = telemetry["spring_boot"]
    lines = [
        "# Orpheus Polyglot Engineering & Corpus Telemetry Report",
        "",
        f"- **Generated (UTC):** {telemetry['generated_at']}",
        f"- **Chronological Span:** {abs(a['earliest_year'])} BCE to {a['latest_year']} CE ({a['span_years']} years)",
        "",
        "## 1. Scholarly Corpus Completeness",
        "",
        "| Dataset | Records | Scope |",
        "| :--- | ---: | :--- |",
        f"| Timeline Milestones | {a['timeline_count']} | Archaic Greece (~560 BCE) to 2026 CE |",
        f"| Primary Passages (Go-Transliterated) | {a['transliteration_count']} | ISO 843, ALA-LC, Attic IPA, Byzantine, Classical/Ecclesiastical Latin |",
        f"| Liturgical & Catholic Narratives | {a['liturgical_count']} | Gold Lamellae, Catacombs, Clement, Boethius, *Ovide moralisé*, *Sir Orfeo* |",
        f"| Anthropology (Motif C331) | {a['anthropology_count']} | Thrace, Japan, Levant, North America (Hultkrantz), Polynesia |",
        f"| Societal Revivals | {a['revival_count']} | 1480 Poliziano through 2026 Stage, Cinema & Digital Humanities |",
        "",
        "## 2. Polyglot Build & Test Metrics",
        "",
        "| Toolchain | Check / Metric | Value |",
        "| :--- | :--- | :--- |",
        f"| **Go 1.26 (`go-engine`)** | Statement Coverage | {go['statements_pct'] if go['statements_pct'] is not None else 'Run go test -coverprofile'}% |",
        f"| **Spring Boot 3.4 / Java 21** | JUnit Integration Tests | {sb['junit_total']} total ({sb['junit_failed']} failed, {sb['junit_skipped']} skipped) |",
        f"| **Spring Boot JaCoCo** | Line Coverage | {sb['jacoco_line_pct'] if sb['jacoco_line_pct'] is not None else 'Run gradlew jacocoTestReport'}% |",
        "",
        "## 3. Era Distribution",
        "",
        "| Historical Era | Milestones |",
        "| :--- | ---: |",
    ]
    for era, count in sorted(a["era_counts"].items()):
        lines.append(f"| {era.replace('_', ' ')} | {count} |")
    return "\n".join(lines) + "\n"


def mirror_static_to_springboot() -> None:
    SPRING_STATIC_DIR.mkdir(parents=True, exist_ok=True)
    for item in SITE_DIR.iterdir():
        if item.is_file():
            shutil.copy2(item, SPRING_STATIC_DIR / item.name)


def main() -> int:
    parser = argparse.ArgumentParser(description="Compile Orpheus portal bundle and telemetry report.")
    parser.add_argument(
        "--ci-summary",
        action="store_true",
        help="Also append Markdown report to $GITHUB_STEP_SUMMARY when running in GitHub Actions.",
    )
    args = parser.parse_args()

    check_no_pii()
    enriched = run_go_enrichment()
    suite = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    monographs = load_monographs()

    telemetry = {
        "generated_at": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "corpus": {
            "analytics": enriched["analytics"],
            "monographs_count": len(monographs),
        },
        "go_engine": parse_go_coverage(),
        "spring_boot": parse_springboot_metrics(),
    }

    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    report_md = render_markdown_report(telemetry)
    (REPORTS_DIR / "latest-telemetry.json").write_text(
        json.dumps(telemetry, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    (REPORTS_DIR / "latest-report.md").write_text(report_md, encoding="utf-8")

    bundle = {
        "suite": suite,
        "monographs": monographs,
        "telemetry": telemetry,
        **enriched,
    }
    SITE_DIR.mkdir(parents=True, exist_ok=True)
    (SITE_DIR / "corpus-bundle.js").write_text(
        "// Auto-generated by scripts/build_portal_and_report.py\n"
        f"window.ORPHEUS_BUNDLE = {json.dumps(bundle, indent=2, ensure_ascii=False)};\n",
        encoding="utf-8",
    )

    if (SITE_DIR / "index.html").exists():
        mirror_static_to_springboot()

    if args.ci_summary and os.environ.get("GITHUB_STEP_SUMMARY"):
        with open(os.environ["GITHUB_STEP_SUMMARY"], "a", encoding="utf-8") as handle:
            handle.write(report_md + "\n")

    print(
        f"OK: Generated telemetry report + site/corpus-bundle.js "
        f"({enriched['analytics']['timeline_count']} timeline, "
        f"{enriched['analytics']['transliteration_count']} passages, "
        f"{len(monographs)} monographs)."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
