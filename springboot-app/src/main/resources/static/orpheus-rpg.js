(function (global) {
  "use strict";

  const BIOME_COLORS = {
    argo: { skyTop: "#09131c", skyBot: "#172634", accent: "#7a9ec2", glow: "#d4a959" },
    grove: { skyTop: "#0b1410", skyBot: "#1b281e", accent: "#73a681", glow: "#ebcc92" },
    meadow: { skyTop: "#19130b", skyBot: "#2a1f12", accent: "#d4a959", glow: "#c2574d" },
    tartarus: { skyTop: "#11090c", skyBot: "#221015", accent: "#c2574d", glow: "#9b6b9e" },
    throne: { skyTop: "#0c0912", skyBot: "#1c1324", accent: "#d4a959", glow: "#ebcc92" },
    ascent: { skyTop: "#090807", skyBot: "#1e1710", accent: "#ebcc92", glow: "#d4a959" },
    lyra: { skyTop: "#070b14", skyBot: "#141d2e", accent: "#ebcc92", glow: "#7a9ec2" }
  };

  const HYMN_MODES = {
    dorian: {
      name: "Dorian Sea-Calm",
      notes: [293.66, 329.63, 392.0, 440.0, 587.33],
      color: "#7a9ec2",
      effectLabel: "+10 Peitho · Storms Stilled",
      peithoDelta: 6,
      mnemoDelta: 2,
      pothosDelta: -4
    },
    aeolian: {
      name: "Aeolian Nature-Charm",
      notes: [220.0, 261.63, 329.63, 392.0, 440.0],
      color: "#73a681",
      effectLabel: "+8 Mnemosyne · Beasts & Birds Attuned",
      peithoDelta: 4,
      mnemoDelta: 8,
      pothosDelta: -5
    },
    phrygian: {
      name: "Phrygian Lament",
      notes: [329.63, 349.23, 440.0, 493.88, 659.25],
      color: "#c2574d",
      effectLabel: "+12 Peitho · Hades Moved to Weep",
      peithoDelta: 12,
      mnemoDelta: 0,
      pothosDelta: 6
    },
    mnemosyne: {
      name: "Hymn of Mnemosyne",
      notes: [261.63, 329.63, 392.0, 523.25, 659.25],
      color: "#ebcc92",
      effectLabel: "-12 Pothos · Starry Memory Held",
      peithoDelta: 3,
      mnemoDelta: 10,
      pothosDelta: -12
    }
  };

  function buildLocalCampaign(rawDoctrine) {
    const d = String(rawDoctrine || "").toLowerCase().trim();
    const doctrine = (d === "archaic_redemptive" || d === "consensual_memory") ? d : "canonical_tragic";

    const act6Config = doctrine === "archaic_redemptive"
      ? {
          pothos: 62,
          mnemosyne: 98,
          hp: 95,
          hymn: "Archaic Hymn of Blind Trust (Mnemosyne Shield)",
          quote: "εἰ δ᾽ Ὀρφέως μοι γλῶσσα... ἐξ Ἅιδου λαβεῖν (Alcestis 357–362)",
          outcome: "THRESHOLD_CROSSED_TOGETHER",
          finalOutcome: "REUNITED_IN_SUNLIGHT",
          events: [
            "Steps 1–10: Orpheus climbs steadily holding the Hipponion Memory Lamella.",
            "Step 11/12 Critical Check: Pothos steadies at 62/100 (< 100 threshold); eyes stay ahead.",
            "Step 12/12: Eurydice crosses into open sunlight — Archaic & Sir Orfeo happy ending!"
          ]
        }
      : doctrine === "consensual_memory"
      ? {
          pothos: 84,
          mnemosyne: 100,
          hp: 90,
          hymn: "Duet of Witness ('Turn Around' / Chosen Memory)",
          quote: "Ne regrette pas. Choisis le souvenir du poète (Sciamma 2019)",
          outcome: "CONSENSUAL_GAZE_FULFILLED",
          finalOutcome: "ETERNAL_RESONANCE",
          events: [
            "Steps 1–10: Both climb silently toward the daylight verge.",
            "Step 11/12: Eurydice whispers 'Turn around' — turning failure into mutual, chosen memory.",
            "Step 12/12: Loss transforms into immortal witness across cinema and stage."
          ]
        }
      : {
          pothos: 100,
          mnemosyne: 78,
          hp: 45,
          hymn: "Breathless Ascent (Silence Under Motif C331)",
          quote: "Immemor heu! victusque animi respexit... 'Vale!' (Georgics IV.491)",
          outcome: "RESPEXIT_RELAPSA_INTO_AVERNO",
          finalOutcome: "RELAPSA_INTO_AVERNO",
          events: [
            "Steps 1–10: Steep silent ascent through chilling subterranean cavern dark.",
            "Step 11/12 Critical Failure: Pothos spikes to 100/100 — Orpheus looks back at the threshold!",
            "Eurydice whispers 'Vale' and fades back into Averno (-27 Psyche HP)."
          ]
        };

    const acts = [
      {
        act_number: 1, roman: "I", title: "Aboard the Argo & Clashing Rocks",
        era_label: "c. 565–545 BCE · Delphi Metope & Ibycus", biome: "argo",
        encounter: "Symplegades Clashing Cliffs & Storm-Swollen Aegean",
        hymn_cast: "Dorian Sea-Calm (Nine-String Kithara)",
        greek_or_latin_quote: "ΟΡΦΑΣ · ὀνομάκλυτον Ὀρφήν (Delphi & Ibycus PMG 306)",
        outcome: "VICTORY_HARMONIC_PASSAGE", relic_unlocked: "Apolline Seven-String Kithara",
        stats_after: { level: 1, xp: 140, psyche_hp: 100, melos_mana: 100, peitho: 40, mnemosyne: 40, pothos: 10 },
        events: [
          "Jason signals the oarsmen as crashing waves threaten the Argo.",
          "Orpheus strums Dorian Sea-Calm; expanding golden rings part the Symplegades.",
          "Lv.1 Quest Cleared · +15 Peitho · Relic: Apolline Seven-String Kithara."
        ]
      },
      {
        act_number: 2, roman: "II", title: "Pierian Grove & Olbia Initiations",
        era_label: "c. 505–485 BCE · Simonides & Olbia Tablets", biome: "grove",
        encounter: "Untamed Thracian Beasts, Birds & Olbia Mystery Trial",
        hymn_cast: "Aeolian Nature-Charm",
        greek_or_latin_quote: "Βίος θάνατος βίος · ἀλήθεια · Διόνυσος Ὀρφικοί",
        outcome: "NATURE_AND_SOUL_ATTUNED", relic_unlocked: "Olbia Bone Plaque (Life-Death-Life)",
        stats_after: { level: 2, xp: 320, psyche_hp: 100, melos_mana: 95, peitho: 58, mnemosyne: 60, pothos: 15 },
        events: [
          "Birds hover overhead while fish leap clear from sea waves (Simonides PMG 567).",
          "Olbia initiates inscribe 'Life – Death – Life · Truth' on the bone passport.",
          "Level Up -> Lv.2! +18 Peitho · +20 Mnemosyne · Relic: Olbia Bone Plaque."
        ]
      },
      {
        act_number: 3, roman: "III", title: "Hymenaios Meadow & The Lurking Serpent",
        era_label: "Ovid X.8–10 · Virgil Georgics IV.457", biome: "meadow",
        encounter: "Venomous Viper Strike on Eurydice's Heel",
        hymn_cast: "Phrygian Lament",
        greek_or_latin_quote: "Occidit in talum serpentis dente recepto",
        outcome: "BEREAVEMENT_KATABASIS_SWORN", relic_unlocked: "Bridal Saffron Veil",
        stats_after: { level: 3, xp: 510, psyche_hp: 72, melos_mana: 92, peitho: 58, mnemosyne: 60, pothos: 57 },
        events: [
          "Hymenaios's wedding torch gutters with smoke across the Thracian meadow.",
          "Viper Strike Critical Hit: Eurydice falls (-28 Psyche HP, +42 Pothos yearning).",
          "Level Up -> Lv.3! Katabasis sworn at Cave Taenarum · Relic: Bridal Saffron Veil."
        ]
      },
      {
        act_number: 4, roman: "IV", title: "Crossing Styx, Cerberus & Tartarus",
        era_label: "c. 400–340 BCE · Hipponion Lamella & Derveni", biome: "tartarus",
        encounter: "Charon, Three-Headed Cerberus & Ixion's Wheel",
        hymn_cast: "Hymn of Mnemosyne (Forbidden Cypress Bypass)",
        greek_or_latin_quote: "Γῆς παῖς εἰμι καὶ Οὐρανοῦ ἀστερόεντος",
        outcome: "TARTARUS_CHOREOGRAPHY_SUSPENDED", relic_unlocked: "Hipponion Gold Memory Lamella",
        stats_after: { level: 4, xp: 760, psyche_hp: 72, melos_mana: 88, peitho: 80, mnemosyne: 60, pothos: 67 },
        events: [
          "At the forbidden cypress, Orpheus drinks from Memory rather than Forgetfulness.",
          "Three-headed Cerberus drops asleep; Ixion's fiery wheel freezes motionless!",
          "Level Up -> Lv.4! +22 Peitho · Relic: Hipponion Gold Memory Lamella."
        ]
      },
      {
        act_number: 5, roman: "V", title: "Plea Before Hades & Persephone",
        era_label: "Euripides Alcestis 357 · Ovid Met. X.17–49", biome: "throne",
        encounter: "Lords of the Underworld & The Iron Covenant",
        hymn_cast: "Covenant Arioso of Amor & Memory",
        greek_or_latin_quote: "Vicit Amor; hanc legem accipe, ne flectas retro lumina",
        outcome: "CONDITIONAL_PACT_GRANTED", relic_unlocked: "Pomegranate Seal of Persephone",
        stats_after: { level: 5, xp: 1040, psyche_hp: 72, melos_mana: 82, peitho: 96, mnemosyne: 85, pothos: 79 },
        events: [
          "Tantalus forgets his thirst and Persephone sheds tears upon the iron throne.",
          "Motif C331 Covenant Sealed: walk ahead without turning back until daylight.",
          "Level Up -> Lv.5! Peitho 96 · Relic: Pomegranate Seal of Persephone."
        ]
      },
      {
        act_number: 6, roman: "VI", title: "Twelve Steps of Cave Taenarum",
        era_label: "Motif C331 Crisis · Step 11/12 Divergence", biome: "ascent",
        encounter: "The Daylight Threshold & Backward-Glance Check",
        hymn_cast: act6Config.hymn,
        greek_or_latin_quote: act6Config.quote,
        outcome: act6Config.outcome, relic_unlocked: "Threshold Mirror Shard",
        stats_after: { level: 6, xp: 1380, psyche_hp: act6Config.hp, melos_mana: 78, peitho: 96, mnemosyne: act6Config.mnemosyne, pothos: act6Config.pothos },
        events: act6Config.events
      },
      {
        act_number: 7, roman: "VII", title: "Hebrus Oracle & Constellation Lyra",
        era_label: "Lesbos Oracle · Boethius -> 2026 CE", biome: "lyra",
        encounter: "Maenadic Sparagmos, Singing Head & Celestial Katasterismos",
        hymn_cast: "Nova Cantio Harmoniae (Song Without End)",
        greek_or_latin_quote: "Vos haec fabula respicit (Boethius III.m12 · 524 CE)",
        outcome: "IMMORTALIZED_IN_SONG_TO_2026", relic_unlocked: "Starlight Constellation Lyra",
        stats_after: { level: 7, xp: 1800, psyche_hp: act6Config.hp, melos_mana: 100, peitho: 100, mnemosyne: 100, pothos: act6Config.pothos },
        events: [
          doctrine === "canonical_tragic"
            ? "Orpheus's singing head floats down Hebrus to Lesbos while his shade rejoins Eurydice."
            : "Across 104 generations—from Archaic Delphi to 2026—the threshold song endures unbroken.",
          "Apollo lifts the seven-string kithara into the northern sky as Constellation Lyra.",
          "MAX LV.7 REACHED · Relic: Starlight Constellation Lyra."
        ]
      }
    ];

    let relicAcc = [];
    acts.forEach((a) => {
      relicAcc = relicAcc.concat([a.relic_unlocked]);
      a.stats_after.relics = relicAcc.slice();
    });

    return {
      hero: "Orpheus of Thrace",
      class: "Kitharode & Katabasis Bard",
      doctrine,
      final_outcome: act6Config.finalOutcome,
      acts,
      final_stats: acts[acts.length - 1].stats_after,
      engine: "browser-rpg-engine"
    };
  }

  const rpgState = {
    initialized: false,
    liveApiGetter: () => false,
    mode: "canonical_tragic", // canonical_tragic | archaic_redemptive | consensual_memory | manual_choice
    manualChoicePending: false,
    manualDecision: null,     // null | "faithful" | "look_back"
    campaign: buildLocalCampaign("canonical_tragic"),
    actIdx: 0,
    beatIdx: 0,
    ascentStep: 1,
    playing: false,
    autoLoop: true,
    speed: 1,
    audioEnabled: false,
    audioCtx: null,
    timerId: null,
    rafId: null,
    activeTabVisible: false,
    startTime: Date.now(),
    lastLogKey: "",
    logs: [],
    rings: [],
    floaters: [],
    bonusStats: { peitho: 0, mnemosyne: 0, pothos: 0 }
  };

  function esc(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  function effectiveDoctrine() {
    if (rpgState.mode !== "manual_choice") return rpgState.mode;
    return rpgState.manualDecision === "faithful" ? "archaic_redemptive" : "canonical_tragic";
  }

  function playKitharaChord(modeKey) {
    if (!rpgState.audioEnabled) return;
    const AudioCtor = global.AudioContext || global.webkitAudioContext;
    if (!AudioCtor) return;
    try {
      if (!rpgState.audioCtx) rpgState.audioCtx = new AudioCtor();
      if (rpgState.audioCtx.state === "suspended") rpgState.audioCtx.resume();
      const ctx = rpgState.audioCtx;
      const spec = HYMN_MODES[modeKey] || HYMN_MODES.dorian;
      const now = ctx.currentTime;
      spec.notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = i % 2 === 0 ? "triangle" : "sine";
        osc.frequency.setValueAtTime(freq, now + i * 0.06);
        gain.gain.setValueAtTime(0.0001, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.065, now + i * 0.06 + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.06 + 0.72);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.76);
      });
    } catch (err) {
      /* ignore Web Audio autoplay restrictions */
    }
  }

  function spawnRing(color, x, y) {
    rpgState.rings.push({ x: x || 310, y: y || 255, r: 12, maxR: 260, color: color || "#d4a959", alpha: 0.95 });
  }

  function spawnFloater(text, x, y, color) {
    rpgState.floaters.push({ text, x: x || 310, y: y || 195, color: color || "#ebcc92", life: 1.0 });
  }

  function pushLog(act, text, tone) {
    const key = `${act.act_number}:${text}`;
    if (rpgState.lastLogKey === key) return;
    rpgState.lastLogKey = key;
    rpgState.logs.unshift({ act: act.roman, title: act.title, text, tone: tone || "normal" });
    if (rpgState.logs.length > 28) rpgState.logs.length = 28;
  }

  function computeDisplayedStats() {
    const acts = (rpgState.campaign && rpgState.campaign.acts) || [];
    const current = acts[rpgState.actIdx] || acts[0];
    if (!current) {
      return { level: 1, xp: 0, psyche_hp: 100, melos_mana: 100, peitho: 25, mnemosyne: 30, pothos: 10, relics: [] };
    }
    const base = rpgState.beatIdx >= 2 || rpgState.actIdx > 0
      ? current.stats_after
      : (acts[rpgState.actIdx - 1] ? acts[rpgState.actIdx - 1].stats_after : current.stats_after);
    return {
      level: base.level,
      xp: base.xp,
      psyche_hp: base.psyche_hp,
      melos_mana: base.melos_mana,
      peitho: clamp(base.peitho + rpgState.bonusStats.peitho, 0, 100),
      mnemosyne: clamp(base.mnemosyne + rpgState.bonusStats.mnemosyne, 0, 100),
      pothos: clamp(base.pothos + rpgState.bonusStats.pothos, 0, 100),
      relics: (base.relics || []).slice()
    };
  }

  async function refreshCampaign(doctrineOverride) {
    const doc = doctrineOverride || effectiveDoctrine();
    let result = buildLocalCampaign(doc);
    if (rpgState.liveApiGetter && rpgState.liveApiGetter()) {
      try {
        const res = await fetch("/api/rpg/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ doctrine: doc })
        });
        if (res.ok) {
          const remote = await res.json();
          if (remote && Array.isArray(remote.acts) && remote.acts.length === 7) {
            result = Object.assign(buildLocalCampaign(doc), remote);
            // Preserve rich local biome/quote strings if JVM fallback omitted them
            const localActs = buildLocalCampaign(doc).acts;
            result.acts = result.acts.map((a, idx) => Object.assign({}, localActs[idx], a));
          }
        }
      } catch (err) {
        /* use local campaign */
      }
    }
    rpgState.campaign = result;
    renderHUD();
  }

  function scheduleTick() {
    if (rpgState.timerId) {
      clearTimeout(rpgState.timerId);
      rpgState.timerId = null;
    }
    if (!rpgState.playing || rpgState.manualChoicePending) return;
    const baseDelay = (rpgState.actIdx === 5 && rpgState.beatIdx === 1) ? 420 : 1450;
    const delay = Math.max(120, Math.round(baseDelay / rpgState.speed));
    rpgState.timerId = setTimeout(() => {
      stepForward();
      scheduleTick();
    }, delay);
  }

  function stepForward() {
    const acts = (rpgState.campaign && rpgState.campaign.acts) || [];
    if (!acts.length) return;
    const act = acts[rpgState.actIdx];

    if (rpgState.actIdx === 5 && rpgState.beatIdx === 1) {
      if (rpgState.ascentStep < 11) {
        rpgState.ascentStep += 1;
        renderHUD();
        return;
      }
      if (rpgState.mode === "manual_choice" && !rpgState.manualDecision) {
        rpgState.manualChoicePending = true;
        rpgState.playing = false;
        pushLog(act, "Step 11/12 REACHED: Pothos trembles at daylight's rim! Choose whether to look back.", "crisis");
        renderHUD();
        return;
      }
    }

    if (rpgState.beatIdx < 2) {
      rpgState.beatIdx += 1;
      const evText = (act.events && act.events[rpgState.beatIdx]) || act.outcome;
      pushLog(act, evText, (act.act_number === 3 || (act.act_number === 6 && effectiveDoctrine() === "canonical_tragic")) && rpgState.beatIdx === 2 ? "crisis" : "normal");

      if (rpgState.beatIdx === 1) {
        spawnRing(BIOME_COLORS[act.biome].glow, 300, 250);
        spawnFloater(act.hymn_cast.split("(")[0].trim(), 300, 175, "#ebcc92");
        playKitharaChord(act.act_number % 2 === 0 ? "aeolian" : "dorian");
      } else if (rpgState.beatIdx === 2) {
        if (act.act_number === 6) rpgState.ascentStep = 12;
        spawnRing("#73a681", 340, 220);
        spawnFloater(`LV.${act.stats_after.level} · +${act.relic_unlocked}`, 450, 155, "#a9d9b4");
      }
      renderHUD();
      return;
    }

    // Advance to next Act
    if (rpgState.actIdx < acts.length - 1) {
      rpgState.actIdx += 1;
      rpgState.beatIdx = 0;
      rpgState.ascentStep = 1;
      const nextAct = acts[rpgState.actIdx];
      pushLog(nextAct, (nextAct.events && nextAct.events[0]) || nextAct.encounter, "normal");
      renderHUD();
      return;
    }

    // Completed Act VII
    if (rpgState.autoLoop) {
      restartCampaign(true);
    } else {
      rpgState.playing = false;
      renderHUD();
    }
  }

  function jumpToAct(idx) {
    const acts = (rpgState.campaign && rpgState.campaign.acts) || [];
    if (!acts.length) return;
    rpgState.actIdx = clamp(idx, 0, acts.length - 1);
    rpgState.beatIdx = 0;
    rpgState.ascentStep = rpgState.actIdx === 5 ? 4 : 1;
    rpgState.manualChoicePending = false;
    const act = acts[rpgState.actIdx];
    pushLog(act, `Entered Act ${act.roman}: ${act.title}`, "normal");
    spawnRing(BIOME_COLORS[act.biome].accent, 300, 240);
    renderHUD();
  }

  function restartCampaign(autoStart) {
    rpgState.actIdx = 0;
    rpgState.beatIdx = 0;
    rpgState.ascentStep = 1;
    rpgState.manualChoicePending = false;
    rpgState.manualDecision = null;
    rpgState.bonusStats = { peitho: 0, mnemosyne: 0, pothos: 0 };
    rpgState.logs = [];
    rpgState.lastLogKey = "";
    rpgState.campaign = buildLocalCampaign(effectiveDoctrine());
    const first = rpgState.campaign.acts[0];
    pushLog(first, (first.events && first.events[0]) || first.encounter, "normal");
    rpgState.playing = Boolean(autoStart);
    renderHUD();
    scheduleTick();
  }

  function castInteractiveHymn(hymnKey) {
    const spec = HYMN_MODES[hymnKey] || HYMN_MODES.dorian;
    rpgState.bonusStats.peitho += spec.peithoDelta;
    rpgState.bonusStats.mnemosyne += spec.mnemoDelta;
    rpgState.bonusStats.pothos += spec.pothosDelta;
    spawnRing(spec.color, 300, 245);
    spawnRing("#ebcc92", 300, 245);
    spawnFloater(`${spec.name}: ${spec.effectLabel}`, 450, 140, spec.color);
    playKitharaChord(hymnKey);
    const acts = rpgState.campaign.acts || [];
    const act = acts[rpgState.actIdx] || acts[0];
    if (act) pushLog(act, `Player Strums ${spec.name} (${spec.effectLabel})`, "normal");
    renderHUD();
  }

  function resolveThresholdChoice(choice) {
    rpgState.manualDecision = choice === "faithful" ? "faithful" : "look_back";
    rpgState.manualChoicePending = false;
    rpgState.campaign = buildLocalCampaign(effectiveDoctrine());
    rpgState.actIdx = 5;
    rpgState.beatIdx = 2;
    rpgState.ascentStep = 12;
    const act = rpgState.campaign.acts[5];
    pushLog(
      act,
      choice === "faithful"
        ? "CHOICE: Kept eyes fixed on upper daylight! Eurydice crosses free!"
        : "CHOICE: Looked back at Step 11/12! Eurydice slips back ('Vale...').",
      choice === "faithful" ? "victory" : "crisis"
    );
    spawnRing(choice === "faithful" ? "#73a681" : "#c2574d", 520, 185);
    spawnFloater(choice === "faithful" ? "FAITHFUL ASCENT!" : "RESPEXIT!", 480, 145, choice === "faithful" ? "#a9d9b4" : "#f2aba4");
    playKitharaChord(choice === "faithful" ? "mnemosyne" : "phrygian");
    rpgState.playing = true;
    renderHUD();
    scheduleTick();
  }

  function renderHUD() {
    const doc = global.document;
    if (!doc) return;
    const acts = (rpgState.campaign && rpgState.campaign.acts) || [];
    const act = acts[rpgState.actIdx] || acts[0];
    if (!act) return;
    const st = computeDisplayedStats();

    const stepper = doc.getElementById("rpg-act-stepper");
    if (stepper) {
      stepper.innerHTML = acts.map((a, idx) => `
        <button type="button" class="rpg-act-pill${idx === rpgState.actIdx ? " is-active" : (idx < rpgState.actIdx ? " is-done" : "")}" data-rpg-act="${idx}">
          <span>${esc(a.roman)}</span>
          <small>${esc(a.biome.toUpperCase())}</small>
        </button>
      `).join("");
      stepper.querySelectorAll("[data-rpg-act]").forEach((btn) => {
        btn.addEventListener("click", () => jumpToAct(parseInt(btn.dataset.rpgAct, 10)));
      });
    }

    const playBtn = doc.getElementById("rpg-play-btn");
    if (playBtn) playBtn.textContent = rpgState.playing ? "Pause Quest" : "Resume Quest";

    const audioBtn = doc.getElementById("rpg-audio-btn");
    if (audioBtn) audioBtn.textContent = rpgState.audioEnabled ? "Lyre Audio: ON" : "Lyre Audio: OFF";

    const choiceBanner = doc.getElementById("rpg-choice-banner");
    if (choiceBanner) {
      choiceBanner.style.display = rpgState.manualChoicePending ? "flex" : "none";
    }

    const sheetEl = doc.getElementById("rpg-character-sheet");
    if (sheetEl) {
      const bar = (label, val, maxVal, color) => `
        <div class="rpg-stat-row">
          <div style="display:flex;justify-content:space-between;font-size:0.78rem;">
            <span>${esc(label)}</span><strong>${esc(val)}/${esc(maxVal)}</strong>
          </div>
          <div class="rpg-stat-track"><div class="rpg-stat-fill" style="width:${clamp(Math.round((val / maxVal) * 100), 0, 100)}%;background:${color};"></div></div>
        </div>`;
      sheetEl.innerHTML = `
        <div class="card-head">
          <span class="id-tag">Lv.${esc(st.level)} Orpheus · XP ${esc(st.xp)}</span>
          <span class="pill">Act ${esc(act.roman)}/VII</span>
        </div>
        <h3>${esc(act.title)}</h3>
        <div class="meta-block" style="font-size:0.82rem;">
          <div><strong>Era:</strong> ${esc(act.era_label)}</div>
          <div><strong>Encounter:</strong> ${esc(act.encounter)}</div>
          <div><strong>Epigraph:</strong> <em>${esc(act.greek_or_latin_quote)}</em></div>
        </div>
        <div style="display:grid;gap:0.45rem;">
          ${bar("Psyche HP", st.psyche_hp, 100, "#73a681")}
          ${bar("Peitho (Persuasion)", st.peitho, 100, "#d4a959")}
          ${bar("Mnemosyne (Memory)", st.mnemosyne, 100, "#7a9ec2")}
          ${bar("Pothos (Motif C331 Doubt)", st.pothos, 100, st.pothos >= 90 ? "#c2574d" : "#ebcc92")}
        </div>
        <div>
          <div class="eyebrow" style="margin-bottom:0.35rem;">Relics Unlocked (${esc((st.relics || []).length)}/7)</div>
          <div class="rpg-relic-grid">
            ${(st.relics || []).map((r) => `<span class="pill">${esc(r)}</span>`).join("")}
          </div>
        </div>`;
    }

    const logEl = doc.getElementById("rpg-log-feed");
    if (logEl) {
      logEl.innerHTML = rpgState.logs.map((entry) => `
        <div class="event-row ${entry.tone === "crisis" ? "is-broken" : (entry.tone === "victory" ? "is-reunited" : "")}">
          <div><strong>[Act ${esc(entry.act)} · ${esc(entry.title)}]</strong> ${esc(entry.text)}</div>
        </div>
      `).join("");
    }
  }

  function drawLyreFigure(ctx, x, y, scale, facingRight, turnHeadBack, t, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(facingRight ? scale : -scale, scale);

    // Subtle heroic aura
    const aura = ctx.createRadialGradient(0, -28, 4, 0, -28, 44);
    aura.addColorStop(0, "rgba(235, 204, 146, 0.25)");
    aura.addColorStop(1, "rgba(235, 204, 146, 0)");
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, -28, 44, 0, Math.PI * 2);
    ctx.fill();

    // Cloak silhouette (chlamys) billowing gently
    const capeWave = Math.sin(t * 4) * 3;
    ctx.fillStyle = color || "#d4a959";
    ctx.beginPath();
    ctx.moveTo(-4, -38);
    ctx.quadraticCurveTo(-22, -20 + capeWave, -24, 0);
    ctx.lineTo(10, 0);
    ctx.lineTo(6, -38);
    ctx.closePath();
    ctx.fill();

    // Head
    ctx.fillStyle = "#ebcc92";
    ctx.beginPath();
    ctx.arc(turnHeadBack ? -6 : 2, -47, 8, 0, Math.PI * 2);
    ctx.fill();

    // Laurel / Phrygian crown
    ctx.strokeStyle = "#d4a959";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(turnHeadBack ? -6 : 2, -48, 9, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();

    // Held Kithara
    ctx.strokeStyle = "#fff1cf";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(14, -30, 8, 0, Math.PI, false);
    ctx.moveTo(8, -30);
    ctx.lineTo(6, -45);
    ctx.moveTo(20, -30);
    ctx.lineTo(22, -45);
    ctx.moveTo(5, -45);
    ctx.lineTo(23, -45);
    ctx.stroke();

    ctx.restore();
  }

  function drawEurydiceShade(ctx, x, y, scale, alpha, t) {
    if (alpha <= 0.02) return;
    ctx.save();
    ctx.globalAlpha = clamp(alpha, 0, 1);
    ctx.translate(x, y + Math.sin(t * 2.8) * 3);
    ctx.scale(scale, scale);

    const glow = ctx.createRadialGradient(0, -28, 3, 0, -28, 40);
    glow.addColorStop(0, "rgba(122, 158, 194, 0.42)");
    glow.addColorStop(1, "rgba(122, 158, 194, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, -28, 40, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#b9d3eb";
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.quadraticCurveTo(-8, -28, 0, -40);
    ctx.quadraticCurveTo(9, -28, 11, 0);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#e6f1fb";
    ctx.beginPath();
    ctx.arc(0, -47, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function renderCanvasFrame() {
    const doc = global.document;
    const canvas = doc && doc.getElementById("rpg-canvas");
    if (!canvas || typeof canvas.getContext !== "function") return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width || 920;
    const H = canvas.height || 420;
    const t = (Date.now() - rpgState.startTime) / 1000;
    const acts = (rpgState.campaign && rpgState.campaign.acts) || [];
    const act = acts[rpgState.actIdx] || acts[0];
    if (!act) return;

    const pal = BIOME_COLORS[act.biome] || BIOME_COLORS.argo;
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, pal.skyTop);
    bg.addColorStop(1, pal.skyBot);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Ambient twinkling stars
    ctx.fillStyle = "rgba(235, 204, 146, 0.5)";
    for (let s = 0; s < 36; s += 1) {
      const sx = ((s * 97) % W);
      const sy = ((s * 53) % (H * 0.6));
      const r = 0.8 + ((s % 3) * 0.5) + Math.sin(t * 2 + s) * 0.4;
      ctx.beginPath();
      ctx.arc(sx, sy, Math.max(0.4, r), 0, Math.PI * 2);
      ctx.fill();
    }

    const st = computeDisplayedStats();

    // Biome-specific animated scenery
    if (act.biome === "argo") {
      const gapOffset = rpgState.beatIdx >= 1 ? 48 : Math.sin(t * 2) * 14;
      ctx.fillStyle = "#1c1916";
      ctx.beginPath();
      ctx.moveTo(560 - gapOffset, H);
      ctx.lineTo(630 - gapOffset, 95);
      ctx.lineTo(690 - gapOffset, H);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(740 + gapOffset, H);
      ctx.lineTo(800 + gapOffset, 85);
      ctx.lineTo(880 + gapOffset, H);
      ctx.fill();

      // Argo ship rocking
      const shipY = 262 + Math.sin(t * 2.2) * 7;
      ctx.save();
      ctx.translate(320, shipY);
      ctx.rotate(Math.sin(t * 2.2) * 0.04);
      ctx.fillStyle = "#5c3f24";
      ctx.beginPath();
      ctx.moveTo(-130, 0);
      ctx.quadraticCurveTo(0, 40, 140, 0);
      ctx.lineTo(118, 22);
      ctx.lineTo(-108, 22);
      ctx.closePath();
      ctx.fill();
      // Mast & Sail
      ctx.strokeStyle = "#d4a959";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -108);
      ctx.stroke();
      ctx.fillStyle = "rgba(235, 204, 146, 0.82)";
      ctx.beginPath();
      ctx.moveTo(-4, -98);
      ctx.quadraticCurveTo(55, -58, -4, -18);
      ctx.closePath();
      ctx.fill();
      drawLyreFigure(ctx, -40, 2, 1.05, true, false, t, "#d4a959");
      ctx.restore();

      // Waves foreground
      ctx.fillStyle = "rgba(32, 65, 96, 0.72)";
      ctx.beginPath();
      ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 24) {
        ctx.lineTo(x, 286 + Math.sin(x * 0.02 + t * 3.1) * 8);
      }
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fill();
    } else if (act.biome === "grove") {
      ctx.fillStyle = "#18261b";
      ctx.fillRect(0, 310, W, H - 310);
      // Cypress trees
      [110, 175, 760, 830].forEach((tx, idx) => {
        const sway = Math.sin(t * 1.5 + idx) * 5;
        ctx.fillStyle = "#203425";
        ctx.beginPath();
        ctx.moveTo(tx - 18, 315);
        ctx.lineTo(tx + sway, 130 + idx * 8);
        ctx.lineTo(tx + 18, 315);
        ctx.closePath();
        ctx.fill();
      });
      // Orbiting birds (Simonides PMG 567)
      ctx.strokeStyle = "#ebcc92";
      ctx.lineWidth = 2;
      for (let b = 0; b < 6; b += 1) {
        const bx = 320 + Math.cos(t * 1.6 + b) * 140;
        const by = 145 + Math.sin(t * 3.2 + b * 1.2) * 26;
        ctx.beginPath();
        ctx.moveTo(bx - 10, by);
        ctx.quadraticCurveTo(bx - 4, by - 7, bx, by);
        ctx.quadraticCurveTo(bx + 4, by - 7, bx + 10, by);
        ctx.stroke();
      }
      // Leaping fish
      for (let f = 0; f < 3; f += 1) {
        const arc = Math.abs(Math.sin(t * 2.1 + f * 1.4));
        const fx = 520 + f * 75;
        const fy = 335 - arc * 56;
        ctx.fillStyle = "#95b9db";
        ctx.beginPath();
        ctx.ellipse(fx, fy, 11, 5, -0.4, 0, Math.PI * 2);
        ctx.fill();
      }
      drawLyreFigure(ctx, 320, 312, 1.2, true, false, t, "#d4a959");
    } else if (act.biome === "meadow") {
      ctx.fillStyle = "#2b2012";
      ctx.fillRect(0, 305, W, H - 305);
      // Swaying golden reeds
      ctx.strokeStyle = "rgba(212, 169, 89, 0.35)";
      ctx.lineWidth = 1.5;
      for (let gx = 40; gx < W - 40; gx += 18) {
        const lean = Math.sin(t * 2 + gx * 0.05) * 7;
        ctx.beginPath();
        ctx.moveTo(gx, 310);
        ctx.lineTo(gx + lean, 282);
        ctx.stroke();
      }
      drawLyreFigure(ctx, 300, 305, 1.2, true, false, t, "#d4a959");
      const fallOffset = rpgState.beatIdx >= 1 ? 12 : 0;
      drawEurydiceShade(ctx, 410 + fallOffset * 2, 305 + fallOffset, 1.12, rpgState.beatIdx >= 2 ? 0.5 : 0.92, t);
      // Darting crimson viper
      const vx = rpgState.beatIdx === 0 ? 640 - ((t * 110) % 210) : 425;
      ctx.strokeStyle = "#c2574d";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(vx, 308);
      ctx.quadraticCurveTo(vx + 18, 296 + Math.sin(t * 8) * 5, vx + 36, 308);
      ctx.stroke();
    } else if (act.biome === "tartarus") {
      ctx.fillStyle = "#170b0f";
      ctx.fillRect(0, 308, W, H - 308);
      // Ixion's fiery wheel (freezes when beatIdx >= 1!)
      const wheelRot = rpgState.beatIdx >= 1 ? 0.35 : t * 2.8;
      ctx.save();
      ctx.translate(740, 178);
      ctx.rotate(wheelRot);
      ctx.strokeStyle = rpgState.beatIdx >= 1 ? "#ebcc92" : "#c2574d";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 52, 0, Math.PI * 2);
      ctx.stroke();
      for (let sp = 0; sp < 8; sp += 1) {
        const a = (sp * Math.PI) / 4;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * 52, Math.sin(a) * 52);
        ctx.stroke();
      }
      ctx.restore();

      // Cerberus 3-headed silhouette (drops lower on sleep)
      const headDrop = rpgState.beatIdx >= 1 ? 18 : 0;
      ctx.fillStyle = "#3c1c21";
      ctx.beginPath();
      ctx.ellipse(575, 290 + headDrop * 0.4, 42, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      [-16, 0, 16].forEach((ox) => {
        ctx.fillStyle = "#4d232a";
        ctx.beginPath();
        ctx.arc(542 + ox, 268 + headDrop, 10, 0, Math.PI * 2);
        ctx.fill();
        if (rpgState.beatIdx === 0) {
          ctx.fillStyle = "#e05b4f";
          ctx.fillRect(538 + ox, 265, 3, 3);
        }
      });
      drawLyreFigure(ctx, 270, 308, 1.2, true, false, t, "#d4a959");
    } else if (act.biome === "throne") {
      ctx.fillStyle = "#17111e";
      ctx.fillRect(0, 315, W, H - 315);
      // Temple basalt columns
      ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
      [85, 210, 720, 845].forEach((cx) => ctx.fillRect(cx, 65, 24, 250));
      // Twin Thrones on right
      ctx.fillStyle = "#2d2219";
      ctx.fillRect(580, 195, 115, 120);
      ctx.fillStyle = "#d4a959";
      ctx.beginPath();
      ctx.arc(615, 182, 11, 0, Math.PI * 2);
      ctx.arc(662, 186, 10, 0, Math.PI * 2);
      ctx.fill();
      drawLyreFigure(ctx, 260, 315, 1.22, true, false, t, "#d4a959");
      const shadeAlpha = rpgState.beatIdx >= 1 ? 0.85 : 0.35;
      drawEurydiceShade(ctx, 500, 315, 1.08, shadeAlpha, t);
    } else if (act.biome === "ascent") {
      // Daylight sunbeam pouring down from cave mouth at top-right (840, 80)
      const beam = ctx.createLinearGradient(860, 70, 220, 370);
      beam.addColorStop(0, "rgba(255, 236, 179, 0.65)");
      beam.addColorStop(0.5, "rgba(212, 169, 89, 0.16)");
      beam.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.moveTo(760, 60);
      ctx.lineTo(W, 60);
      ctx.lineTo(W, 180);
      ctx.lineTo(180, H);
      ctx.lineTo(60, 330);
      ctx.closePath();
      ctx.fill();

      // Diagonal cavern floor
      ctx.fillStyle = "#191511";
      ctx.beginPath();
      ctx.moveTo(0, H);
      ctx.lineTo(0, 365);
      ctx.lineTo(790, 145);
      ctx.lineTo(W, 145);
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fill();

      // 12 step notches along ramp
      for (let step = 1; step <= 12; step += 1) {
        const p = (step - 1) / 11;
        const nx = 140 + p * 610;
        const ny = 335 - p * 185;
        ctx.fillStyle = step <= rpgState.ascentStep ? "#d4a959" : "rgba(255, 255, 255, 0.2)";
        ctx.fillRect(nx - 3, ny + 4, 6, 6);
      }

      const prog = clamp((rpgState.ascentStep - 1) / 11, 0, 1);
      const ox = 160 + prog * 580;
      const oy = 328 - prog * 182;
      const docNow = effectiveDoctrine();
      const lookedBack = docNow === "canonical_tragic" && rpgState.beatIdx >= 2;
      const dualGaze = docNow === "consensual_memory" && rpgState.beatIdx >= 2;

      // Pothos tension ring around Orpheus
      ctx.strokeStyle = st.pothos >= 90 ? "rgba(194, 87, 77, 0.78)" : "rgba(212, 169, 89, 0.45)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ox, oy - 26, 22 + (st.pothos / 100) * 20 + Math.sin(t * 5) * 3, 0, Math.PI * 2);
      ctx.stroke();

      drawLyreFigure(ctx, ox, oy, 1.08, !(lookedBack || dualGaze), lookedBack || dualGaze, t, "#d4a959");

      const ex = ox - 74 - (lookedBack ? 40 : 0);
      const ey = oy + 24 + (lookedBack ? 28 : 0);
      const eAlpha = lookedBack ? 0.28 : 0.9;
      drawEurydiceShade(ctx, ex, ey, 1.0, eAlpha, t);
      if (lookedBack) {
        ctx.fillStyle = "#f2aba4";
        ctx.font = 'italic 16px Georgia, serif';
        ctx.fillText('"Vale..."', ex - 22, ey - 65);
      }
    } else if (act.biome === "lyra") {
      // Shimmering Hebrus river
      ctx.fillStyle = "rgba(42, 72, 108, 0.65)";
      ctx.beginPath();
      ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 24) {
        ctx.lineTo(x, 315 + Math.sin(x * 0.025 + t * 2.5) * 6);
      }
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fill();

      // Constellation Lyra stars top center-right
      const lyraPts = [[470, 105], [515, 86], [560, 112], [538, 164], [488, 158]];
      ctx.strokeStyle = "rgba(235, 204, 146, 0.78)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      lyraPts.forEach(([px, py], idx) => (idx === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)));
      ctx.closePath();
      ctx.stroke();
      lyraPts.forEach(([px, py]) => {
        ctx.fillStyle = "#fff1cf";
        ctx.beginPath();
        ctx.arc(px, py, 4.5 + Math.sin(t * 4) * 1.1, 0, Math.PI * 2);
        ctx.fill();
      });
      drawLyreFigure(ctx, 290 + Math.sin(t) * 18, 292, 1.15, true, false, t, "#ebcc92");
    }

    // Expanding sound rings
    for (let r = rpgState.rings.length - 1; r >= 0; r -= 1) {
      const ring = rpgState.rings[r];
      ring.r += 3.6;
      ring.alpha *= 0.968;
      if (ring.alpha <= 0.03 || ring.r > ring.maxR) {
        rpgState.rings.splice(r, 1);
        continue;
      }
      ctx.save();
      ctx.globalAlpha = ring.alpha;
      ctx.strokeStyle = ring.color;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Floating combat / charm text
    for (let f = rpgState.floaters.length - 1; f >= 0; f -= 1) {
      const fl = rpgState.floaters[f];
      fl.y -= 0.7;
      fl.life -= 0.012;
      if (fl.life <= 0) {
        rpgState.floaters.splice(f, 1);
        continue;
      }
      ctx.save();
      ctx.globalAlpha = clamp(fl.life, 0, 1);
      ctx.fillStyle = fl.color;
      ctx.font = '700 14px "Inter", sans-serif';
      ctx.fillText(fl.text, fl.x, fl.y);
      ctx.restore();
    }

    // Golden frame & top HUD bar inside canvas
    ctx.strokeStyle = "rgba(212, 169, 89, 0.35)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(10, 10, W - 20, H - 20);

    ctx.fillStyle = "rgba(12, 10, 8, 0.78)";
    ctx.fillRect(18, 18, W - 36, 40);
    ctx.fillStyle = "#ebcc92";
    ctx.font = '700 15px "Cinzel", Georgia, serif';
    ctx.fillText(`ACT ${act.roman} · ${act.title.toUpperCase()}`, 32, 43);

    const statusTag = rpgState.actIdx === 5
      ? `STEP ${rpgState.ascentStep}/12 · POTHOS ${st.pothos}%`
      : `DOCTRINE: ${rpgState.mode.toUpperCase()}`;
    ctx.fillStyle = "#d4a959";
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.fillText(statusTag, W - 290, 43);

    // Subterranean bottom caption strip
    ctx.fillStyle = "rgba(12, 10, 8, 0.82)";
    ctx.fillRect(18, H - 56, W - 36, 38);
    ctx.fillStyle = "#efe8da";
    ctx.font = '13px "Inter", sans-serif';
    const caption = (act.events && act.events[rpgState.beatIdx]) || act.encounter;
    ctx.fillText(caption.slice(0, 108), 32, H - 32);
  }

  function startAnimationLoop() {
    if (rpgState.rafId || typeof global.requestAnimationFrame !== "function") return;
    const loop = () => {
      if (rpgState.activeTabVisible) {
        renderCanvasFrame();
      }
      rpgState.rafId = global.requestAnimationFrame(loop);
    };
    rpgState.rafId = global.requestAnimationFrame(loop);
  }

  function init(opts) {
    if (opts && typeof opts.liveApiGetter === "function") {
      rpgState.liveApiGetter = opts.liveApiGetter;
    }
    const doc = global.document;
    if (rpgState.initialized) return;
    rpgState.initialized = true;

    const first = rpgState.campaign.acts[0];
    pushLog(first, (first.events && first.events[0]) || first.encounter, "normal");

    if (doc) {
      const modeSel = doc.getElementById("rpg-doctrine-select");
      if (modeSel) {
        modeSel.addEventListener("change", () => {
          rpgState.mode = modeSel.value || "canonical_tragic";
          restartCampaign(true);
          refreshCampaign(effectiveDoctrine());
        });
      }

      const playBtn = doc.getElementById("rpg-play-btn");
      if (playBtn) {
        playBtn.addEventListener("click", () => {
          if (rpgState.manualChoicePending) return;
          rpgState.playing = !rpgState.playing;
          renderHUD();
          scheduleTick();
        });
      }

      const stepBtn = doc.getElementById("rpg-step-btn");
      if (stepBtn) {
        stepBtn.addEventListener("click", () => {
          rpgState.playing = false;
          stepForward();
        });
      }

      const restartBtn = doc.getElementById("rpg-restart-btn");
      if (restartBtn) {
        restartBtn.addEventListener("click", () => restartCampaign(true));
      }

      const speedSel = doc.getElementById("rpg-speed-select");
      if (speedSel) {
        speedSel.addEventListener("change", () => {
          rpgState.speed = parseFloat(speedSel.value) || 1;
          scheduleTick();
        });
      }

      const loopChk = doc.getElementById("rpg-loop-checkbox");
      if (loopChk) {
        loopChk.addEventListener("change", () => {
          rpgState.autoLoop = Boolean(loopChk.checked);
        });
      }

      const audioBtn = doc.getElementById("rpg-audio-btn");
      if (audioBtn) {
        audioBtn.addEventListener("click", () => {
          rpgState.audioEnabled = !rpgState.audioEnabled;
          if (rpgState.audioEnabled) playKitharaChord("dorian");
          renderHUD();
        });
      }

      const faithfulBtn = doc.getElementById("rpg-choice-faithful");
      if (faithfulBtn) faithfulBtn.addEventListener("click", () => resolveThresholdChoice("faithful"));
      const lookBackBtn = doc.getElementById("rpg-choice-lookback");
      if (lookBackBtn) lookBackBtn.addEventListener("click", () => resolveThresholdChoice("look_back"));

      doc.querySelectorAll("[data-rpg-hymn]").forEach((btn) => {
        btn.addEventListener("click", () => castInteractiveHymn(btn.dataset.rpgHymn));
      });
    }

    renderHUD();
    renderCanvasFrame();
    startAnimationLoop();
  }

  function onTabActivated() {
    rpgState.activeTabVisible = true;
    renderCanvasFrame();
    if (!rpgState.playing && !rpgState.manualChoicePending) {
      rpgState.playing = true;
      renderHUD();
      scheduleTick();
    }
  }

  function onTabHidden() {
    rpgState.activeTabVisible = false;
    if (rpgState.playing) {
      rpgState.playing = false;
      if (rpgState.timerId) {
        clearTimeout(rpgState.timerId);
        rpgState.timerId = null;
      }
      renderHUD();
    }
  }

  global.OrpheusRPG = {
    init,
    onTabActivated,
    onTabHidden,
    stepForward,
    restartCampaign,
    resolveThresholdChoice,
    castInteractiveHymn,
    buildLocalCampaign,
    getState: () => rpgState
  };
})(typeof window !== "undefined" ? window : globalThis);
