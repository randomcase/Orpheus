package rpg_test

import (
	"testing"

	"github.com/randomcase/orpheus/go-engine/internal/rpg"
)

func TestRunCampaignAllDoctrines(t *testing.T) {
	cases := []struct {
		doctrine    string
		wantOutcome string
		wantPothos  int
	}{
		{rpg.DoctrineCanonicalTragic, "RELAPSA_INTO_AVERNO", 100},
		{rpg.DoctrineArchaicRedemp, "REUNITED_IN_SUNLIGHT", 62},
		{rpg.DoctrineConsensualMemory, "ETERNAL_RESONANCE", 84},
	}

	for _, tc := range cases {
		t.Run(tc.doctrine, func(t *testing.T) {
			res := rpg.RunCampaign(tc.doctrine)
			if len(res.Acts) != 7 {
				t.Fatalf("expected 7 acts, got %d", len(res.Acts))
			}
			if res.FinalOutcome != tc.wantOutcome {
				t.Fatalf("FinalOutcome = %q, want %q", res.FinalOutcome, tc.wantOutcome)
			}
			if res.FinalStats.Level != 7 {
				t.Fatalf("expected final level 7, got %d", res.FinalStats.Level)
			}
			if len(res.FinalStats.Relics) != 7 {
				t.Fatalf("expected 7 relics unlocked, got %d", len(res.FinalStats.Relics))
			}
			if res.Acts[5].StatsAfter.Pothos != tc.wantPothos {
				t.Fatalf("Act VI Pothos = %d, want %d", res.Acts[5].StatsAfter.Pothos, tc.wantPothos)
			}
		})
	}
}

func BenchmarkRunCampaign(b *testing.B) {
	for b.Loop() {
		_ = rpg.RunCampaign(rpg.DoctrineCanonicalTragic)
	}
}
