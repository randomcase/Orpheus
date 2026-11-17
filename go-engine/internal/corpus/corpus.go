// Package corpus loads, validates, enriches, and summarizes the ~600 BCE–2026 CE Orpheus archive.
package corpus

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"

	"github.com/randomcase/orpheus/go-engine/internal/translit"
)

type TimelineEntry struct {
	ID                       string `json:"id"`
	Year                     int    `json:"year"`
	DisplayDate              string `json:"display_date"`
	Era                      string `json:"era"`
	Title                    string `json:"title"`
	CreatorOrSource          string `json:"creator_or_source"`
	Language                 string `json:"language"`
	DiscoveryOrProvenance    string `json:"discovery_or_provenance"`
	KeyShift                 string `json:"key_shift"`
	LiturgicalOrReligious    string `json:"liturgical_or_religious_role"`
	SocietalContext          string `json:"societal_context"`
}

type TransliterationEntry struct {
	ID                 string                     `json:"id"`
	Work               string                     `json:"work"`
	Locus              string                     `json:"locus"`
	DateLabel          string                     `json:"date_label"`
	ScriptType         string                     `json:"script_type"`
	OriginalText       string                     `json:"original_text"`
	LiteralGloss       string                     `json:"literal_gloss"`
	EnglishTranslation string                     `json:"english_translation"`
	PhilologicalNotes  string                     `json:"philological_notes"`
	Systems            *translit.MultiSystemResult `json:"systems,omitempty"`
}

type LiturgicalCatholicEntry struct {
	ID                      string `json:"id"`
	Tradition               string `json:"tradition"`
	Period                  string `json:"period"`
	ArtifactOrText          string `json:"artifact_or_text"`
	TheologicalMapping      string `json:"theological_mapping"`
	RitualOrLiturgicalUse   string `json:"ritual_or_liturgical_use"`
	ChristologicalCompare   string `json:"christological_comparison"`
}

type AnthropologyEntry struct {
	ID                     string `json:"id"`
	CultureOrRegion        string `json:"culture_or_region"`
	TraditionOrMyth        string `json:"tradition_or_myth"`
	Figures                string `json:"figures"`
	TabooMechanism         string `json:"taboo_mechanism"`
	OutcomeOfGlance        string `json:"outcome_of_glance"`
	AnthropologistOrScholar string `json:"anthropologist_or_scholar"`
	StructuralMeaning      string `json:"structural_meaning"`
}

type SocietalRevivalEntry struct {
	ID                       string `json:"id"`
	Year                     int    `json:"year"`
	WorkAndCreator           string `json:"work_and_creator"`
	Medium                   string `json:"medium"`
	HistoricalCrisisOrShift  string `json:"historical_crisis_or_shift"`
	HowTheEndingChanges      string `json:"how_the_ending_changes"`
	CulturalImpact           string `json:"cultural_impact"`
}

type Analytics struct {
	TimelineCount       int            `json:"timeline_count"`
	TransliterationCount int           `json:"transliteration_count"`
	LiturgicalCount     int            `json:"liturgical_count"`
	AnthropologyCount   int            `json:"anthropology_count"`
	RevivalCount        int            `json:"revival_count"`
	SpanYears           int            `json:"span_years"`
	EarliestYear        int            `json:"earliest_year"`
	LatestYear          int            `json:"latest_year"`
	EraCounts           map[string]int `json:"era_counts"`
	TraditionCounts     map[string]int `json:"tradition_counts"`
}

type Bundle struct {
	Timeline        []TimelineEntry           `json:"timeline"`
	Transliterations []TransliterationEntry   `json:"transliterations"`
	Liturgical      []LiturgicalCatholicEntry `json:"liturgical_and_catholic"`
	Anthropology    []AnthropologyEntry       `json:"anthropology_motif_c331"`
	Revivals        []SocietalRevivalEntry    `json:"societal_revivals"`
	Analytics       Analytics                 `json:"analytics"`
}

func readJSON[T any](path string) ([]T, error) {
	raw, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("read %s: %w", path, err)
	}
	var out []T
	if err := json.Unmarshal(raw, &out); err != nil {
		return nil, fmt.Errorf("parse %s: %w", path, err)
	}
	return out, nil
}

