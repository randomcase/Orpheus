package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/randomcase/orpheus/go-engine/internal/corpus"
	"github.com/randomcase/orpheus/go-engine/internal/katabasis"
	"github.com/randomcase/orpheus/go-engine/internal/report"
	"github.com/randomcase/orpheus/go-engine/internal/server"
	"github.com/randomcase/orpheus/go-engine/internal/translit"
)

func main() {
	mode := flag.String("mode", "validate", "Execution mode: serve, validate, transliterate, katabasis, enrich-json, report")
	dataDir := flag.String("data-dir", "../data", "Path to corpus JSON data directory")
	port := flag.Int("port", 8091, "HTTP listen port for serve mode")
	text := flag.String("text", "", "Input text for transliterate mode")
	script := flag.String("script", "", "Script type (polytonic_greek | latin)")
	steps := flag.Int("steps", 12, "Total ascent steps for katabasis mode")
	lookBack := flag.Int("look-back-step", 11, "Step where Orpheus looks back (0 = faithful ascent)")
	flag.Parse()

	switch *mode {
	case "transliterate":
		res := translit.Transliterate(*text, *script)
		writeStdoutJSON(res)
	case "katabasis":
		res := katabasis.RunSimulation(*steps, *lookBack)
		writeStdoutJSON(res)
	case "validate":
		b, err := corpus.Load(*dataDir)
		must(err)
		fmt.Printf("OK: Orpheus corpus validated (%d timeline, %d transliterations, %d liturgical, %d anthropology, %d revivals; span %d BCE to %d CE)\n",
			b.Analytics.TimelineCount, b.Analytics.TransliterationCount, b.Analytics.LiturgicalCount,
			b.Analytics.AnthropologyCount, b.Analytics.RevivalCount, -b.Analytics.EarliestYear, b.Analytics.LatestYear)
	case "enrich-json":
		b, err := corpus.Load(*dataDir)
		must(err)
		writeStdoutJSON(b)
	case "report":
		b, err := corpus.Load(*dataDir)
		must(err)
		rep := report.Build(b)
		writeStdoutJSON(rep)
	case "serve":
		b, err := corpus.Load(*dataDir)
		must(err)
		srv := server.New(b)
		addr := fmt.Sprintf(":%d", *port)
		httpSrv := &http.Server{
			Addr:              addr,
			Handler:           srv.Handler(),
			ReadHeaderTimeout: 5 * time.Second,
		}
		log.Printf("Orpheus Go Engine listening on http://127.0.0.1%s (corpus span %d BCE..%d CE)",
			addr, -b.Analytics.EarliestYear, b.Analytics.LatestYear)
		log.Fatal(httpSrv.ListenAndServe())
	default:
		fmt.Fprintf(os.Stderr, "unknown mode: %s\n", *mode)
		os.Exit(2)
	}
}

func writeStdoutJSON(v any) {
	enc := json.NewEncoder(os.Stdout)
	enc.SetIndent("", "  ")
	enc.SetEscapeHTML(false)
	must(enc.Encode(v))
}

func must(err error) {
	if err != nil {
		fmt.Fprintf(os.Stderr, "ERROR: %v\n", err)
		os.Exit(1)
	}
}
