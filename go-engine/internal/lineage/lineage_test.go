package lineage_test

import (
	"encoding/json"
	"os"
	"path/filepath"
	"slices"
	"testing"

	"github.com/randomcase/orpheus/go-engine/internal/lineage"
)

func loadTestLineage(t *testing.T) []lineage.GenerationNode {
	t.Helper()
	path := filepath.Join("..", "..", "..", "data", "06_generational_lineage_104.json")
	raw, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("read %s: %v", path, err)
	}
	var nodes []lineage.GenerationNode
	if err := json.Unmarshal(raw, &nodes); err != nil {
		t.Fatalf("unmarshal lineage: %v", err)
	}
	if err := lineage.Validate(nodes); err != nil {
		t.Fatalf("validate lineage: %v", err)
	}
	return nodes
}

func TestValidateAndIntactLineage(t *testing.T) {
	nodes := loadTestLineage(t)
	res := lineage.SimulateSeverance(nodes, lineage.SeveranceRequest{})
	if !res.StorySurvivesTo2026 {
		t.Fatal("expected intact chain to survive to 2026")
	}
	if res.CapsuleResurrected {
		t.Fatal("intact chain should not be flagged capsule-resurrected")
	}
	if res.AliveCount != 104 || res.DarkCount != 0 {
		t.Fatalf("expected 104 alive / 0 dark, got %d alive / %d dark", res.AliveCount, res.DarkCount)
	}
	if len(res.ExtinctMythemes) != 0 {
		t.Fatalf("expected 0 extinct mythemes, got %v", res.ExtinctMythemes)
	}
	if len(res.SurvivingMilestones) != 37 {
		t.Fatalf("expected 37 surviving milestones, got %d", len(res.SurvivingMilestones))
	}
}

func TestSeverVirgilG022ExtinguishesTabooC331Only(t *testing.T) {
	nodes := loadTestLineage(t)
	res := lineage.SimulateSeverance(nodes, lineage.SeveranceRequest{
		SeveredIDs: []string{"G-022"},
	})
	if !res.StorySurvivesTo2026 {
		t.Fatal("expected Greek-Byzantine + Time Capsules to reach 2026 after severing Virgil")
	}
	if !slices.Contains(res.ExtinctMythemes, "taboo_c331_glance") {
		t.Fatalf("expected taboo_c331_glance in ExtinctMythemes, got %v", res.ExtinctMythemes)
	}
	if !slices.Contains(res.SurvivingMythemes, "threshold_voice") || !slices.Contains(res.SurvivingMythemes, "named_eurydice") {
		t.Fatalf("expected threshold_voice and named_eurydice to survive via Greek branch, got %v", res.SurvivingMythemes)
	}
}

func TestSeverLatinMonasticStream(t *testing.T) {
	nodes := loadTestLineage(t)
	res := lineage.SimulateSeverance(nodes, lineage.SeveranceRequest{
		SeveredStreams: []string{"latin_monastic"},
	})
	if !res.StorySurvivesTo2026 {
		t.Fatal("expected Greek-Byzantine conduit to survive when latin_monastic is severed")
	}
	if !slices.Contains(res.ExtinctMythemes, "taboo_c331_glance") {
		t.Fatalf("expected taboo_c331_glance extinct when Latin stream is severed, got %v", res.ExtinctMythemes)
	}
	if len(res.SurvivingMythemes) != 7 {
		t.Fatalf("expected 7 surviving mythemes via Archaic/Greek branch, got %d (%v)", len(res.SurvivingMythemes), res.SurvivingMythemes)
	}
}

func TestSeverG021ResurrectedByTimeCapsules(t *testing.T) {
	nodes := loadTestLineage(t)
	res := lineage.SimulateSeverance(nodes, lineage.SeveranceRequest{
		SeveredIDs:          []string{"G-021"},
		DisableTimeCapsules: false,
	})
	if !res.StorySurvivesTo2026 {
		t.Fatal("expected 1894-1985 time capsules to rescue Archaic Orpheus to 2026")
	}
	if !res.CapsuleResurrected {
		t.Fatal("expected CapsuleResurrected == true when G-021 is severed with capsules enabled")
	}
	if !slices.Contains(res.ExtinctMythemes, "named_eurydice") || !slices.Contains(res.ExtinctMythemes, "taboo_c331_glance") {
		t.Fatalf("expected named_eurydice & taboo_c331_glance extinct when only pre-340 BCE capsules survive, got %v", res.ExtinctMythemes)
	}
}

func TestSeverG021WithoutCapsulesCausesTotalExtinction(t *testing.T) {
	nodes := loadTestLineage(t)
	res := lineage.SimulateSeverance(nodes, lineage.SeveranceRequest{
		SeveredIDs:          []string{"G-021"},
		DisableTimeCapsules: true,
	})
	if res.StorySurvivesTo2026 {
		t.Fatal("expected total extinction when G-021 is severed and time capsules are disabled")
	}
	if len(res.SurvivingMythemes) != 0 || len(res.ExtinctMythemes) != 8 {
		t.Fatalf("expected all 8 mythemes extinct, got surviving=%v extinct=%v", res.SurvivingMythemes, res.ExtinctMythemes)
	}
}

func BenchmarkSimulateSeverance(b *testing.B) {
	path := filepath.Join("..", "..", "..", "data", "06_generational_lineage_104.json")
	raw, err := os.ReadFile(path)
	if err != nil {
		b.Fatalf("read lineage: %v", err)
	}
	var nodes []lineage.GenerationNode
	if err := json.Unmarshal(raw, &nodes); err != nil {
		b.Fatalf("unmarshal lineage: %v", err)
	}
	req := lineage.SeveranceRequest{SeveredIDs: []string{"G-022"}}
	for b.Loop() {
		_ = lineage.SimulateSeverance(nodes, req)
	}
}
