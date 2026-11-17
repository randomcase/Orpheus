// Package lineage models the 104-generation transmission graph (565 BCE-2026 CE)
// as a dual-atom DAG combining tri-state mytheme vectors with physical carrier pathways
// and counterfactual severance simulation.
package lineage

import (
	"fmt"
	"sort"
	"strings"
)

// MythemeKeys defines the canonical 8 mythemes tracked across all 104 generations.
var MythemeKeys = []string{
	"threshold_voice",
	"argonaut_voyage",
	"mystery_passport",
	"katabasis_descent",
	"named_eurydice",
	"taboo_c331_glance",
	"sparagmos_head_oracle",
	"redemptive_return",
}

// CarrierInfo captures the physical medium and institutional bottleneck of a generational link.
type CarrierInfo struct {
	Substrate       string `json:"substrate"`
	LanguageGate    string `json:"language_gate"`
	RedundancyTier  string `json:"redundancy_tier"`
	HostInstitution string `json:"host_institution"`
	LostSiblings    string `json:"lost_siblings"`
}

// GenerationNode represents one 25-year link (G-001..G-104) in the Orpheus relay.
type GenerationNode struct {
	ID                 string         `json:"id"`
	GenNumber          int            `json:"gen_number"`
	YearStart          int            `json:"year_start"`
	YearEnd            int            `json:"year_end"`
	DisplaySpan        string         `json:"display_span"`
	Era                string         `json:"era"`
	Role               string         `json:"role"`
	PrimaryStream      string         `json:"primary_stream"`
	UpstreamIDs        []string       `json:"upstream_ids"`
	CapsuleUpstreamIDs []string       `json:"capsule_upstream_ids"`
	IsCapsuleOrigin    bool           `json:"is_capsule_origin"`
	CapsuleArtifact    string         `json:"capsule_artifact,omitempty"`
	MilestoneIDs       []string       `json:"milestone_ids"`
	CustodianOrWitness string         `json:"custodian_or_witness"`
	IntroducedMythemes []string       `json:"introduced_mythemes"`
	Mythemes           map[string]int `json:"mythemes"`
	Carrier            CarrierInfo    `json:"carrier"`
	TransmissionNote   string         `json:"transmission_note"`
}

// SeveranceRequest specifies links or streams to cut in a counterfactual survival run.
type SeveranceRequest struct {
	SeveredIDs          []string `json:"severed_ids"`
	SeveredStreams      []string `json:"severed_streams"`
	DisableTimeCapsules bool     `json:"disable_time_capsules"`
}

// SeveranceResult reports what survives to Person #104 (2026 CE) after counterfactual severance.
type SeveranceResult struct {
	StorySurvivesTo2026 bool     `json:"story_survives_to_2026"`
	CapsuleResurrected  bool     `json:"capsule_resurrected"`
	AliveCount          int      `json:"alive_count"`
	DarkCount           int      `json:"dark_count"`
	AliveIDs            []string `json:"alive_ids"`
	DarkIDs             []string `json:"dark_ids"`
	SeveredApplied      []string `json:"severed_applied"`
	SurvivingMythemes   []string `json:"surviving_mythemes"`
	ExtinctMythemes     []string `json:"extinct_mythemes"`
	SurvivingMilestones []string `json:"surviving_milestones"`
	LostMilestones      []string `json:"lost_milestones"`
	Diagnosis           string   `json:"diagnosis"`
}

// Validate checks structural, DAG ordering, and tri-state mytheme invariants across 104 links.
func Validate(nodes []GenerationNode) error {
	if len(nodes) != 104 {
		return fmt.Errorf("lineage requires exactly 104 generations, got %d", len(nodes))
	}
	indexByID := make(map[string]GenerationNode, 104)
	for i, n := range nodes {
		expectedID := fmt.Sprintf("G-%03d", i+1)
		if n.ID != expectedID || n.GenNumber != i+1 {
			return fmt.Errorf("expected %s at index %d, got %s (gen %d)", expectedID, i, n.ID, n.GenNumber)
		}
		if n.YearStart > n.YearEnd {
			return fmt.Errorf("%s has invalid span %d..%d", n.ID, n.YearStart, n.YearEnd)
		}
		if n.Mythemes["threshold_voice"] != 1 {
			return fmt.Errorf("%s invariant violated: threshold_voice must equal 1", n.ID)
		}
		for _, k := range MythemeKeys {
			v, ok := n.Mythemes[k]
			if !ok || v < -1 || v > 1 {
				return fmt.Errorf("%s mytheme %q has invalid polarity %d", n.ID, k, v)
			}
		}
		indexByID[n.ID] = n
	}
	for _, n := range nodes {
		for _, up := range append(append([]string{}, n.UpstreamIDs...), n.CapsuleUpstreamIDs...) {
			parent, ok := indexByID[up]
			if !ok {
				return fmt.Errorf("%s references unknown upstream %q", n.ID, up)
			}
			if parent.GenNumber >= n.GenNumber {
				return fmt.Errorf("cycle/forward dependency detected: %s -> %s", up, n.ID)
			}
		}
	}
	return nil
}