// Load reads and validates all five Orpheus datasets from dataDir, enriches passages
// with multi-system Go transliterations, and computes diachronic analytics.
func Load(dataDir string) (*Bundle, error) {
	tl, err := readJSON[TimelineEntry](filepath.Join(dataDir, "01_master_timeline.json"))
	if err != nil {
		return nil, err
	}
	tr, err := readJSON[TransliterationEntry](filepath.Join(dataDir, "02_transliterations.json"))
	if err != nil {
		return nil, err
	}
	lc, err := readJSON[LiturgicalCatholicEntry](filepath.Join(dataDir, "03_liturgical_and_catholic.json"))
	if err != nil {
		return nil, err
	}
	an, err := readJSON[AnthropologyEntry](filepath.Join(dataDir, "04_anthropology_motif_c331.json"))
	if err != nil {
		return nil, err
	}
	rv, err := readJSON[SocietalRevivalEntry](filepath.Join(dataDir, "05_societal_revivals.json"))
	if err != nil {
		return nil, err
	}

	sort.Slice(tl, func(i, j int) bool { return tl[i].Year < tl[j].Year })
	sort.Slice(rv, func(i, j int) bool { return rv[i].Year < rv[j].Year })

	for i := range tr {
		res := translit.Transliterate(tr[i].OriginalText, tr[i].ScriptType)
		tr[i].Systems = &res
	}

	b := &Bundle{
		Timeline:         tl,
		Transliterations: tr,
		Liturgical:       lc,
		Anthropology:     an,
		Revivals:         rv,
	}
	if err := Validate(b); err != nil {
		return nil, err
	}
	b.Analytics = ComputeAnalytics(b)
	return b, nil
}

// Validate enforces required identifiers and corpus integrity invariants.
func Validate(b *Bundle) error {
	if len(b.Timeline) < 18 {
		return fmt.Errorf("timeline requires >= 18 entries, got %d", len(b.Timeline))
	}
	if len(b.Transliterations) < 10 {
		return fmt.Errorf("transliterations require >= 10 entries, got %d", len(b.Transliterations))
	}
	if len(b.Liturgical) < 8 {
		return fmt.Errorf("liturgical/Catholic corpus requires >= 8 entries, got %d", len(b.Liturgical))
	}
	if len(b.Anthropology) < 8 {
		return fmt.Errorf("anthropology Motif C331 corpus requires >= 8 entries, got %d", len(b.Anthropology))
	}
	if len(b.Revivals) < 10 {
		return fmt.Errorf("societal revivals require >= 10 entries, got %d", len(b.Revivals))
	}
	for _, item := range b.Timeline {
		if item.ID == "" || item.Title == "" || item.Era == "" {
			return fmt.Errorf("invalid timeline entry: %+v", item)
		}
	}
	for _, item := range b.Transliterations {
		if item.ID == "" || item.OriginalText == "" || item.Systems == nil {
			return fmt.Errorf("invalid transliteration entry: %+v", item)
		}
	}
	return nil
}

// ComputeAnalytics computes era and tradition metrics across the 2,600-year span.
func ComputeAnalytics(b *Bundle) Analytics {
	eraCounts := make(map[string]int)
	earliest, latest := 9999, -9999
	for _, item := range b.Timeline {
		eraCounts[item.Era]++
		if item.Year < earliest {
			earliest = item.Year
		}
		if item.Year > latest {
			latest = item.Year
		}
	}
	traditionCounts := make(map[string]int)
	for _, item := range b.Liturgical {
		traditionCounts[item.Tradition]++
	}
	return Analytics{
		TimelineCount:        len(b.Timeline),
		TransliterationCount: len(b.Transliterations),
		LiturgicalCount:      len(b.Liturgical),
		AnthropologyCount:    len(b.Anthropology),
		RevivalCount:         len(b.Revivals),
		SpanYears:            latest - earliest,
		EarliestYear:         earliest,
		LatestYear:           latest,
		EraCounts:            eraCounts,
		TraditionCounts:      traditionCounts,
	}
}
