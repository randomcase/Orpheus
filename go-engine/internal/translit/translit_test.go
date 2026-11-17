package translit

import (
	"strings"
	"testing"
)

func TestTransliteratePolytonicGreek(t *testing.T) {
	cases := []struct {
		name      string
		input     string
		wantISO   string
		wantByz   string
		wantInIPA string
	}{
		{
			name:      "Delphi Archaic Orphas",
			input:     "ΟΡΦΑΣ",
			wantISO:   "ORPHAS",
			wantByz:   "ORFAS",
			wantInIPA: "orpʰas",
		},
		{
			name:      "Olbia Bone Tablet",
			input:     "Βίος θάνατος βίος · ἀλήθεια · Διόνυσος Ὀρφικοί",
			wantISO:   "Bios thanatos bios ; alētheia ; Dionysos Orphikoi",
			wantByz:   "Vios thanatos vios ; alithia ; Dhionisos Orfiki",
			wantInIPA: "tʰanatos",
		},
		{
			name:      "Ibycus Orpheus",
			input:     "ὀνομάκλυτον Ὀρφήν",
			wantISO:   "onomaklyton Orphēn",
			wantByz:   "onomakliton Orfin",
			wantInIPA: "orpʰɛːn",
		},
		{
			name:      "Euripides Hades Rough Breathing",
			input:     "ἐξ Ἅιδου",
			wantISO:   "ex Haidou",
			wantByz:   "ex Aidhu",
			wantInIPA: "haiduː",
		},
		{
			name:      "Hipponion Gold Tablet",
			input:     "Γῆς παῖς εἰμι καὶ Οὐρανοῦ",
			wantISO:   "Gēs pais eimi kai Ouranou",
			wantByz:   "Ghis pes imi ke Uranu",
			wantInIPA: "gɛːs",
		},
		{
			name:      "Clement Logos",
			input:     "ᾆσμα καινόν, ὁ Λόγος ὁ Χριστός",
			wantISO:   "aisma kainon, ho Logos ho Christos",
			wantByz:   "asma kenon, o Loghos o Christos",
			wantInIPA: "kʰristos",
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := Transliterate(tc.input, "polytonic_greek")
			if got.ISO843 != tc.wantISO {
				t.Fatalf("ISO843 = %q, want %q", got.ISO843, tc.wantISO)
			}
			if got.ByzantineLiturgical != tc.wantByz {
				t.Fatalf("Byzantine = %q, want %q", got.ByzantineLiturgical, tc.wantByz)
			}
			if !strings.Contains(strings.ToLower(got.AtticIPA), tc.wantInIPA) {
				t.Fatalf("AtticIPA = %q, expected substring %q", got.AtticIPA, tc.wantInIPA)
			}
		})
	}
}

func TestTransliterateLatinClassicalVsEcclesiastical(t *testing.T) {
	text := "Orpheus Eurydicen vidit, iam luce sub ipsa"
	got := Transliterate(text, "latin")
	if !strings.Contains(got.ClassicalLatin, "widit") {
		t.Fatalf("ClassicalLatin expected 'widit', got %q", got.ClassicalLatin)
	}
	if !strings.Contains(got.ClassicalLatin, "luke") {
		t.Fatalf("ClassicalLatin expected 'luke', got %q", got.ClassicalLatin)
	}
	if !strings.Contains(got.EcclesiasticalLatin, "vidit") {
		t.Fatalf("EcclesiasticalLatin expected 'vidit', got %q", got.EcclesiasticalLatin)
	}
	if !strings.Contains(got.EcclesiasticalLatin, "lutʃe") {
		t.Fatalf("EcclesiasticalLatin expected 'lutʃe', got %q", got.EcclesiasticalLatin)
	}
}

func BenchmarkTransliterateGreek(b *testing.B) {
	line := "εἰ δ᾽ Ὀρφέως μοι γλῶσσα καὶ μέλος παρῆν, ὕμνοισι κηλήσαντά σ᾽ ἐξ Ἅιδου λαβεῖν"
	for b.Loop() {
		_ = Transliterate(line, "polytonic_greek")
	}
}

func BenchmarkTransliterateLatin(b *testing.B) {
	line := "Orpheus Christus est; Eurydice anima humana per fidem ab inferno reducta."
	for b.Loop() {
		_ = Transliterate(line, "latin")
	}
}