// SimulateSeverance computes counterfactual DAG reachability and mytheme survival to 2026 CE.
func SimulateSeverance(nodes []GenerationNode, req SeveranceRequest) SeveranceResult {
	ordered := make([]GenerationNode, len(nodes))
	copy(ordered, nodes)
	sort.Slice(ordered, func(i, j int) bool { return ordered[i].GenNumber < ordered[j].GenNumber })

	severedIDs := make(map[string]bool, len(req.SeveredIDs))
	for _, id := range req.SeveredIDs {
		clean := strings.ToUpper(strings.TrimSpace(id))
		if clean != "" {
			severedIDs[clean] = true
		}
	}
	severedStreams := make(map[string]bool, len(req.SeveredStreams))
	for _, st := range req.SeveredStreams {
		clean := strings.TrimSpace(st)
		if clean != "" {
			severedStreams[clean] = true
		}
	}

	alive := make(map[string]bool, len(ordered))
	livingOnlyAlive := make(map[string]bool, len(ordered))
	ancestors := make(map[string]map[string]bool, len(ordered))

	aliveIDs := make([]string, 0, len(ordered))
	darkIDs := make([]string, 0)
	severedApplied := make([]string, 0)

	for _, n := range ordered {
		if severedIDs[n.ID] {
			severedApplied = append(severedApplied, n.ID)
		}
		blocked := severedIDs[n.ID] || severedStreams[n.PrimaryStream]
		if blocked {
			darkIDs = append(darkIDs, n.ID)
			continue
		}

		isLivingReachable := n.GenNumber == 1
		if !isLivingReachable {
			for _, up := range n.UpstreamIDs {
				if livingOnlyAlive[up] {
					isLivingReachable = true
					break
				}
			}
		}
		livingOnlyAlive[n.ID] = isLivingReachable

		activeParents := make([]string, 0, len(n.UpstreamIDs)+len(n.CapsuleUpstreamIDs))
		for _, up := range n.UpstreamIDs {
			if alive[up] {
				activeParents = append(activeParents, up)
			}
		}
		if !req.DisableTimeCapsules {
			for _, cup := range n.CapsuleUpstreamIDs {
				if alive[cup] {
					activeParents = append(activeParents, cup)
				}
			}
		}

		if n.GenNumber != 1 && len(activeParents) == 0 {
			darkIDs = append(darkIDs, n.ID)
			continue
		}

		alive[n.ID] = true
		aliveIDs = append(aliveIDs, n.ID)
		anc := map[string]bool{n.ID: true}
		for _, p := range activeParents {
			for a := range ancestors[p] {
				anc[a] = true
			}
		}
		ancestors[n.ID] = anc
	}

	targetID := "G-104"
	if len(ordered) > 0 {
		targetID = ordered[len(ordered)-1].ID
	}
	survives2026 := alive[targetID]
	capsuleResurrected := survives2026 && !livingOnlyAlive[targetID]

	survivingMythemeSet := make(map[string]bool, len(MythemeKeys))
	survivingMilestoneSet := make(map[string]bool)
	allMilestones := make([]string, 0)

	for _, n := range ordered {
		allMilestones = append(allMilestones, n.MilestoneIDs...)
		if survives2026 && ancestors[targetID][n.ID] {
			for _, m := range n.IntroducedMythemes {
				survivingMythemeSet[m] = true
			}
			for _, ms := range n.MilestoneIDs {
				survivingMilestoneSet[ms] = true
			}
		}
	}

	survivingMythemes := make([]string, 0, len(MythemeKeys))
	extinctMythemes := make([]string, 0, len(MythemeKeys))
	for _, k := range MythemeKeys {
		if survivingMythemeSet[k] {
			survivingMythemes = append(survivingMythemes, k)
		} else {
			extinctMythemes = append(extinctMythemes, k)
		}
	}

	survivingMilestones := make([]string, 0, len(allMilestones))
	lostMilestones := make([]string, 0)
	for _, ms := range allMilestones {
		if survivingMilestoneSet[ms] {
			survivingMilestones = append(survivingMilestones, ms)
		} else {
			lostMilestones = append(lostMilestones, ms)
		}
	}

	var diagnosis string
	switch {
	case !survives2026:
		diagnosis = "Total extinction: Orpheus's chain breaks completely before reaching Person #104 (2026 CE) because both living conduits and time-capsule recoveries were severed."
	case capsuleResurrected:
		lostLabel := "none"
		if len(extinctMythemes) > 0 {
			lostLabel = strings.Join(extinctMythemes, ", ")
		}
		diagnosis = fmt.Sprintf(
			"Archaeological resurrection: living manuscript links went dark across %d generations, yet buried 565–340 BCE time capsules bypassed ~90 people to deliver %d/8 mythemes to Person #104 (extinct: %s).",
			len(darkIDs), len(survivingMythemes), lostLabel,
		)
	case len(extinctMythemes) > 0:
		diagnosis = fmt.Sprintf(
			"Partial divergence reaching 2026 CE: alternate branches kept %d/8 mythemes alive (%d generations dark), while severing this branch extinguished %s.",
			len(survivingMythemes), len(darkIDs), strings.Join(extinctMythemes, ", "),
		)
	case len(darkIDs) > 0:
		diagnosis = fmt.Sprintf(
			"Redundant survival to 2026 CE: %d links went dark, yet parallel transmission preserved all 8 mythemes for Person #104.",
			len(darkIDs),
		)
	default:
		diagnosis = fmt.Sprintf(
			"Unbroken 104-generation transmission (565 BCE–2026 CE): all 8 mythemes and all %d historical milestones reach Person #104.",
			len(survivingMilestones),
		)
	}

	return SeveranceResult{
		StorySurvivesTo2026: survives2026,
		CapsuleResurrected:  capsuleResurrected,
		AliveCount:          len(aliveIDs),
		DarkCount:           len(darkIDs),
		AliveIDs:            aliveIDs,
		DarkIDs:             darkIDs,
		SeveredApplied:      severedApplied,
		SurvivingMythemes:   survivingMythemes,
		ExtinctMythemes:     extinctMythemes,
		SurvivingMilestones: survivingMilestones,
		LostMilestones:      lostMilestones,
		Diagnosis:           diagnosis,
	}
}
