// Package translit provides zero-dependency deterministic multi-system
// transliteration and phonetic transcription for Polytonic Greek and Latin.
package translit

import (
	"strings"
	"unicode"
)

// MultiSystemResult holds transliterations across academic, library,
// reconstructed classical, and Christian liturgical phonetic systems.
type MultiSystemResult struct {
	OriginalText        string `json:"original_text"`
	ScriptType          string `json:"script_type"`
	ISO843              string `json:"iso_843,omitempty"`
	ALALC               string `json:"ala_lc,omitempty"`
	AtticIPA            string `json:"attic_ipa,omitempty"`
	ByzantineLiturgical string `json:"byzantine_liturgical,omitempty"`
	ClassicalLatin      string `json:"classical_latin,omitempty"`
	EcclesiasticalLatin string `json:"ecclesiastical_latin,omitempty"`
	WordCount           int    `json:"word_count"`
}

type greekAtom struct {
	raw        rune
	base       rune
	isUpper    bool
	isLetter   bool
	rough      bool
	smooth     bool
	acute      bool
	grave      bool
	circumflex bool
	iotaSub    bool
	diaeresis  bool
}

type greekSpec struct {
	base       rune
	upper      bool
	rough      bool
	smooth     bool
	acute      bool
	grave      bool
	circumflex bool
	iotaSub    bool
	diaeresis  bool
}

var greekTable = buildGreekTable()

