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
    monographs: bundle.monographs || [],
    telemetry: bundle.telemetry || {},
    suite: bundle.suite || {}
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

  function renderMd(md) {
    const lines = String(md || "").replace(/\r\n/g, "\n").split("\n");
    const out = [];
    let i = 0;
    const inline = (t) => esc(t)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>");

    while (i < lines.length) {
      const t = lines[i].trim();
      if (!t) { i += 1; continue; }
      const hm = t.match(/^(#{1,3})\s+(.+)$/);
      if (hm) {
        out.push(`<h${hm[1].length}>${inline(hm[2])}</h${hm[1].length}>`);
        i += 1;
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
      while (i < lines.length && lines[i].trim() && !/^(#{1,3}\s+|\||(\*|-|\d+\.)\s+)/.test(lines[i].trim())) {
        p.push(lines[i].trim());
        i += 1;
      }
      out.push(`<p>${inline(p.join(" "))}</p>`);
    }
    return out.join("\n");
  }

  function switchTab(tabId) {
    const valid = ["timeline", "transliteration", "catholic-liturgy", "anthropology", "revivals", "katabasis", "telemetry"];
    const target = valid.includes(tabId) ? tabId : "timeline";
    document.querySelectorAll(".nav-tab").forEach((b) => b.classList.toggle("is-active", b.dataset.tab === target));
    document.querySelectorAll(".panel").forEach((p) => p.classList.toggle("is-active", p.id === "panel-" + target));
    history.replaceState(null, "", "#" + target);
  }

  function updateStats() {
    document.getElementById("stat-timeline").textContent = state.timeline.length;
    document.getElementById("stat-passages").textContent = state.transliterations.length;
    document.getElementById("stat-liturgical").textContent = state.liturgical.length;
    document.getElementById("stat-anthro").textContent = state.anthropology.length;
    document.getElementById("stat-revivals").textContent = state.revivals.length;
  }

  function populateEraFilter() {
    const sel = document.getElementById("era-filter");
    const eras = Array.from(new Set(state.timeline.map((t) => t.era)));
    eras.forEach((e) => {
      const opt = document.createElement("option");
      opt.value = e;
      opt.textContent = fmtLabel(e);
      sel.appendChild(opt);
    });
  }

  function renderTimeline(maxYear) {
    const era = document.getElementById("era-filter").value;
    const cutoff = maxYear != null ? maxYear : 2026;
    const items = state.timeline.filter((item) => item.year <= cutoff && (!era || item.era === era));

    document.getElementById("scrubber-readout").textContent =
      cutoff >= 2026 && !era
        ? `All Eras (${items.length} milestones)`
        : `Up to ${cutoff < 0 ? Math.abs(cutoff) + " BCE" : cutoff + " CE"} (${items.length} shown)`;

    document.getElementById("timeline-grid").innerHTML = items.map((m) => `
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
    const box = document.getElementById("monograph-reader");
    if (!state.monographs.length) {
      box.innerHTML = "<p>No monographs loaded.</p>";
      return;
    }
    sel.innerHTML = state.monographs.map((m, idx) => `<option value="${idx}">${esc(m.filename)}</option>`).join("");
    const show = () => {
      const m = state.monographs[parseInt(sel.value, 10) || 0];
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

  function renderTelemetryAndDrive() {
    const tel = state.telemetry || {};
    const go = tel.go_engine || {};
    const sb = tel.spring_boot || {};
    const a = (tel.corpus && tel.corpus.analytics) || {};
    const bench = go.benchmarks || {};
    const totalRecords =
      (a.timeline_count || 0) +
      (a.transliteration_count || 0) +
      (a.liturgical_count || 0) +
      (a.anthropology_count || 0) +
      (a.revival_count || 0);

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
          <div><strong>Corpus Split:</strong> ${esc(a.timeline_count || 0)} timeline · ${esc(a.transliteration_count || 0)} passages · ${esc(a.liturgical_count || 0)} liturgical</div>
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
      { kind: "Google Sheets", badge: "6 Tabs", name: s.master_sheet && s.master_sheet.title, url: s.master_sheet && s.master_sheet.url },
      { kind: "Google Docs", badge: "5 Tabs", name: s.monograph_doc && s.monograph_doc.title, url: s.monograph_doc && s.monograph_doc.url },
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
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });
  document.querySelectorAll("[data-goto]").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.goto));
  });

  const slider = document.getElementById("year-slider");
  slider.addEventListener("input", () => renderTimeline(parseInt(slider.value, 10)));
  document.getElementById("era-filter").addEventListener("change", () => renderTimeline(parseInt(slider.value, 10)));
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
    const years = state.timeline.map((t) => t.year).sort((a, b) => a - b);
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

  document.getElementById("run-translit-btn").addEventListener("click", runLiveTranslit);
  document.getElementById("tradition-filter").addEventListener("change", renderLiturgical);
  document.getElementById("run-sim-btn").addEventListener("click", () => runKatabasis(null));
  document.getElementById("run-faithful-btn").addEventListener("click", () => runKatabasis(0));

  window.addEventListener("hashchange", () => switchTab((location.hash || "").replace("#", "")));

  updateStats();
  populateEraFilter();
  renderTimeline(2026);
  renderPassages();
  runLiveTranslit();
  renderLiturgical();
  renderMonographs();
  renderAnthropology();
  renderRevivals();
  runKatabasis(11);
  renderTelemetryAndDrive();
  switchTab((location.hash || "").replace("#", "") || "timeline");
  detectSpringBoot();
})();
