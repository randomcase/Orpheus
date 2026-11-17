// Package report generates structured JSON and Markdown telemetry summaries
// for the Orpheus diachronic corpus and Go transliteration engine.
package report

import (
	"fmt"
	"sort"
	"strings"
	"time"

	"github.com/randomcase/orpheus/go-engine/internal/corpus"
	"github.com/randomcase/orpheus/go-engine/internal/katabasis"
)

type TelemetryReport struct {
	GeneratedAt string           `json:"generated_at"`
	Analytics   corpus.Analytics `json:"analytics"`
	SampleRun   katabasis.SimulationResult `json:"katabasis_sample"`
}

func Build(b *corpus.Bundle) TelemetryReport {
	return TelemetryReport{
		GeneratedAt: time.Now().UTC().Format(time.RFC3339),
		Analytics:   b.Analytics,
		SampleRun:   katabasis.RunSimulation(12, 11),
	}
}

func RenderMarkdown(r TelemetryReport) string {
	var sb strings.Builder
	sb.WriteString("# Orpheus Go Engine Telemetry Report\n\n")
	sb.WriteString(fmt.Sprintf("- **Generated (UTC):** %s\n", r.GeneratedAt))
	sb.WriteString(fmt.Sprintf("- **Diachronic Span:** %d BCE to %d CE (%d years)\n", -r.Analytics.EarliestYear, r.Analytics.LatestYear, r.Analytics.SpanYears))
	sb.WriteString(fmt.Sprintf("- **Katabasis Reference Run:** `%s` (%s)\n\n", r.SampleRun.Outcome, r.SampleRun.Hamartia))

	sb.WriteString("## Corpus Counts\n\n")
	sb.WriteString("| Dataset | Records |\n| :--- | ---: |\n")
	sb.WriteString(fmt.Sprintf("| Timeline Milestones | %d |\n", r.Analytics.TimelineCount))
	sb.WriteString(fmt.Sprintf("| Primary Passages (Transliterated) | %d |\n", r.Analytics.TransliterationCount))
	sb.WriteString(fmt.Sprintf("| Liturgical & Catholic Narratives | %d |\n", r.Analytics.LiturgicalCount))
	sb.WriteString(fmt.Sprintf("| Anthropology (Motif C331) | %d |\n", r.Analytics.AnthropologyCount))
	sb.WriteString(fmt.Sprintf("| Societal Revivals (1480–2026) | %d |\n\n", r.Analytics.RevivalCount))

	eras := make([]string, 0, len(r.Analytics.EraCounts))
	for k := range r.Analytics.EraCounts {
		eras = append(eras, k)
	}
	sort.Strings(eras)
	sb.WriteString("## Era Breakdown\n\n| Era | Entries |\n| :--- | ---: |\n")
	for _, era := range eras {
		sb.WriteString(fmt.Sprintf("| %s | %d |\n", era, r.Analytics.EraCounts[era]))
	}
	return sb.String()
}