func buildGreekTable() map[rune]greekSpec {
	m := make(map[rune]greekSpec, 260)
	add := func(r, base rune, upper, rough, smooth, acute, grave, circ, iota, dia bool) {
		m[r] = greekSpec{
			base:       base,
			upper:      upper,
			rough:      rough,
			smooth:     smooth,
			acute:      acute,
			grave:      grave,
			circumflex: circ,
			iotaSub:    iota,
			diaeresis:  dia,
		}
	}

	// Standard Greek & Coptic (U+0391..U+03CE)
	plains := []struct {
		up, low, base rune
	}{
		{'Α', 'α', 'α'}, {'Β', 'β', 'β'}, {'Γ', 'γ', 'γ'}, {'Δ', 'δ', 'δ'},
		{'Ε', 'ε', 'ε'}, {'Ζ', 'ζ', 'ζ'}, {'Η', 'η', 'η'}, {'Θ', 'θ', 'θ'},
		{'Ι', 'ι', 'ι'}, {'Κ', 'κ', 'κ'}, {'Λ', 'λ', 'λ'}, {'Μ', 'μ', 'μ'},
		{'Ν', 'ν', 'ν'}, {'Ξ', 'ξ', 'ξ'}, {'Ο', 'ο', 'ο'}, {'Π', 'π', 'π'},
		{'Ρ', 'ρ', 'ρ'}, {'Σ', 'σ', 'σ'}, {'Τ', 'τ', 'τ'}, {'Υ', 'υ', 'υ'},
		{'Φ', 'φ', 'φ'}, {'Χ', 'χ', 'χ'}, {'Ψ', 'ψ', 'ψ'}, {'Ω', 'ω', 'ω'},
	}
	for _, p := range plains {
		add(p.up, p.base, true, false, false, false, false, false, false, false)
		add(p.low, p.base, false, false, false, false, false, false, false, false)
	}
	add('ς', 'σ', false, false, false, false, false, false, false, false)

	// Monotonic / Polytonic Greek accents in U+0386..U+03CE
	accents := []struct {
		r, base rune
		up      bool
		acute   bool
		dia     bool
	}{
		{'Ά', 'α', true, true, false}, {'ά', 'α', false, true, false},
		{'Έ', 'ε', true, true, false}, {'έ', 'ε', false, true, false},
		{'Ή', 'η', true, true, false}, {'ή', 'η', false, true, false},
		{'Ί', 'ι', true, true, false}, {'ί', 'ι', false, true, false},
		{'Ό', 'ο', true, true, false}, {'ό', 'ο', false, true, false},
		{'Ύ', 'υ', true, true, false}, {'ύ', 'υ', false, true, false},
		{'Ώ', 'ω', true, true, false}, {'ώ', 'ω', false, true, false},
		{'Ϊ', 'ι', true, false, true}, {'ϊ', 'ι', false, false, true}, {'ΐ', 'ι', false, true, true},
		{'Ϋ', 'υ', true, false, true}, {'ϋ', 'υ', false, false, true}, {'ΰ', 'υ', false, true, true},
	}
	for _, a := range accents {
		add(a.r, a.base, a.up, false, false, a.acute, false, false, false, a.dia)
	}

	// Greek Extended (U+1F00..U+1FFF)
	registerVowelBlock := func(start rune, base rune, iotaSub bool) {
		for offset := rune(0); offset < 16; offset++ {
			r := start + offset
			upper := offset >= 8
			mod := offset % 8
			rough := mod%2 == 1
			smooth := mod%2 == 0
			acc := mod / 2 // 0=none, 1=grave, 2=acute, 3=circ
			add(r, base, upper, rough, smooth, acc == 2, acc == 1, acc == 3, iotaSub, false)
		}
	}
	registerVowelBlock(0x1F00, 'α', false)
	registerVowelBlock(0x1F10, 'ε', false)
	registerVowelBlock(0x1F20, 'η', false)
	registerVowelBlock(0x1F30, 'ι', false)
	registerVowelBlock(0x1F40, 'ο', false)
	registerVowelBlock(0x1F50, 'υ', false)
	registerVowelBlock(0x1F60, 'ω', false)

	// Oxia / Varia pairs (U+1F70..U+1F7D)
	oxVar := []struct {
		r, base rune
		acute   bool
	}{
		{0x1F70, 'α', false}, {0x1F71, 'α', true},
		{0x1F72, 'ε', false}, {0x1F73, 'ε', true},
		{0x1F74, 'η', false}, {0x1F75, 'η', true},
		{0x1F76, 'ι', false}, {0x1F77, 'ι', true},
		{0x1F78, 'ο', false}, {0x1F79, 'ο', true},
		{0x1F7A, 'υ', false}, {0x1F7B, 'υ', true},
		{0x1F7C, 'ω', false}, {0x1F7D, 'ω', true},
	}
	for _, ov := range oxVar {
		add(ov.r, ov.base, false, false, false, ov.acute, !ov.acute, false, false, false)
	}

	// Iota subscript vowel blocks (U+1F80..U+1FAF)
	registerVowelBlock(0x1F80, 'α', true)
	registerVowelBlock(0x1F90, 'η', true)
	registerVowelBlock(0x1FA0, 'ω', true)

	// Perispomeni & special forms
	extras := []struct {
		r, base                                         rune
		up, rough, smooth, acute, grave, circ, iota, dia bool
	}{
		{0x1FB2, 'α', false, false, false, false, true, false, true, false},
		{0x1FB3, 'α', false, false, false, false, false, false, true, false},
		{0x1FB4, 'α', false, false, false, true, false, false, true, false},
		{0x1FB6, 'α', false, false, false, false, false, true, false, false},
		{0x1FB7, 'α', false, false, false, false, false, true, true, false},
		{0x1FBC, 'α', true, false, false, false, false, false, true, false},

		{0x1FC2, 'η', false, false, false, false, true, false, true, false},
		{0x1FC3, 'η', false, false, false, false, false, false, true, false},
		{0x1FC4, 'η', false, false, false, true, false, false, true, false},
		{0x1FC6, 'η', false, false, false, false, false, true, false, false},
		{0x1FC7, 'η', false, false, false, false, false, true, true, false},
		{0x1FCC, 'η', true, false, false, false, false, false, true, false},

		{0x1FD2, 'ι', false, false, false, false, true, false, false, true},
		{0x1FD3, 'ι', false, false, false, true, false, false, false, true},
		{0x1FD6, 'ι', false, false, false, false, false, true, false, false},
		{0x1FD7, 'ι', false, false, false, false, false, true, false, true},

		{0x1FE2, 'υ', false, false, false, false, true, false, false, true},
		{0x1FE3, 'υ', false, false, false, true, false, false, false, true},
		{0x1FE4, 'ρ', false, false, true, false, false, false, false, false},
		{0x1FE5, 'ρ', false, true, false, false, false, false, false, false},
		{0x1FE6, 'υ', false, false, false, false, false, true, false, false},
		{0x1FE7, 'υ', false, false, false, false, false, true, false, true},
		{0x1FEC, 'ρ', true, true, false, false, false, false, false, false},

		{0x1FF2, 'ω', false, false, false, false, true, false, true, false},
		{0x1FF3, 'ω', false, false, false, false, false, false, true, false},
		{0x1FF4, 'ω', false, false, false, true, false, false, true, false},
		{0x1FF6, 'ω', false, false, false, false, false, true, false, false},
		{0x1FF7, 'ω', false, false, false, false, false, true, true, false},
		{0x1FFC, 'ω', true, false, false, false, false, false, true, false},
	}
	for _, ex := range extras {
		add(ex.r, ex.base, ex.up, ex.rough, ex.smooth, ex.acute, ex.grave, ex.circ, ex.iota, ex.dia)
	}

	return m
}

