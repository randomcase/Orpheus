package katabasis

import "testing"

func TestRunSimulationRelapseOnLookBack(t *testing.T) {
	res := RunSimulation(12, 11)
	if res.Outcome != OutcomeRelapsed {
		t.Fatalf("Outcome = %q, want %q", res.Outcome, OutcomeRelapsed)
	}
	if res.Hamartia == "" {
		t.Fatal("expected non-empty hamartia message on backward glance")
	}
	if len(res.Events) == 0 {
		t.Fatal("expected non-empty step events")
	}
}

func TestRunSimulationFaithfulAscentReunites(t *testing.T) {
	res := RunSimulation(8, 0)
	if res.Outcome != OutcomeReunited {
		t.Fatalf("Outcome = %q, want %q", res.Outcome, OutcomeReunited)
	}
	if res.Hamartia != "" {
		t.Fatalf("unexpected hamartia on faithful ascent: %q", res.Hamartia)
	}
	if len(res.Events) < 16 {
		t.Fatalf("expected coordinated step events for both actors, got %d", len(res.Events))
	}
}
