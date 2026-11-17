// Package rpg implements a deterministic 7-act automated RPG state machine
// narrating Orpheus's katabasis, music magic, and survival across Antiquity to 2026.
package rpg

import "strings"

const (
	DoctrineCanonicalTragic  = "canonical_tragic"
	DoctrineArchaicRedemp    = "archaic_redemptive"
	DoctrineConsensualMemory = "consensual_memory"
)

// HeroStats tracks Orpheus's progression, resolve, and relics across Acts I-VII.
type HeroStats struct {
	Level     int      `json:"level"`
	XP        int      `json:"xp"`
	PsycheHP  int      `json:"psyche_hp"`
	MelosMana int      `json:"melos_mana"`
	Peitho    int      `json:"peitho"`
	Mnemosyne int      `json:"mnemosyne"`
	Pothos    int      `json:"pothos"`
	Relics    []string `json:"relics"`
}

// ActLog captures one chapter/encounter of the automated Orpheus RPG campaign.
type ActLog struct {
	ActNumber          int       `json:"act_number"`
	Roman              string    `json:"roman"`
	Title              string    `json:"title"`
	EraLabel           string    `json:"era_label"`
	Biome              string    `json:"biome"`
	Encounter          string    `json:"encounter"`
	HymnCast           string    `json:"hymn_cast"`
	GreekOrLatinQuote  string    `json:"greek_or_latin_quote"`
	Outcome            string    `json:"outcome"`
	RelicUnlocked      string    `json:"relic_unlocked"`
	StatsAfter         HeroStats `json:"stats_after"`
	Events             []string  `json:"events"`
}

// CampaignResult is the complete VII-act RPG run for a chosen narrative doctrine.
type CampaignResult struct {
	Hero         string    `json:"hero"`
	Class        string    `json:"class"`
	Doctrine     string    `json:"doctrine"`
	FinalOutcome string    `json:"final_outcome"`
	TotalTurns   int       `json:"total_turns"`
	FinalStats   HeroStats `json:"final_stats"`
	Acts         []ActLog  `json:"acts"`
}

func cloneStats(s HeroStats) HeroStats {
	relics := make([]string, len(s.Relics))
	copy(relics, s.Relics)
	s.Relics = relics
	return s
}

func normalizeDoctrine(d string) string {
	switch strings.ToLower(strings.TrimSpace(d)) {
	case DoctrineArchaicRedemp, "redemptive", "euripides", "gluck", "sir_orfeo":
		return DoctrineArchaicRedemp
	case DoctrineConsensualMemory, "sciamma", "consensual", "modern":
		return DoctrineConsensualMemory
	default:
		return DoctrineCanonicalTragic
	}
}