// Transliterate converts Polytonic Greek or Latin text into multiple scholarly
// and liturgical phonetic/romanization representations.
func Transliterate(text, scriptType string) MultiSystemResult {
	trimmed := strings.TrimSpace(text)
	script := strings.ToLower(strings.TrimSpace(scriptType))
	if script == "" {
		script = detectScript(trimmed)
	}

	res := MultiSystemResult{
		OriginalText: text,
		ScriptType:   script,
		WordCount:    len(strings.Fields(trimmed)),
	}

	if script == "polytonic_greek" || script == "greek" {
		res.ScriptType = "polytonic_greek"
		atoms := parseGreekAtoms(trimmed)
		res.ISO843 = renderGreekRoman(atoms, "iso")
		res.ALALC = renderGreekRoman(atoms, "alalc")
		res.AtticIPA = "[" + renderGreekAtticIPA(atoms) + "]"
		res.ByzantineLiturgical = renderGreekByzantine(atoms)
		return res
	}

	res.ScriptType = "latin"
	res.ClassicalLatin = "[" + renderLatinPhonetic(trimmed, true) + "]"
	res.EcclesiasticalLatin = "[" + renderLatinPhonetic(trimmed, false) + "]"
	return res
}

func detectScript(text string) string {
	for _, r := range text {
		if _, ok := greekTable[r]; ok {
			return "polytonic_greek"
		}
	}
	return "latin"
}

func parseGreekAtoms(text string) []greekAtom {
	atoms := make([]greekAtom, 0, len(text))
	for _, r := range text {
		if unicode.Is(unicode.Mn, r) && len(atoms) > 0 && atoms[len(atoms)-1].isLetter {
			last := &atoms[len(atoms)-1]
			switch r {
			case '\u0313':
				last.smooth = true
			case '\u0314':
				last.rough = true
			case '\u0301', '\u0341':
				last.acute = true
			case '\u0300', '\u0340':
				last.grave = true
			case '\u0342', '\u0302':
				last.circumflex = true
			case '\u0345':
				last.iotaSub = true
			case '\u0308':
				last.diaeresis = true
			}
			continue
		}
		if spec, ok := greekTable[r]; ok {
			atoms = append(atoms, greekAtom{
				raw:        r,
				base:       spec.base,
				isUpper:    spec.upper,
				isLetter:   true,
				rough:      spec.rough,
				smooth:     spec.smooth,
				acute:      spec.acute,
				grave:      spec.grave,
				circumflex: spec.circumflex,
				iotaSub:    spec.iotaSub,
				diaeresis:  spec.diaeresis,
			})
			continue
		}
		// Normalize Greek apostrophe/koronis and middle dot
		switch r {
		case '᾽', '’':
			atoms = append(atoms, greekAtom{raw: '\''})
		case '·', ';':
			atoms = append(atoms, greekAtom{raw: ';'})
		default:
			atoms = append(atoms, greekAtom{raw: r})
		}
	}
	return atoms
}

