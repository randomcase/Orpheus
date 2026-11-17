# Orpheus (600 BCE – 2026 CE) — Polyglot Research Engine, Liturgical & Anthropological Archive

A best-practice polyglot research repository combining **Go (`go1.26`)**, **Spring Boot (`Java 21` / Gradle 8.14.2)**, a **~600 BCE–2026 CE scholarly corpus**, an executable **Google Colab Go Lab**, an **Interactive Web Atlas**, **automated telemetry reporting**, and a **5-pillar Google Drive archive**.

## Architecture

| Component | Stack / Role | Entry Points |
| :--- | :--- | :--- |
| **`go-engine/`** | Zero-dep Go 1.26 service (`:8091`) & CLI for 5-system Polytonic Greek/Latin transliteration, diachronic analytics, and goroutine/channel *Katabasis* simulation (`context.WithCancel`) | `cmd/orpheus-engine/main.go`, `internal/{translit,corpus,katabasis,report,server}` |
| **`springboot-app/`** | Java 21 + Spring Boot 3.4.5 + H2 JPA + Actuator (`:8080`) persisting the corpus, proxying live transliteration & *Katabasis* to `go-engine`, and serving the Research Atlas | `src/main/java/org/orpheus/research/*` |
| **`data/` & `research/`** | 5 JSON datasets (Timeline, Transliterations, Catholic/Liturgical Narratives, Anthropology *Motif C331*, Societal Revivals to 2026) & 5 Markdown monographs | `data/01..05_*.json`, `research/01..05_*.md` |
| **`notebooks/`** | Executable Google Colab notebook compiling & benchmarking Go transliteration + *Katabasis* alongside a 2,600-year Python/Matplotlib time-lapse | `notebooks/Orpheus_Diachronic_Go_Lab.ipynb` |
| **`site/`** | Dual-mode Interactive Research Atlas (auto-connects to Spring Boot + Go locally; static-bundle fallback on GitHub Pages) | `site/index.html`, `site/app.js`, `site/styles.css` |
| **`scripts/`** | Unified task runner (`orpheus.ps1`), portal + telemetry compiler (`build_portal_and_report.py`), and 5-pillar Google Workspace sync (`sync_google_drive.py`) | `scripts/orpheus.ps1`, `scripts/build_portal_and_report.py`, `scripts/sync_google_drive.py` |

## Quick Commands

```powershell
# Run Go race tests + benchmarks, Spring Boot JUnit/JaCoCo tests, and rebuild portal + telemetry report
pwsh -File scripts/orpheus.ps1 test

# Build compiled Go binary + Spring Boot JAR
pwsh -File scripts/orpheus.ps1 build

# Start Go engine (:8091) and Spring Boot (:8080)
pwsh -File scripts/orpheus.ps1 serve
```

## Automated Reporting & Live Links

- **GitHub Repository:** https://github.com/randomcase/Orpheus
- **Live GitHub Pages Atlas:** https://randomcase.github.io/Orpheus/
- **Automated Engineering & Corpus Telemetry:** `reports/latest-report.md` & `reports/latest-telemetry.json`

## Google Suite & Cloud Archive

| Artifact | Purpose | Access |
| :--- | :--- | :--- |
| Drive Root Archive | Master workspace organizing datasets, monographs, slides, Colab, & CI reports | [Orpheus Research Archive](https://drive.google.com/drive/folders/1LrzJDC4KRCjSr-DvErY9mfXdEen6R5gZ) |
| 6-Tab Master Sheet | Timeline (`600 BCE–2026`), Transliterations, Catholic Liturgy, Motif C331, Revivals, & CI Telemetry | [Master Diachronic Ledger](https://docs.google.com/spreadsheets/d/1pHX9lFf-MjlYCWTEcK00fftTd10rs-FoGNXQGbQQMIk/edit) |
| 5-Tab Monograph Doc | Discovery, Philology, Catholic/Liturgical Reception, Societal Shifts, & Anthropology | [Orpheus Monograph](https://docs.google.com/document/d/1ObW-BjxoBeIZo_VqpV0zyRfaUWhxrhNbLQafXKPPyls/edit) |
| 7-Slide Time-Lapse Deck | Visual synthesis from Archaic Greece through 2026 & Polyglot Architecture | [Time-Lapse Briefing](https://docs.google.com/presentation/d/1OL0HjaI6yMYzbbretMiJw8dqeMGcV2vcEq2X-tOQck4/edit) |
| Google Colab Lab | Executable Go transliteration, goroutine *Katabasis* simulation, & Matplotlib time-lapse | [Orpheus_Diachronic_Go_Lab.ipynb](https://colab.research.google.com/drive/1ycFKyUuKlcRJdo3f1Y_XhQq2-kVFqauT) |