// RunCampaign executes all 7 Acts of Orpheus's automated RPG deterministically.
func RunCampaign(rawDoctrine string) CampaignResult {
	doctrine := normalizeDoctrine(rawDoctrine)
	stats := HeroStats{
		Level:     1,
		XP:        0,
		PsycheHP:  100,
		MelosMana: 100,
		Peitho:    25,
		Mnemosyne: 30,
		Pothos:    10,
		Relics:    []string{},
	}

	acts := make([]ActLog, 0, 7)
	addAct := func(act ActLog) {
		stats.Relics = append(stats.Relics, act.RelicUnlocked)
		act.StatsAfter = cloneStats(stats)
		acts = append(acts, act)
	}

	// Act I: Aboard the Argo
	stats.Level = 1
	stats.XP = 140
	stats.Peitho += 15
	stats.Mnemosyne += 10
	addAct(ActLog{
		ActNumber:         1,
		Roman:             "I",
		Title:             "Aboard the Argo & Clashing Rocks",
		EraLabel:          "c. 565–545 BCE · Delphi Metope & Ibycus",
		Biome:             "argo",
		Encounter:         "Symplegades Clashing Cliffs & Storm-Swollen Aegean",
		HymnCast:          "Dorian Sea-Calm (Nine-String Kithara)",
		GreekOrLatinQuote: "ΟΡΦΑΣ · ὀνομάκλυτον Ὀρφήν (Delphi & Ibycus PMG 306)",
		Outcome:           "VICTORY_HARMONIC_PASSAGE",
		RelicUnlocked:     "Apolline Seven-String Kithara",
		Events: []string{
			"Jason signals the oarsmen as crashing waves threaten the Argo.",
			"Orpheus casts Dorian Sea-Calm (-18 Melos); expanding sound rings hold the Clashing Rocks apart.",
			"+15 Peitho · +10 Mnemosyne · Relic Gained: Apolline Seven-String Kithara.",
		},
	})

	// Act II: Pierian Grove & Olbia Mystery
	stats.Level = 2
	stats.XP = 320
	stats.Peitho += 18
	stats.Mnemosyne += 20
	stats.Pothos += 5
	addAct(ActLog{
		ActNumber:         2,
		Roman:             "II",
		Title:             "Pierian Grove & Olbia Initiations",
		EraLabel:          "c. 505–485 BCE · Simonides & Olbia Tablets",
		Biome:             "grove",
		Encounter:         "Untamed Thracian Beasts, Birds & Olbia Mystery Trial",
		HymnCast:          "Aeolian Nature-Charm",
		GreekOrLatinQuote: "Βίος θάνατος βίος · ἀλήθεια · Διόνυσος Ὀρφικοί",
		Outcome:           "NATURE_AND_SOUL_ATTUNED",
		RelicUnlocked:     "Olbia Bone Plaque (Life-Death-Life)",
		Events: []string{
			"Countless sea-birds hover overhead while fish leap clear above dark water (Simonides PMG 567).",
			"Olbia initiates entrust Orpheus with the triple password of true survival.",
			"Level Up! Lv.2 · +18 Peitho · +20 Mnemosyne · Relic Gained: Olbia Bone Plaque.",
		},
	})

	// Act III: Wedding Meadow & The Viper
	stats.Level = 3
	stats.XP = 510
	stats.PsycheHP = 72
	stats.Pothos += 42
	addAct(ActLog{
		ActNumber:         3,
		Roman:             "III",
		Title:             "Hymenaios Meadow & The Lurking Serpent",
		EraLabel:          "Ovid X.8–10 · Virgil Georgics IV.457",
		Biome:             "meadow",
		Encounter:         "Venomous Viper Strike on Eurydice's Heel",
		HymnCast:          "Phrygian Lament",
		GreekOrLatinQuote: "Occidit in talum serpentis dente recepto",
		Outcome:           "BEREAVEMENT_KATABASIS_SWORN",
		RelicUnlocked:     "Bridal Saffron Veil",
		Events: []string{
			"Hymenaios's wedding torch sputters with acrid smoke as Eurydice steps across tall meadow grass.",
			"Critical Tragedy Hit: Eurydice falls (-28 Psyche HP, +42 Pothos yearning).",
			"Level Up! Lv.3 · Orpheus swears descent through the cavern of Taenarum · Relic Gained: Bridal Saffron Veil.",
		},
	})

	// Act IV: Styx, Cerberus & Ixion's Wheel
	stats.Level = 4
	stats.XP = 760
	stats.Peitho += 22
	stats.MelosMana = 88
	stats.Pothos += 10
	addAct(ActLog{
		ActNumber:         4,
		Roman:             "IV",
		Title:             "Crossing Styx, Cerberus & Tartarus",
		EraLabel:          "c. 400–340 BCE · Hipponion Lamella & Derveni",
		Biome:             "tartarus",
		Encounter:         "Charon, Three-Headed Cerberus & Ixion's Spinning Wheel",
		HymnCast:          "Hymn of Mnemosyne (Forbidden Cypress Bypass)",
		GreekOrLatinQuote: "Γῆς παῖς εἰμι καὶ Οὐρανοῦ ἀστερόεντος",
		Outcome:           "TARTARUS_CHOREOGRAPHY_SUSPENDED",
		RelicUnlocked:     "Hipponion Gold Memory Lamella",
		Events: []string{
			"At the white cypress spring of Lethe, Orpheus recites his starry lineage (+22 Peitho).",
			"All three jaws of Cerberus drop to sleep; Ixion's flaming wheel freezes mid-rotation.",
			"Level Up! Lv.4 · Furies weep for the first time in Tartarus · Relic Gained: Hipponion Gold Memory Lamella.",
		},
	})

	// Act V: Throne of Hades & Persephone
	stats.Level = 5
	stats.XP = 1040
	stats.Peitho = 96
	stats.Mnemosyne = 85
	stats.Pothos += 12
	pactTerms := "Forward-only channel sealed: never look back until both cross into upper air (Motif C331)."
	if doctrine == DoctrineConsensualMemory {
		pactTerms = "Threshold pact granted: silence up the steep crag while mutual gaze awaits the verge of light."
	}
	addAct(ActLog{
		ActNumber:         5,
		Roman:             "V",
		Title:             "Plea Before Hades & Persephone",
		EraLabel:          "Euripides Alcestis 357 · Ovid Met. X.17–49",
		Biome:             "throne",
		Encounter:         "Lords of the Underworld & The Iron Covenant",
		HymnCast:          "Covenant Arioso of Amor & Memory",
		GreekOrLatinQuote: "Vicit Amor; hanc legem accipe, ne flectas retro lumina",
		Outcome:           "CONDITIONAL_PACT_GRANTED",
		RelicUnlocked:     "Pomegranate Seal of Persephone",
		Events: []string{
			"Sisyphus rests upon his stone; Persephone grants Eurydice's shade on one condition.",
			pactTerms,
			"Level Up! Lv.5 · Peitho 96 · Relic Gained: Pomegranate Seal of Persephone.",
		},
	})

	// Act VI: Twelve Steps of Cave Taenarum (Doctrine Diverges Here)
	stats.Level = 6
	stats.XP = 1380
	var act6Quote, act6Outcome, act6Hymn string
	var act6Events []string
	var finalOutcome string

	switch doctrine {
	case DoctrineArchaicRedemp:
		stats.Pothos = 62
		stats.Mnemosyne = 98
		stats.PsycheHP = 95
		act6Hymn = "Archaic Hymn of Blind Trust (Mnemosyne Shield)"
		act6Quote = "εἰ δ᾽ Ὀρφέως μοι γλῶσσα... ἐξ Ἅιδου λαβεῖν (Alcestis 357–362)"
		act6Outcome = "THRESHOLD_CROSSED_TOGETHER"
		finalOutcome = "REUNITED_IN_SUNLIGHT"
		act6Events = []string{
			"Steps 1–10: Orpheus climbs blindly while holding the Hipponion Memory Lamella.",
			"Step 11/12 Critical Check: Pothos reaches 62/100 (< 100 threshold). Eyes remain fixed on sunlight.",
			"Step 12/12: Eurydice crosses the limestone threshold into open daylight — Euripides/Sir Orfeo happy ending!",
		}
	case DoctrineConsensualMemory:
		stats.Pothos = 84
		stats.Mnemosyne = 100
		stats.PsycheHP = 90
		act6Hymn = "Duet of Witness ('Turn Around' / Chosen Memory)"
		act6Quote = "Ne regrette pas. Choisis le souvenir du poète (Sciamma 2019)"
		act6Outcome = "CONSENSUAL_GAZE_FULFILLED"
		finalOutcome = "ETERNAL_RESONANCE"
		act6Events = []string{
			"Steps 1–10: Both climb silently toward the daylight verge.",
			"Step 11/12: Eurydice whispers 'Turn around' — transforming anxiety into mutual, lucid remembrance.",
			"Step 12/12: Loss becomes shared artistic presence echoing into Hadestown & cinema.",
		}
	default:
		stats.Pothos = 100
		stats.Mnemosyne = 78
		stats.PsycheHP = 45
		act6Hymn = "Breathless Ascent (Silence Under Motif C331)"
		act6Quote = "Immemor heu! victusque animi respexit... 'Vale!' (Georgics IV.491)"
		act6Outcome = "RESPEXIT_RELAPSA_INTO_AVERNO"
		finalOutcome = "RELAPSA_INTO_AVERNO"
		act6Events = []string{
			"Steps 1–10: Steep silent ascent through chilling cavern dark; footsteps echo behind.",
			"Step 11/12 Critical Failure: Pothos spikes to 100/100 — Orpheus turns backward at daylight's edge.",
			"Eurydice whispers a faint farewell ('Vale') and dissolves back down the rocky shaft (-27 Psyche HP).",
		}
	}

	addAct(ActLog{
		ActNumber:         6,
		Roman:             "VI",
		Title:             "Twelve Steps of Cave Taenarum",
		EraLabel:          "Motif C331 Crisis · Step 11/12 Divergence",
		Biome:             "ascent",
		Encounter:         "The Daylight Threshold & Backward-Glance Check",
		HymnCast:          act6Hymn,
		GreekOrLatinQuote: act6Quote,
		Outcome:           act6Outcome,
		RelicUnlocked:     "Threshold Mirror Shard",
		Events:            act6Events,
	})

	// Act VII: Hebrus Oracle, Lesbos & Constellation Lyra
	stats.Level = 7
	stats.XP = 1800
	stats.Peitho = 100
	stats.Mnemosyne = 100
	act7Title := "Hebrus Oracle & Constellation Lyra"
	act7Outcome := "IMMORTALIZED_IN_SONG_TO_2026"
	act7Events := []string{
		"Across Thrace, Rome, Christian Catacombs, Florence, Rio & Digital Archives, 104 generations inherit the song.",
		"Apollo silences the dragon on Lesbos and places Orpheus's seven-stringed Lyre among the fixed stars.",
		"Max Level Reached (Lv.7 · Legend of 2,591 Years) · Relic Gained: Starlight Constellation Lyra.",
	}
	if doctrine == DoctrineCanonicalTragic {
		act7Events[0] = "After Thracian Maenads tear him limb from limb, his singing head floats to Lesbos while his shade rejoins Eurydice in Elysium."
	}

	addAct(ActLog{
		ActNumber:         7,
		Roman:             "VII",
		Title:             act7Title,
		EraLabel:          "Lesbos Oracle · Boethius -> 2026 CE",
		Biome:             "lyra",
		Encounter:         "Maenadic Sparagmos, Singing Head & Celestial Katasterismos",
		HymnCast:          "Nova Cantio Harmoniae (Song Without End)",
		GreekOrLatinQuote: "Vos haec fabula respicit (Boethius III.m12 · 524 CE)",
		Outcome:           act7Outcome,
		RelicUnlocked:     "Starlight Constellation Lyra",
		Events:            act7Events,
	})

	totalTurns := 0
	for _, a := range acts {
		totalTurns += len(a.Events)
	}

	return CampaignResult{
		Hero:         "Orpheus of Thrace",
		Class:        "Kitharode & Katabasis Bard",
		Doctrine:     doctrine,
		FinalOutcome: finalOutcome,
		TotalTurns:   totalTurns,
		FinalStats:   cloneStats(stats),
		Acts:         acts,
	}
}