func applyCase(s string, upper bool) string {
	if !upper || s == "" {
		return s
	}
	runes := []rune(s)
	runes[0] = unicode.ToUpper(runes[0])
	return string(runes)
}

func isGreekVowel(b rune) bool {
	switch b {
	case 'α', 'ε', 'η', 'ι', 'ο', 'υ', 'ω':
		return true
	default:
		return false
	}
}

func isVoicelessStopOrFricative(b rune) bool {
	switch b {
	case 'π', 'τ', 'κ', 'φ', 'θ', 'χ', 'σ', 'ξ', 'ψ':
		return true
	default:
		return false
	}
}

func matchDiphthong(atoms []greekAtom, i int) (string, bool, bool) {
	if i+1 >= len(atoms) || !atoms[i].isLetter || !atoms[i+1].isLetter {
		return "", false, false
	}
	a, b := atoms[i], atoms[i+1]
	// In Polytonic Greek, breathing/accent on the first vowel indicates diaeresis (not a diphthong).
	if a.iotaSub || b.diaeresis || b.iotaSub || a.rough || a.smooth || a.acute || a.grave || a.circumflex {
		return "", false, false
	}
	pair := string([]rune{a.base, b.base})
	switch pair {
	case "αι", "ει", "οι", "υι", "αυ", "ευ", "ηυ", "ου":
		return pair, a.rough || b.rough, a.isUpper
	default:
		return "", false, false
	}
}

func renderGreekRoman(atoms []greekAtom, system string) string {
	var b strings.Builder
	for i := 0; i < len(atoms); i++ {
		at := atoms[i]
		if !at.isLetter {
			b.WriteRune(at.raw)
			continue
		}

		// Diphthongs
		if pair, rough, up := matchDiphthong(atoms, i); pair != "" {
			var out string
			switch pair {
			case "ου":
				out = "ou"
			case "αυ":
				out = "au"
			case "ευ":
				out = "eu"
			case "ηυ":
				if system == "iso" {
					out = "ēu"
				} else {
					out = "ēu"
				}
			case "αι":
				out = "ai"
			case "ει":
				out = "ei"
			case "οι":
				out = "oi"
			case "υι":
				out = "ui"
			}
			if rough {
				out = "h" + out
			}
			b.WriteString(applyCase(out, up))
			i++
			continue
		}

		// Gamma nasal clusters
		if at.base == 'γ' && i+1 < len(atoms) && atoms[i+1].isLetter {
			next := atoms[i+1].base
			if next == 'γ' || next == 'κ' || next == 'ξ' || next == 'χ' {
				b.WriteString(applyCase("n", at.isUpper))
				continue
			}
		}

		var token string
		switch at.base {
		case 'α':
			token = "a"
		case 'β':
			token = "b"
		case 'γ':
			token = "g"
		case 'δ':
			token = "d"
		case 'ε':
			token = "e"
		case 'ζ':
			token = "z"
		case 'η':
			token = "ē"
		case 'θ':
			token = "th"
		case 'ι':
			token = "i"
		case 'κ':
			token = "k"
		case 'λ':
			token = "l"
		case 'μ':
			token = "m"
		case 'ν':
			token = "n"
		case 'ξ':
			token = "x"
		case 'ο':
			token = "o"
		case 'π':
			token = "p"
		case 'ρ':
			if at.rough || (i == 0 || !atoms[i-1].isLetter) && at.rough {
				token = "rh"
			} else {
				token = "r"
			}
		case 'σ':
			token = "s"
		case 'τ':
			token = "t"
		case 'υ':
			if system == "iso" {
				token = "y"
			} else {
				token = "y"
			}
		case 'φ':
			token = "ph"
		case 'χ':
			token = "ch"
		case 'ψ':
			token = "ps"
		case 'ω':
			token = "ō"
		}

		if at.iotaSub && isGreekVowel(at.base) {
			token += "i"
		}
		if at.rough && isGreekVowel(at.base) {
			token = "h" + token
		}
		b.WriteString(applyCase(token, at.isUpper))
	}
	return b.String()
}

