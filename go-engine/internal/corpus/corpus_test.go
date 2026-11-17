package corpus

import (
	"path/filepath"
	"testing"
)

func TestLoadAndValidateCorpus(t *testing.T) {
	dataDir := filepath.Join("..", "..", "..", "data")
	bundle, err := Load(dataDir)
	if err != nil {
		t.Fatalf("Load(%q) failed: %v", dataDir, err)
	}
	if bundle.Analytics.EarliestYear > -500 {
		t.Fatalf("expected archaic earliest year <= -500, got %d", bundle.Analytics.EarliestYear)
	}
	if bundle.Analytics.LatestYear != 2026 {
		t.Fatalf("expected latest year 2026, got %d", bundle.Analytics.LatestYear)
	}
	if bundle.Analytics.SpanYears < 2500 {
		t.Fatalf("expected span >= 2500 years, got %d", bundle.Analytics.SpanYears)
	}
	for _, tr := range bundle.Transliterations {
		if tr.ScriptType == "polytonic_greek" && tr.Systems.ISO843 == "" {
			t.Fatalf("missing ISO843 enrichment for %s", tr.ID)
		}
		if tr.ScriptType == "latin" && tr.Systems.EcclesiasticalLatin == "" {
			t.Fatalf("missing EcclesiasticalLatin enrichment for %s", tr.ID)
		}
	}
}
