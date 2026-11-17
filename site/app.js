(function () {
  "use strict";

  const bundle = window.ORPHEUS_BUNDLE || {};
  let liveApi = false;
  let timeLapseTimer = null;

  const state = {
    timeline: bundle.timeline || [],
    transliterations: bundle.transliterations || [],
    liturgical: bundle.liturgical_and_catholic || [],
    anthropology: bundle.anthropology_motif_c331 || [],
    revivals: bundle.societal_revivals || [],
    lineage: bundle.lineage_104 || [],
    monographs: bundle.monographs || [],
    telemetry: bundle.telemetry || {},
    suite: bundle.suite || {}
  };

  const lineageState = {
    selectedId: "G-001",
    severedIds: new Set(),
    severedStreams: new Set(),
    disableCapsules: false
  };

  function esc(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function safeHref(url) {
    const raw = String(url || "").trim();
    return /^(https?:\/\/|#|\/|\.\.?\/)/i.test(raw) ? raw : "#";
  }

  function fmtLabel(val) {
    return String(val || "").replace(/_/g, " ");
  }

  function fmtYear(y) {
    const num = Number(y);
    if (!Number.isFinite(num)) return String(y || "");
    return num < 0 ? `${Math.abs(num)} BCE` : `${num} CE`;
  }

  const ERA_ORDER = [
    "Archaic_Greece",
    "Classical_Greece",
    "Hellenistic_Orphic",
    "Augustan_Rome",
    "Early_Christian_Patristic",
    "Medieval_Catholic",
    "Renaissance_Baroque",
    "Enlightenment_Modern",
    "Contemporary_To_2026"
  ];

  const MYTHEME_KEYS = [
    "threshold_voice",
    "argonaut_voyage",
    "mystery_passport",
    "katabasis_descent",
    "named_eurydice",
    "taboo_c331_glance",
    "sparagmos_head_oracle",
    "redemptive_return"
  ];

  const MYTHEME_LABELS = {
    threshold_voice: "Threshold Voice (Nucleus)",
    argonaut_voyage: "Argonaut Voyage",
    mystery_passport: "Mystery Passport / Teletai",
    katabasis_descent: "Katabasis Descent",
    named_eurydice: "Named Eurydice",
    taboo_c331_glance: "Taboo: Looking Back (C331)",
    sparagmos_head_oracle: "Sparagmos & Head Oracle",
    redemptive_return: "Redemptive Return Polarity"
  };

  const MONOGRAPH_TITLES = {
    "01_discovery_and_archaic_origins.md": "I. Discovery & Archaic Origins (565–300 BCE)",
    "02_translations_and_transliteration_systems.md": "II. Multi-System Transliterations & Phonetics",
    "03_liturgical_and_catholic_narratives.md": "III. Liturgical & Catholic Narratives",
    "04_cultural_shifts_and_revivals_to_2026.md": "IV. Cultural Shifts & Revivals (1480–2026)",
    "05_anthropological_studies_motif_c331.md": "V. Anthropological Studies (Motif C331)",
    "06_atomizing_104_generations.md": "VI. Atomizing 104 Generations (565 BCE–2026 CE)"
  };

  function monographTitle(m, idx) {
    if (m && MONOGRAPH_TITLES[m.filename]) return MONOGRAPH_TITLES[m.filename];
    const headingMatch = String((m && m.markdown) || "").match(/^#\s+(.+)$/m);
    if (headingMatch) return `${idx + 1}. ${headingMatch[1].trim()}`;
    return String((m && m.filename) || `Monograph ${idx + 1}`).replace(/\.md$/i, "").replace(/_/g, " ");
  }

  function renderMd(md) {
    const lines = String(md || "").replace(/\r\n/g, "\n").split("\n");
    const out = [];
    let i = 0;
    const inline = (t) => {
      const codeTokens = [];
      const tokenized = String(t || "").replace(/`([^`]+)`/g, (_, code) => {
        const idx = codeTokens.length;
        codeTokens.push(`<code>${esc(code)}</code>`);
        return `\u0000CODE${idx}\u0000`;
      });
      let html = esc(tokenized)
        .replace(/\s+-&gt;\s+/g, " &rarr; ")
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => {
          const href = safeHref(url);
          const ext = /^https?:\/\//i.test(href) ? ' target="_blank" rel="noopener noreferrer"' : "";
          return `<a href="${esc(href)}"${ext}>${label}</a>`;
        })
        .replace(/\*\*\*([^*]+)\*\*\*/g, "<strong><em>$1</em></strong>")
        .replace(/\*\*((?:(?!\*\*).)*?)\*([^*]+)\*\*\*/g, "<strong>$1<em>$2</em></strong>")
        .replace(/\*\*\*([^*]+)\*((?:(?!\*\*).)*?)\*\*/g, "<strong><em>$1</em>$2</strong>")
        .replace(/\*\*((?:(?!\*\*).)+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*([^*]+)\*/g, "<em>$1</em>");
      return html.replace(/\u0000CODE(\d+)\u0000/g, (_, idx) => codeTokens[Number(idx)] || "");
    };

    while (i < lines.length) {
      const t = lines[i].trim();
      if (!t) { i += 1; continue; }
      if (/^---+$/.test(t)) {
        out.push("<hr />");
        i += 1;
        continue;
      }
      const hm = t.match(/^(#{1,3})\s+(.+)$/);
      if (hm) {
        out.push(`<h${hm[1].length}>${inline(hm[2])}</h${hm[1].length}>`);
        i += 1;
        continue;
      }
      if (t.startsWith(">")) {
        const q = [];
        while (i < lines.length && lines[i].trim().startsWith(">")) {
          q.push(lines[i].trim().replace(/^>\s?/, ""));
          i += 1;
        }
        out.push(`<blockquote>${inline(q.join(" "))}</blockquote>`);
        continue;
      }
      if (t.startsWith("|") && i + 1 < lines.length && /^\|[\s:|-]+\|?$/.test(lines[i + 1].trim())) {
        const parse = (r) => r.replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
        const headers = parse(t);
        i += 2;
        const rows = [];
        while (i < lines.length && lines[i].trim().startsWith("|")) {
          rows.push(parse(lines[i].trim()));
          i += 1;
        }
        out.push(
          '<div class="prose-table-wrap"><table><thead><tr>' +
          headers.map((h) => `<th>${inline(h)}</th>`).join("") +
          "</tr></thead><tbody>" +
          rows.map((r) => "<tr>" + headers.map((_, k) => `<td>${inline(r[k] || "")}</td>`).join("") + "</tr>").join("") +
          "</tbody></table></div>"
        );
        continue;
      }
      if (/^(\*|-|\d+\.)\s+/.test(t)) {
        const ordered = /^\d+\./.test(t);
        const tag = ordered ? "ol" : "ul";
        const items = [];
        while (i < lines.length && /^(\*|-|\d+\.)\s+/.test(lines[i].trim())) {
          items.push("<li>" + inline(lines[i].trim().replace(/^(\*|-|\d+\.)\s+/, "")) + "</li>");
          i += 1;
        }
        out.push(`<${tag}>${items.join("")}</${tag}>`);
        continue;
      }
      const p = [];
      while (i < lines.length && lines[i].trim() && !/^(#{1,3}\s+|\||>\s?|---+$|(\*|-|\d+\.)\s+)/.test(lines[i].trim())) {
        p.push(lines[i].trim());
        i += 1;
      }
      out.push(`<p>${inline(p.join(" "))}</p>`);
    }
    return out.join("\n");
  }

  function switchTab(tabId, fromClick) {
    const valid = ["timeline", "rpg", "lineage", "transliteration", "catholic-liturgy", "anthropology", "revivals", "katabasis", "telemetry"];
    const target = valid.includes(tabId) ? tabId : "timeline";
    document.querySelectorAll(".nav-tab").forEach((b) => b.classList.toggle("is-active", b.dataset.tab === target));
    document.querySelectorAll(".panel").forEach((p) => p.classList.toggle("is-active", p.id === "panel-" + target));
    history.replaceState(null, "", "#" + target);
    if (window.OrpheusRPG) {
      if (target === "rpg") window.OrpheusRPG.onTabActivated();
      else window.OrpheusRPG.onTabHidden();
    }
    if (fromClick) {
      const nav = document.querySelector(".nav-tabs");
      if (nav && typeof window.scrollTo === "function" && window.scrollY > nav.offsetTop - 8) {
        window.scrollTo({ top: Math.max(0, nav.offsetTop - 12), behavior: "smooth" });
      }
    }
  }

  function updateStats() {
    document.getElementById("stat-timeline").textContent = state.timeline.length;
    const genEl = document.getElementById("stat-generations");
    if (genEl) genEl.textContent = state.lineage.length || 104;
    document.getElementById("stat-passages").textContent = state.transliterations.length;
    document.getElementById("stat-liturgical").textContent = state.liturgical.length;
    document.getElementById("stat-anthro").textContent = state.anthropology.length;
    document.getElementById("stat-revivals").textContent = state.revivals.length;
  }

  function populateEraFilter() {
    const sel = document.getElementById("era-filter");
    const counts = {};
    state.timeline.forEach((t) => { counts[t.era] = (counts[t.era] || 0) + 1; });
    const ordered = [];
    const seen = new Set();
    ERA_ORDER.forEach((e) => {
      if (counts[e]) { ordered.push(e); seen.add(e); }
    });
    Object.keys(counts).sort().forEach((e) => {
      if (!seen.has(e)) ordered.push(e);
    });
    ordered.forEach((e) => {
      const opt = document.createElement("option");
      opt.value = e;
      opt.textContent = `${fmtLabel(e)} (${counts[e]})`;
      sel.appendChild(opt);
    });
  }

  function renderTimeline(maxYear) {
    const era = document.getElementById("era-filter").value;
    const cutoff = maxYear != null ? maxYear : 2026;
    const eraItems = era ? state.timeline.filter((item) => item.era === era) : state.timeline;
    const items = eraItems.filter((item) => item.year <= cutoff);

    let readout;
    if (cutoff >= 2026 && !era) {
      readout = `All Eras · 565 BCE – 2026 CE (${items.length} milestones)`;
    } else if (cutoff >= 2026 && era) {
      readout = `${fmtLabel(era)} (${items.length} milestones)`;
    } else if (era) {
      readout = `${fmtLabel(era)} · up to ${fmtYear(cutoff)} (${items.length} of ${eraItems.length} shown)`;
    } else {
      readout = `Up to ${fmtYear(cutoff)} (${items.length} of ${state.timeline.length} shown)`;
    }
    document.getElementById("scrubber-readout").textContent = readout;

    const grid = document.getElementById("timeline-grid");
    if (!items.length) {
      const years = eraItems.map((x) => x.year);
      const minY = years.length ? Math.min.apply(null, years) : -565;
      const maxY = years.length ? Math.max.apply(null, years) : 2026;
      grid.innerHTML = `
        <article class="card">
          <div class="card-head">
            <span class="id-tag">No Milestones Before ${esc(fmtYear(cutoff))}</span>
            <span class="pill">${esc(era ? fmtLabel(era) : "All Eras")}</span>
          </div>
          <h3>This Era Begins Later (${esc(fmtYear(minY))} – ${esc(fmtYear(maxY))})</h3>
          <p style="margin:0;color:var(--text-muted);font-size:0.88rem;">
            The time-lapse slider is still parked at ${esc(fmtYear(cutoff))}, before the selected era starts.
          </p>
          <div class="control-row" style="margin-top:0.35rem;">
            ${era ? `<button type="button" id="empty-show-era-btn" class="btn btn-primary">Show All ${esc(fmtLabel(era))} (${eraItems.length})</button>` : ""}
            <button type="button" id="empty-reset-all-btn" class="btn btn-subtle">Reset to All ${state.timeline.length} Milestones</button>
          </div>
        </article>`;
      const eraBtn = document.getElementById("empty-show-era-btn");
      if (eraBtn) {
        eraBtn.addEventListener("click", () => {
          document.getElementById("year-slider").value = "2026";
          renderTimeline(2026);
        });
      }
      const resetBtn = document.getElementById("empty-reset-all-btn");
      if (resetBtn) {
        resetBtn.addEventListener("click", () => {
          document.getElementById("era-filter").value = "";
          document.getElementById("year-slider").value = "2026";
          renderTimeline(2026);
        });
      }
      return;
    }

    grid.innerHTML = items.map((m) => `
      <article class="card">
        <div>
          <div class="card-head">
            <span class="id-tag">${esc(m.id)} · ${esc(m.display_date)}</span>
            <span class="pill">${esc(fmtLabel(m.era))}</span>
          </div>
          <h3>${esc(m.title)}</h3>
          <div class="meta-block" style="margin-top:0.55rem;">
            <div><strong>Source:</strong> ${esc(m.creator_or_source)} (${esc(m.language)})</div>
            <div><strong>Discovery / Provenance:</strong> ${esc(m.discovery_or_provenance)}</div>
            <div><strong>Key Shift:</strong> ${esc(m.key_shift)}</div>
            <div><strong>Liturgical / Religious Role:</strong> ${esc(m.liturgical_or_religious_role)}</div>
            <div><strong>Societal Context:</strong> ${esc(m.societal_context)}</div>
          </div>
        </div>
      </article>
    `).join("");
  }

  function renderSystemBoxes(sys) {
    if (!sys) return "";
    if (sys.script_type === "polytonic_greek") {
      return `
        <div class="phonetic-grid">
          <div class="phonetic-cell"><div class="phonetic-label">ISO 843 Academic</div><div class="phonetic-val">${esc(sys.iso_843)}</div></div>
          <div class="phonetic-cell"><div class="phonetic-label">ALA-LC Romanization</div><div class="phonetic-val">${esc(sys.ala_lc)}</div></div>
          <div class="phonetic-cell"><div class="phonetic-label">5th-c. Attic IPA</div><div class="phonetic-val">${esc(sys.attic_ipa)}</div></div>
          <div class="phonetic-cell"><div class="phonetic-label">Byzantine Liturgical</div><div class="phonetic-val">${esc(sys.byzantine_liturgical)}</div></div>
        </div>`;
    }
    return `
      <div class="phonetic-grid">
        <div class="phonetic-cell"><div class="phonetic-label">Classical Roman Phonetics</div><div class="phonetic-val">${esc(sys.classical_latin)}</div></div>
        <div class="phonetic-cell"><div class="phonetic-label">Catholic Ecclesiastical Latin</div><div class="phonetic-val">${esc(sys.ecclesiastical_latin)}</div></div>
      </div>`;
  }

  function renderPassages() {
    document.getElementById("passages-grid").innerHTML = state.transliterations.map((p) => `
      <article class="card">
        <div class="card-head">
          <span class="id-tag">${esc(p.id)} · ${esc(p.date_label)}</span>
          <span class="pill">${esc(fmtLabel(p.script_type))}</span>
        </div>
        <h3>${esc(p.work)} (${esc(p.locus)})</h3>
        <div class="polytonic">${esc(p.original_text)}</div>
        ${renderSystemBoxes(p.systems)}
        <div class="meta-block">
          <div><strong>Literal Gloss:</strong> ${esc(p.literal_gloss)}</div>
          <div><strong>Translation:</strong> ${esc(p.english_translation)}</div>
          <div><strong>Philology:</strong> ${esc(p.philological_notes)}</div>
        </div>
      </article>
    `).join("");
  }

  async function runLiveTranslit() {
    const text = document.getElementById("live-text-input").value.trim();
    const script = document.getElementById("live-script-select").value;
    const target = document.getElementById("live-translit-output");
    if (!text) return;

    if (liveApi) {
      try {
        const res = await fetch("/api/transliterate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, script_type: script })
        });
        const data = await res.json();
        target.innerHTML = renderSystemBoxes(data);
        return;
      } catch (err) {
        /* fallback below */
      }
    }
    const found = state.transliterations.find((p) => p.original_text === text);
    if (found && found.systems) {
      target.innerHTML = renderSystemBoxes(found.systems);
    } else {
      target.innerHTML = `<div class="phonetic-cell"><div class="phonetic-label">Static Preview Mode</div><div class="phonetic-val">Start Spring Boot + Go engine locally for arbitrary text; precomputed sample: ${esc(text)}</div></div>`;
    }
  }

  function renderLiturgical() {
    const trad = document.getElementById("tradition-filter").value;
    const rows = state.liturgical.filter((x) => !trad || x.tradition === trad);
    document.getElementById("liturgical-grid").innerHTML = rows.map((x) => `
      <article class="card">
        <div class="card-head">
          <span class="id-tag">${esc(x.id)} · ${esc(x.period)}</span>
          <span class="pill">${esc(fmtLabel(x.tradition))}</span>
        </div>
        <h3>${esc(x.artifact_or_text)}</h3>
        <div class="meta-block">
          <div><strong>Theological Mapping:</strong> ${esc(x.theological_mapping)}</div>
          <div><strong>Liturgical / Ritual Use:</strong> ${esc(x.ritual_or_liturgical_use)}</div>
          <div><strong>Christological Comparison:</strong> ${esc(x.christological_comparison)}</div>
        </div>
      </article>
    `).join("");
  }

  function renderMonographs() {
    const sel = document.getElementById("monograph-select");
    const pillsEl = document.getElementById("monograph-pills");
    const box = document.getElementById("monograph-reader");
    if (!state.monographs.length) {
      box.innerHTML = "<p>No monographs loaded.</p>";
      return;
    }
    const romans = ["I", "II", "III", "IV", "V", "VI", "VII"];
    sel.innerHTML = state.monographs.map((m, idx) => `<option value="${idx}">${esc(monographTitle(m, idx))}</option>`).join("");
    if (pillsEl) {
      pillsEl.innerHTML = state.monographs.map((m, idx) => `
        <button type="button" class="monograph-pill${idx === 0 ? " is-active" : ""}" data-mono-idx="${idx}">
          ${esc(romans[idx] || String(idx + 1))}. ${esc(monographTitle(m, idx).replace(/^[IVX]+\.\s*/, "").split("(")[0].trim())}
        </button>
      `).join("");
      pillsEl.querySelectorAll("[data-mono-idx]").forEach((btn) => {
        btn.addEventListener("click", () => {
          sel.value = btn.dataset.monoIdx;
          show();
        });
      });
    }
    const show = () => {
      const idx = parseInt(sel.value, 10) || 0;
      const m = state.monographs[idx];
      if (pillsEl) {
        pillsEl.querySelectorAll("[data-mono-idx]").forEach((b) => {
          b.classList.toggle("is-active", parseInt(b.dataset.monoIdx, 10) === idx);
        });
      }
      box.innerHTML = renderMd(m.markdown);
    };
    sel.onchange = show;
    show();
  }

  function renderAnthropology() {
    document.getElementById("anthro-grid").innerHTML = state.anthropology.map((a) => `
      <article class="card">
        <div class="card-head">
          <span class="id-tag">${esc(a.id)}</span>
          <span class="pill">${esc(a.culture_or_region)}</span>
        </div>
        <h3>${esc(a.tradition_or_myth)}</h3>
        <div class="meta-block">
          <div><strong>Figures:</strong> ${esc(a.figures)}</div>
          <div><strong>Taboo Mechanism:</strong> ${esc(a.taboo_mechanism)}</div>
          <div><strong>Outcome of Glance:</strong> ${esc(a.outcome_of_glance)}</div>
          <div><strong>Scholarly Lineage:</strong> ${esc(a.anthropologist_or_scholar)}</div>
          <div><strong>Structural Meaning:</strong> ${esc(a.structural_meaning)}</div>
        </div>
      </article>
    `).join("");
  }

  function renderRevivals() {
    document.getElementById("revivals-grid").innerHTML = state.revivals.map((r) => `
      <article class="card">
        <div class="card-head">
          <span class="id-tag">${esc(r.id)} · ${esc(r.year)}</span>
          <span class="pill">${esc(r.medium)}</span>
        </div>
        <h3>${esc(r.work_and_creator)}</h3>
        <div class="meta-block">
          <div><strong>Historical Crisis / Shift:</strong> ${esc(r.historical_crisis_or_shift)}</div>
          <div><strong>How the Ending Changes:</strong> ${esc(r.how_the_ending_changes)}</div>
          <div><strong>Cultural Impact:</strong> ${esc(r.cultural_impact)}</div>
        </div>
      </article>
    `).join("");
  }

  async function runKatabasis(lookBackOverride) {
    const steps = parseInt(document.getElementById("sim-steps").value, 10) || 12;
    const lookBack = lookBackOverride != null
      ? lookBackOverride
      : (parseInt(document.getElementById("sim-lookback").value, 10) || 0);
    if (lookBackOverride != null) {
      document.getElementById("sim-lookback").value = String(lookBackOverride);
    }

    let sim;
    if (liveApi) {
      try {
        const res = await fetch("/api/katabasis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ steps, look_back_step: lookBack })
        });
        sim = await res.json();
      } catch (err) {
        sim = null;
      }
    }

    if (!sim) {
      const relapsed = lookBack >= 1 && lookBack <= steps;
      const limit = relapsed ? lookBack : steps;
      const events = [{
        step: 0, total_steps: steps, actor: "Hades & Persephone", phase: "Pact_Sealed",
        message: "Forward-only channel granted: keep eyes ahead until both enter daylight.", taboo_intact: true
      }];
      for (let i = 1; i <= limit; i += 1) {
        const turned = relapsed && i === lookBack;
        events.push({
          step: i, total_steps: steps, actor: turned ? "Orpheus" : "Orpheus & Eurydice",
          phase: turned ? "Respexit" : "Ascent",
          message: turned
            ? `Turns backward at step ${i}/${steps}, canceling context.`
            : `Ascending in silence (${i}/${steps}).`,
          taboo_intact: !turned
        });
        if (turned) {
          events.push({
            step: i, total_steps: steps, actor: "Eurydice", phase: "Relapsa",
            message: '"Vale" — drawn back into Averno the instant the forward contract broke.',
            taboo_intact: false
          });
        }
      }
      if (!relapsed) {
        events.push({
          step: steps, total_steps: steps, actor: "Orpheus & Eurydice", phase: "Superas_Auras",
          message: "Both cross into daylight; forward-only covenant fulfilled.", taboo_intact: true
        });
      }
      sim = {
        outcome: relapsed ? "RELAPSA_INTO_AVERNO" : "REUNITED_IN_LIGHT",
        hamartia: relapsed ? `Motif C331 violated at step ${lookBack} of ${steps}` : "",
        engine: "browser-mirror",
        events
      };
    }

    document.getElementById("sim-summary").innerHTML = `
      <div class="card" style="padding:0.9rem 1.05rem;">
        <div class="card-head">
          <span class="id-tag">${esc(sim.outcome)}</span>
          <span class="pill">Engine: ${esc(sim.engine || "go-1.26")}</span>
        </div>
        ${sim.hamartia ? `<div style="color:#eb9d92;font-size:0.88rem;">${esc(sim.hamartia)}</div>` : '<div style="color:#a9d9b4;font-size:0.88rem;">Contract held cleanly to daylight.</div>'}
      </div>`;

    document.getElementById("sim-events").innerHTML = (sim.events || []).map((ev) => `
      <div class="event-row ${ev.taboo_intact ? (ev.phase === "Superas_Auras" ? "is-reunited" : "") : "is-broken"}">
        <div><strong>[${esc(ev.actor)} · ${esc(ev.phase)}]</strong> ${esc(ev.message)}</div>
        <span class="id-tag">Step ${esc(ev.step)}/${esc(ev.total_steps)}</span>
      </div>
    `).join("");
  }

  function simulateSeveranceJS(nodes, req) {
    const ordered = (nodes || []).slice().sort((a, b) => a.gen_number - b.gen_number);
    const severedSet = new Set((req.severed_ids || []).map((s) => String(s).trim().toUpperCase()).filter(Boolean));
    const streamSet = new Set((req.severed_streams || []).map((s) => String(s).trim()).filter(Boolean));
    const disableCapsules = Boolean(req.disable_time_capsules);

    const alive = new Set();
    const livingAlive = new Set();
    const ancestors = new Map();
    const aliveIds = [];
    const darkIds = [];
    const severedApplied = [];

    ordered.forEach((n) => {
      if (severedSet.has(n.id)) severedApplied.push(n.id);
      if (severedSet.has(n.id) || streamSet.has(n.primary_stream)) {
        darkIds.push(n.id);
        return;
      }
      const ups = n.upstream_ids || [];
      const caps = n.capsule_upstream_ids || [];

      if (n.gen_number === 1 || ups.some((p) => livingAlive.has(p))) {
        livingAlive.add(n.id);
      }

      const activeParents = ups.filter((p) => alive.has(p));
      if (!disableCapsules) {
        caps.forEach((c) => {
          if (alive.has(c)) activeParents.push(c);
        });
      }

      if (n.gen_number !== 1 && activeParents.length === 0) {
        darkIds.push(n.id);
        return;
      }

      alive.add(n.id);
      aliveIds.push(n.id);
      const anc = new Set([n.id]);
      activeParents.forEach((p) => {
        const pAnc = ancestors.get(p);
        if (pAnc) pAnc.forEach((a) => anc.add(a));
      });
      ancestors.set(n.id, anc);
    });

    const targetId = ordered.length ? ordered[ordered.length - 1].id : "G-104";
    const survives2026 = alive.has(targetId);
    const capsuleResurrected = survives2026 && !livingAlive.has(targetId);
    const targetAnc = ancestors.get(targetId) || new Set();

    const survivingSet = new Set();
    const survivingMsSet = new Set();
    const allMilestones = [];
    ordered.forEach((n) => {
      (n.milestone_ids || []).forEach((ms) => allMilestones.push(ms));
      if (survives2026 && targetAnc.has(n.id)) {
        (n.introduced_mythemes || []).forEach((m) => survivingSet.add(m));
        (n.milestone_ids || []).forEach((ms) => survivingMsSet.add(ms));
      }
    });

    const survivingMythemes = MYTHEME_KEYS.filter((k) => survivingSet.has(k));
    const extinctMythemes = MYTHEME_KEYS.filter((k) => !survivingSet.has(k));
    const survivingMilestones = allMilestones.filter((m) => survivingMsSet.has(m));
    const lostMilestones = allMilestones.filter((m) => !survivingMsSet.has(m));

    let diagnosis;
    if (!survives2026) {
      diagnosis = "Total extinction: Orpheus's chain breaks completely before reaching Person #104 (2026 CE) because both living conduits and time-capsule recoveries were severed.";
    } else if (capsuleResurrected) {
      diagnosis = `Archaeological resurrection: living manuscript links went dark across ${darkIds.length} generations, yet buried 565–340 BCE time capsules bypassed ~90 people to deliver ${survivingMythemes.length}/8 mythemes to Person #104 (extinct: ${extinctMythemes.join(", ") || "none"}).`;
    } else if (extinctMythemes.length > 0) {
      diagnosis = `Partial divergence reaching 2026 CE: alternate branches kept ${survivingMythemes.length}/8 mythemes alive (${darkIds.length} generations dark), while severing this branch extinguished ${extinctMythemes.join(", ")}.`;
    } else if (darkIds.length > 0) {
      diagnosis = `Redundant survival to 2026 CE: ${darkIds.length} links went dark, yet parallel transmission preserved all 8 mythemes for Person #104.`;
    } else {
      diagnosis = `Unbroken 104-generation transmission (565 BCE–2026 CE): all 8 mythemes and all ${survivingMilestones.length} historical milestones reach Person #104.`;
    }

    return {
      story_survives_to_2026: survives2026,
      capsule_resurrected: capsuleResurrected,
      alive_count: aliveIds.length,
      dark_count: darkIds.length,
      alive_ids: aliveIds,
      dark_ids: darkIds,
      severed_applied: severedApplied,
      surviving_mythemes: survivingMythemes,
      extinct_mythemes: extinctMythemes,
      surviving_milestones: survivingMilestones,
      lost_milestones: lostMilestones,
      diagnosis,
      engine: "browser-dag-mirror"
    };
  }

  function polarBadge(val) {
    if (val > 0) return { label: "+1 Active", cls: "state-pos" };
    if (val < 0) return { label: "-1 Inverted", cls: "state-neg" };
    return { label: "0 Absent", cls: "state-zero" };
  }

  function renderLineageInspector(node, simResult) {
    const el = document.getElementById("lineage-inspector");
    if (!el) return;
    if (!node) {
      el.innerHTML = "<p>No 104-generation lineage data loaded.</p>";
      return;
    }
    const isSevered = lineageState.severedIds.has(node.id) || lineageState.severedStreams.has(node.primary_stream);
    const isAlive = new Set(simResult.alive_ids || []).has(node.id);
    const statusLabel = isSevered ? "Severed" : (isAlive ? "Alive" : "Dark (Unreachable)");
    const car = node.carrier || {};
    const mythemes = node.mythemes || {};
    const extinctSet = new Set(simResult.extinct_mythemes || []);

    el.innerHTML = `
      <div class="card-head">
        <span class="id-tag">${esc(node.id)} · Person #${esc(node.gen_number)}</span>
        <span class="pill">${esc(statusLabel)}</span>
      </div>
      <h3>${esc(node.custodian_or_witness)}</h3>
      <div class="meta-block">
        <div><strong>25-Year Window:</strong> ${esc(node.display_span)} (${esc(fmtLabel(node.era))})</div>
        <div><strong>Role &amp; Stream:</strong> ${esc(fmtLabel(node.role))} · <code>${esc(node.primary_stream)}</code></div>
        <div><strong>Upstream Parents:</strong> ${(node.upstream_ids && node.upstream_ids.length) ? esc(node.upstream_ids.join(", ")) : "Root Origin (565 BCE)"}</div>
        ${(node.capsule_upstream_ids && node.capsule_upstream_ids.length) ? `<div><strong>Time-Capsule Jump From:</strong> ${esc(node.capsule_upstream_ids.join(", "))}</div>` : ""}
        ${node.capsule_artifact ? `<div><strong>Buried Time Capsule:</strong> ${esc(node.capsule_artifact)}</div>` : ""}
        ${(node.milestone_ids && node.milestone_ids.length) ? `<div><strong>Milestones:</strong> ${esc(node.milestone_ids.join(", "))}</div>` : ""}
        <div><strong>Transmission Note:</strong> ${esc(node.transmission_note)}</div>
      </div>
      <div>
        <div class="eyebrow" style="margin-bottom:0.45rem;">Narrative Atom · 8 Tri-State Mythemes</div>
        <div class="mytheme-grid">
          ${MYTHEME_KEYS.map((k) => {
            const p = polarBadge(mythemes[k] || 0);
            const extCls = extinctSet.has(k) ? " state-extinct" : "";
            return `<div class="mytheme-chip ${p.cls}${extCls}"><span>${esc(MYTHEME_LABELS[k] || k)}</span><strong>${esc(p.label)}</strong></div>`;
          }).join("")}
        </div>
      </div>
      <div class="meta-block" style="border-top:1px solid rgba(255,255,255,0.08);padding-top:0.65rem;">
        <div class="eyebrow">Carrier Atom · Survival Bottleneck</div>
        <div><strong>Substrate:</strong> ${esc(car.substrate)}</div>
        <div><strong>Language Gate:</strong> ${esc(car.language_gate)}</div>
        <div><strong>Redundancy:</strong> ${esc(car.redundancy_tier)}</div>
        <div><strong>Host Institution:</strong> ${esc(car.host_institution)}</div>
        <div><strong>Lost Sibling Texts:</strong> ${esc(car.lost_siblings)}</div>
      </div>
      <div class="control-row" style="margin-top:0.25rem;">
        <button type="button" id="toggle-node-sever-btn" class="btn ${lineageState.severedIds.has(node.id) ? "btn-primary" : ""}">
          ${lineageState.severedIds.has(node.id) ? `Restore ${esc(node.id)} (#${esc(node.gen_number)})` : `Sever ${esc(node.id)} (#${esc(node.gen_number)})`}
        </button>
      </div>`;

    const btn = document.getElementById("toggle-node-sever-btn");
    if (btn) {
      btn.addEventListener("click", () => {
        if (lineageState.severedIds.has(node.id)) {
          lineageState.severedIds.delete(node.id);
        } else {
          lineageState.severedIds.add(node.id);
        }
        renderLineage();
      });
    }
  }

  async function renderLineage() {
    const grid = document.getElementById("lineage-grid");
    const banner = document.getElementById("lineage-outcome-banner");
    if (!grid || !banner) return;
    if (!state.lineage.length) {
      grid.innerHTML = "<p>No 104-generation data loaded.</p>";
      return;
    }

    const req = {
      severed_ids: Array.from(lineageState.severedIds),
      severed_streams: Array.from(lineageState.severedStreams),
      disable_time_capsules: lineageState.disableCapsules
    };

    let sim = null;
    if (liveApi) {
      try {
        const res = await fetch("/api/lineage/sever", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(req)
        });
        if (res.ok) sim = await res.json();
      } catch (err) {
        sim = null;
      }
    }
    if (!sim) {
      sim = simulateSeveranceJS(state.lineage, req);
    }

    const latinCheck = document.getElementById("toggle-sever-latin");
    const greekCheck = document.getElementById("toggle-sever-greek");
    const capCheck = document.getElementById("toggle-disable-capsules");
    if (latinCheck) latinCheck.checked = lineageState.severedStreams.has("latin_monastic");
    if (greekCheck) greekCheck.checked = lineageState.severedStreams.has("greek_byzantine");
    if (capCheck) capCheck.checked = lineageState.disableCapsules;

    const statusBadge = sim.story_survives_to_2026
      ? (sim.capsule_resurrected ? "CAPSULE RESURRECTION -> 2026" : "REACHES PERSON #104 (2026 CE)")
      : "EXTINCT BEFORE 2026";
    const statusColor = sim.story_survives_to_2026 ? (sim.capsule_resurrected ? "#93c5fd" : "#a9d9b4") : "#f2aba4";

    banner.innerHTML = `
      <div class="card" style="padding:0.95rem 1.15rem;">
        <div class="card-head">
          <span class="id-tag" style="color:${statusColor};">${esc(statusBadge)}</span>
          <span class="pill">${esc(sim.alive_count)}/104 Alive · ${esc(sim.dark_count)} Dark · ${(sim.surviving_mythemes || []).length}/8 Mythemes · ${(sim.surviving_milestones || []).length}/37 Milestones · Engine: ${esc(sim.engine || "go-1.26")}</span>
        </div>
        <div style="font-size:0.9rem;color:var(--text);">${esc(sim.diagnosis)}</div>
        ${(sim.extinct_mythemes && sim.extinct_mythemes.length) ? `<div style="font-size:0.82rem;color:#f2aba4;"><strong>Extinct Mythemes in 2026:</strong> ${esc(sim.extinct_mythemes.map((k) => MYTHEME_LABELS[k] || k).join(" · "))}</div>` : ""}
      </div>`;

    const aliveSet = new Set(sim.alive_ids || []);
    grid.innerHTML = state.lineage.map((n) => {
      const severed = lineageState.severedIds.has(n.id) || lineageState.severedStreams.has(n.primary_stream);
      const alive = aliveSet.has(n.id);
      const isCaps = n.is_capsule_origin || (n.capsule_upstream_ids && n.capsule_upstream_ids.length);
      const cls = [
        "gen-cell",
        `stream-${n.primary_stream}`,
        severed ? "is-severed" : (alive ? "is-alive" : "is-dark"),
        isCaps ? "is-capsule" : "",
        lineageState.selectedId === n.id ? "is-selected" : ""
      ].filter(Boolean).join(" ");
      const yearLabel = n.year_start < 0 ? `${Math.abs(n.year_start)}b` : `${n.year_start}`;
      return `
        <button type="button" class="${cls}" data-gen-id="${esc(n.id)}" title="${esc(n.id)} (${esc(n.display_span)}) — ${esc(n.custodian_or_witness)}">
          <span class="gen-id">#${esc(n.gen_number)}${isCaps ? " &#9670;" : ""}</span>
          <span class="gen-year">${esc(yearLabel)}</span>
        </button>`;
    }).join("");

    grid.querySelectorAll("[data-gen-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        lineageState.selectedId = btn.dataset.genId;
        renderLineage();
      });
    });

    const selectedNode = state.lineage.find((n) => n.id === lineageState.selectedId) || state.lineage[0];
    renderLineageInspector(selectedNode, sim);
  }

  function applyLineagePreset(preset) {
    lineageState.severedIds.clear();
    lineageState.severedStreams.clear();
    lineageState.disableCapsules = false;
    if (preset === "virgil") {
      lineageState.severedIds.add("G-022");
      lineageState.selectedId = "G-022";
    } else if (preset === "latin") {
      lineageState.severedStreams.add("latin_monastic");
      lineageState.selectedId = "G-044";
    } else if (preset === "capsules") {
      lineageState.severedIds.add("G-021");
      lineageState.selectedId = "G-099";
    } else if (preset === "extinction") {
      lineageState.severedIds.add("G-021");
      lineageState.disableCapsules = true;
      lineageState.selectedId = "G-104";
    } else {
      lineageState.selectedId = "G-001";
    }
    renderLineage();
  }

  function renderTelemetryAndDrive() {
    const tel = state.telemetry || {};
    const go = tel.go_engine || {};
    const sb = tel.spring_boot || {};
    const a = (tel.corpus && tel.corpus.analytics) || {};
    const bench = go.benchmarks || {};
    const genCount = a.generation_count || state.lineage.length || 104;
    const totalRecords =
      (a.timeline_count || 0) +
      (a.transliteration_count || 0) +
      (a.liturgical_count || 0) +
      (a.anthropology_count || 0) +
      (a.revival_count || 0) +
      genCount;

    const earliestLabel = fmtYear(a.earliest_year != null ? a.earliest_year : -565);
    const latestLabel = fmtYear(a.latest_year != null ? a.latest_year : 2026);
    const spanEl = document.getElementById("span-label");
    if (spanEl) {
      spanEl.textContent = `Diachronic Span: ${earliestLabel} \u2192 ${latestLabel}`;
    }

    const benchParts = [];
    if (bench.greek_ns_per_op != null) benchParts.push(`Greek ${bench.greek_ns_per_op} ns/op`);
    if (bench.latin_ns_per_op != null) benchParts.push(`Latin ${bench.latin_ns_per_op} ns/op`);
    const benchLine = benchParts.length
      ? `<div><strong>Benchmarks:</strong> ${esc(benchParts.join(" · "))}</div>`
      : "";

    const rawEras = a.era_counts || {};
    const orderedEras = [];
    const seenEras = new Set();
    ERA_ORDER.forEach((era) => {
      if (Object.prototype.hasOwnProperty.call(rawEras, era)) {
        orderedEras.push([era, rawEras[era]]);
        seenEras.add(era);
      }
    });
    Object.keys(rawEras).sort().forEach((era) => {
      if (!seenEras.has(era)) {
        orderedEras.push([era, rawEras[era]]);
      }
    });

    document.getElementById("telemetry-cards").innerHTML = `
      <article class="card">
        <div class="card-head"><span class="id-tag">Go 1.26 Engine</span><span class="pill">Zero-Dep Stdlib</span></div>
        <h3>Transliteration &amp; Katabasis</h3>
        <div class="meta-block">
          <div><strong>Statement Coverage:</strong> ${go.statements_pct != null ? esc(go.statements_pct) + "%" : "Pending run"}</div>
          ${benchLine}
          <div><strong>Generated At:</strong> ${esc(tel.generated_at || "Local Build")}</div>
        </div>
      </article>
      <article class="card">
        <div class="card-head"><span class="id-tag">Spring Boot 3.4</span><span class="pill">Java 21 · H2 JPA</span></div>
        <h3>JUnit &amp; JaCoCo Verification</h3>
        <div class="meta-block">
          <div><strong>Integration Tests:</strong> ${esc(sb.junit_total || 0)} total (${esc(sb.junit_failed || 0)} failed)</div>
          <div><strong>JaCoCo Line Coverage:</strong> ${sb.jacoco_line_pct != null ? esc(sb.jacoco_line_pct) + "%" : "Pending run"}</div>
        </div>
      </article>
      <article class="card">
        <div class="card-head"><span class="id-tag">Corpus Integrity</span><span class="pill">${esc(earliestLabel)} – ${esc(latestLabel)}</span></div>
        <h3>${esc(a.span_years || 2591)}-Year Diachronic Span</h3>
        <div class="meta-block">
          <div><strong>Total Structured Records:</strong> ${esc(totalRecords)}</div>
          <div><strong>Corpus Split:</strong> ${esc(a.timeline_count || 0)} timeline · ${esc(a.transliteration_count || 0)} passages · ${esc(a.liturgical_count || 0)} liturgical · ${esc(genCount)} generations</div>
          <div><strong>Monographs:</strong> ${esc(state.monographs.length)} Markdown treatises</div>
        </div>
      </article>
      <article class="card">
        <div class="card-head"><span class="id-tag">Diachronic Coverage</span><span class="pill">${esc(orderedEras.length)} Historical Strata</span></div>
        <h3>Era Distribution</h3>
        <div class="era-dist-grid">
          ${orderedEras.map(([era, count]) => `
            <div class="era-dist-row">
              <span>${esc(fmtLabel(era))}</span>
              <strong>${esc(count)}</strong>
            </div>
          `).join("")}
        </div>
      </article>`;

    const s = state.suite.suite || {};
    const rootDrive = (state.suite.drive && state.suite.drive.root_folder) || {};
    const gh = state.suite.github || {};
    const links = [
      { kind: "GitHub Repository", badge: "Source", name: "randomcase/Orpheus", url: gh.url },
      { kind: "GitHub Pages", badge: "Live Site", name: "Live Research Atlas", url: gh.pages_url },
      { kind: "Google Drive", badge: "5 Pillars", name: rootDrive.name || "Orpheus Archive Root", url: rootDrive.url },
      { kind: "Google Sheets", badge: "7 Tabs", name: s.master_sheet && s.master_sheet.title, url: s.master_sheet && s.master_sheet.url },
      { kind: "Google Docs", badge: "6 Tabs", name: s.monograph_doc && s.monograph_doc.title, url: s.monograph_doc && s.monograph_doc.url },
      { kind: "Google Slides", badge: "7 Slides", name: s.timelapse_slides && s.timelapse_slides.title, url: s.timelapse_slides && s.timelapse_slides.url },
      { kind: "Google Colab", badge: "Go Lab", name: s.colab_notebook && s.colab_notebook.title, url: s.colab_notebook && s.colab_notebook.url },
      { kind: "Telemetry Report", badge: "Markdown", name: (s.telemetry_report && s.telemetry_report.title) || "latest-report.md", url: s.telemetry_report && s.telemetry_report.url }
    ].filter((x) => Boolean(x.url));

    document.getElementById("drive-atlas-grid").innerHTML = links.map((l) => `
      <a class="card" href="${esc(safeHref(l.url))}" target="_blank" rel="noopener noreferrer">
        <div class="card-head">
          <span class="id-tag">${esc(l.kind)}</span>
          <span class="pill">${esc(l.badge)}</span>
        </div>
        <h3>${esc(l.name)}</h3>
        <div class="drive-link-url">${esc(l.url)}</div>
        <div class="drive-open-cue">Open Resource &#8599;</div>
      </a>
    `).join("");
  }

  async function detectSpringBoot() {
    if (window.location.protocol === "file:") return;
    try {
      const res = await fetch("/api/summary");
      if (!res.ok) return;
      const sum = await res.json();
      if (!sum || !sum.counts) return;
      liveApi = true;
      const pill = document.getElementById("runtime-mode-pill");
      pill.classList.add("is-live");
      pill.textContent = sum.go_engine_online
        ? "Live Mode: Spring Boot JPA + Go 1.26 (:8091)"
        : "Live Mode: Spring Boot JPA (Go fallback)";
    } catch (err) {
      /* static GitHub Pages mode */
    }
  }

  document.querySelectorAll(".nav-tab").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab, true));
  });
  document.querySelectorAll("[data-goto]").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.goto, true));
  });

  const slider = document.getElementById("year-slider");
  slider.addEventListener("input", () => renderTimeline(parseInt(slider.value, 10)));
  document.getElementById("era-filter").addEventListener("change", () => {
    if (timeLapseTimer) { clearInterval(timeLapseTimer); timeLapseTimer = null; }
    document.getElementById("timelapse-play-btn").textContent = "Play Time-Lapse";
    slider.value = "2026";
    renderTimeline(2026);
  });
  document.getElementById("timelapse-reset-btn").addEventListener("click", () => {
    if (timeLapseTimer) { clearInterval(timeLapseTimer); timeLapseTimer = null; }
    document.getElementById("timelapse-play-btn").textContent = "Play Time-Lapse";
    slider.value = "2026";
    document.getElementById("era-filter").value = "";
    renderTimeline(2026);
  });
  document.getElementById("timelapse-play-btn").addEventListener("click", () => {
    const playBtn = document.getElementById("timelapse-play-btn");
    if (timeLapseTimer) {
      clearInterval(timeLapseTimer);
      timeLapseTimer = null;
      playBtn.textContent = "Play Time-Lapse";
      return;
    }
    const era = document.getElementById("era-filter").value;
    const years = (era ? state.timeline.filter((t) => t.era === era) : state.timeline)
      .map((t) => t.year)
      .sort((a, b) => a - b);
    if (!years.length) return;
    let idx = 0;
    playBtn.textContent = "Pause Time-Lapse";
    timeLapseTimer = setInterval(() => {
      if (idx >= years.length) {
        clearInterval(timeLapseTimer);
        timeLapseTimer = null;
        playBtn.textContent = "Play Time-Lapse";
        return;
      }
      slider.value = String(years[idx]);
      renderTimeline(years[idx]);
      idx += 1;
    }, 650);
  });

  document.querySelectorAll("[data-lineage-preset]").forEach((btn) => {
    btn.addEventListener("click", () => applyLineagePreset(btn.dataset.lineagePreset));
  });
  const lineageResetBtn = document.getElementById("lineage-reset-btn");
  if (lineageResetBtn) lineageResetBtn.addEventListener("click", () => applyLineagePreset("intact"));
  const severLatinEl = document.getElementById("toggle-sever-latin");
  if (severLatinEl) {
    severLatinEl.addEventListener("change", (e) => {
      if (e.target.checked) lineageState.severedStreams.add("latin_monastic");
      else lineageState.severedStreams.delete("latin_monastic");
      renderLineage();
    });
  }
  const severGreekEl = document.getElementById("toggle-sever-greek");
  if (severGreekEl) {
    severGreekEl.addEventListener("change", (e) => {
      if (e.target.checked) lineageState.severedStreams.add("greek_byzantine");
      else lineageState.severedStreams.delete("greek_byzantine");
      renderLineage();
    });
  }
  const disableCapsEl = document.getElementById("toggle-disable-capsules");
  if (disableCapsEl) {
    disableCapsEl.addEventListener("change", (e) => {
      lineageState.disableCapsules = e.target.checked;
      renderLineage();
    });
  }

  document.getElementById("run-translit-btn").addEventListener("click", runLiveTranslit);
  document.getElementById("tradition-filter").addEventListener("change", renderLiturgical);
  document.getElementById("run-sim-btn").addEventListener("click", () => runKatabasis(null));
  document.getElementById("run-faithful-btn").addEventListener("click", () => runKatabasis(0));

  window.addEventListener("hashchange", () => switchTab((location.hash || "").replace("#", ""), false));

  updateStats();
  populateEraFilter();
  renderTimeline(2026);
  renderLineage();
  if (window.OrpheusRPG) {
    window.OrpheusRPG.init({ liveApiGetter: () => liveApi });
  }
  renderPassages();
  runLiveTranslit();
  renderLiturgical();
  renderMonographs();
  renderAnthropology();
  renderRevivals();
  runKatabasis(11);
  renderTelemetryAndDrive();
  switchTab((location.hash || "").replace("#", "") || "timeline", false);
  detectSpringBoot();
})();