func renderGreekAtticIPA(atoms []greekAtom) string {
	var b strings.Builder
	for i := 0; i < len(atoms); i++ {
		at := atoms[i]
		if !at.isLetter {
			b.WriteRune(at.raw)
			continue
		}

		if pair, rough, _ := matchDiphthong(atoms, i); pair != "" {
			var out string
			switch pair {
			case "ου":
				out = "uː"
			case "ει":
				out = "eː"
			case "αι":
				out = "ai̯"
			case "οι":
				out = "oi̯"
			case "υι":
				out = "yi̯"
			case "αυ":
				out = "au̯"
			case "ευ":
				out = "eu̯"
			case "ηυ":
				out = "ɛːu̯"
			}
			if rough {
				out = "h" + out
			}
			b.WriteString(out)
			i++
			continue
		}

		if at.base == 'γ' && i+1 < len(atoms) && atoms[i+1].isLetter {
			next := atoms[i+1].base
			if next == 'γ' || next == 'κ' || next == 'ξ' || next == 'χ' {
				b.WriteString("ŋ")
				continue
			}
		}

		var ipa string
		switch at.base {
		case 'α':
			ipa = "a"
		case 'β':
			ipa = "b"
		case 'γ':
			ipa = "g"
		case 'δ':
			ipa = "d"
		case 'ε':
			ipa = "e"
		case 'ζ':
			ipa = "zd"
		case 'η':
			ipa = "ɛː"
		case 'θ':
			ipa = "tʰ"
		case 'ι':
			ipa = "i"
		case 'κ':
			ipa = "k"
		case 'λ':
			ipa = "l"
		case 'μ':
			ipa = "m"
		case 'ν':
			ipa = "n"
		case 'ξ':
			ipa = "ks"
		case 'ο':
			ipa = "o"
		case 'π':
			ipa = "p"
		case 'ρ':
			if at.rough {
				ipa = "r̥"
			} else {
				ipa = "r"
			}
		case 'σ':
			ipa = "s"
		case 'τ':
			ipa = "t"
		case 'υ':
			ipa = "y"
		case 'φ':
			ipa = "pʰ"
		case 'χ':
			ipa = "kʰ"
		case 'ψ':
			ipa = "ps"
		case 'ω':
			ipa = "ɔː"
		}
		if at.iotaSub && isGreekVowel(at.base) {
			ipa += "ːi̯"
		}
		if at.rough && isGreekVowel(at.base) {
			ipa = "h" + ipa
		}
		b.WriteString(ipa)
	}
	return b.String()
}

func renderGreekByzantine(atoms []greekAtom) string {
	var b strings.Builder
	for i := 0; i < len(atoms); i++ {
		at := atoms[i]
		if !at.isLetter {
			b.WriteRune(at.raw)
			continue
		}

		if pair, _, up := matchDiphthong(atoms, i); pair != "" {
			var out string
			next := rune(0)
			if i+2 < len(atoms) && atoms[i+2].isLetter {
				next = atoms[i+2].base
			}
			fSuffix := "v"
			if next == 0 || isVoicelessStopOrFricative(next) {
				fSuffix = "f"
			}
			switch pair {
			case "αι":
				out = "e"
			case "ει", "οι", "υι":
				out = "i"
			case "ου":
				out = "u"
			case "αυ":
				out = "a" + fSuffix
			case "ευ":
				out = "e" + fSuffix
			case "ηυ":
				out = "i" + fSuffix
			}
			b.WriteString(applyCase(out, up))
			i++
			continue
		}

		if at.base == 'γ' && i+1 < len(atoms) && atoms[i+1].isLetter {
			next := atoms[i+1].base
			if next == 'γ' || next == 'κ' || next == 'ξ' || next == 'χ' {
				b.WriteString(applyCase("n", at.isUpper))
				continue
			}
		}

		var token string
		switch at.base {
		case 'α':
			token = "a"
		case 'β':
			token = "v"
		case 'γ':
			token = "gh"
		case 'δ':
			token = "dh"
		case 'ε':
			token = "e"
		case 'ζ':
			token = "z"
		case 'η', 'ι', 'υ':
			token = "i"
		case 'θ':
			token = "th"
		case 'κ':
			token = "k"
		case 'λ':
			token = "l"
		case 'μ':
			token = "m"
		case 'ν':
			token = "n"
		case 'ξ':
			token = "x"
		case 'ο', 'ω':
			token = "o"
		case 'π':
			token = "p"
		case 'ρ':
			token = "r"
		case 'σ':
			token = "s"
		case 'τ':
			token = "t"
		case 'φ':
			token = "f"
		case 'χ':
			token = "ch"
		case 'ψ':
			token = "ps"
		}
		b.WriteString(applyCase(token, at.isUpper))
	}
	return b.String()
}

func renderLatinPhonetic(text string, classical bool) string {
	lower := strings.ToLower(text)
	runes := []rune(lower)
	var b strings.Builder

	isFrontVowel := func(idx int) bool {
		if idx >= len(runes) {
			return false
		}
		switch runes[idx] {
		case 'e', 'i', 'y':
			return true
		default:
			return false
		}
	}

	for i := 0; i < len(runes); i++ {
		r := runes[i]
		if !unicode.IsLetter(r) {
			b.WriteRune(r)
			continue
		}

		if i+1 < len(runes) {
			pair := string(runes[i : i+2])
			switch pair {
			case "ae", "oe":
				if classical {
					if pair == "ae" {
						b.WriteString("ae̯")
					} else {
						b.WriteString("oe̯")
					}
				} else {
					b.WriteString("ɛ")
				}
				i++
				continue
			case "eu":
				b.WriteString("eu̯")
				i++
				continue
			case "au":
				b.WriteString("au̯")
				i++
				continue
			case "ph":
				if classical {
					b.WriteString("pʰ")
				} else {
					b.WriteString("f")
				}
				i++
				continue
			case "ch":
				if classical {
					b.WriteString("kʰ")
				} else {
					b.WriteString("k")
				}
				i++
				continue
			case "th":
				if classical {
					b.WriteString("tʰ")
				} else {
					b.WriteString("t")
				}
				i++
				continue
			case "gn":
				if !classical {
					b.WriteString("ɲɲ")
					i++
					continue
				}
			case "qu":
				b.WriteString("kw")
				i++
				continue
			}
		}

		switch r {
		case 'c':
			if !classical && isFrontVowel(i+1) {
				b.WriteString("tʃ")
			} else {
				b.WriteString("k")
			}
		case 'g':
			if !classical && isFrontVowel(i+1) {
				b.WriteString("dʒ")
			} else {
				b.WriteString("ɡ")
			}
		case 'v':
			if classical {
				b.WriteString("w")
			} else {
				b.WriteString("v")
			}
		case 'i':
			// Consonantal initial i before vowel (iam -> jam)
			prevLetter := i > 0 && unicode.IsLetter(runes[i-1])
			if !prevLetter && i+1 < len(runes) && strings.ContainsRune("aeiou", runes[i+1]) {
				b.WriteString("j")
			} else {
				b.WriteString("i")
			}
		case 'y':
			if classical {
				b.WriteString("y")
			} else {
				b.WriteString("i")
			}
		case 'x':
			b.WriteString("ks")
		case 'h':
			if classical {
				b.WriteString("h")
			}
		default:
			b.WriteRune(r)
		}
	}
	return b.String()
}
