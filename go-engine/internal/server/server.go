// Package server exposes HTTP and SSE endpoints for the Go transliteration,
// diachronic analytics, and Katabasis concurrency simulation engine.
package server

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/randomcase/orpheus/go-engine/internal/corpus"
	"github.com/randomcase/orpheus/go-engine/internal/katabasis"
	"github.com/randomcase/orpheus/go-engine/internal/lineage"
	"github.com/randomcase/orpheus/go-engine/internal/rpg"
	"github.com/randomcase/orpheus/go-engine/internal/translit"
)

type Server struct {
	bundle *corpus.Bundle
	mux    *http.ServeMux
}

func New(bundle *corpus.Bundle) *Server {
	s := &Server{
		bundle: bundle,
		mux:    http.NewServeMux(),
	}
	s.routes()
	return s
}

func (s *Server) Handler() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		s.mux.ServeHTTP(w, r)
	})
}

func (s *Server) routes() {
	s.mux.HandleFunc("GET /api/go/health", s.handleHealth)
	s.mux.HandleFunc("GET /api/go/analytics", s.handleAnalytics)
	s.mux.HandleFunc("GET /api/go/transliterations", s.handleTransliterations)
	s.mux.HandleFunc("POST /api/go/transliterate", s.handleTransliterate)
	s.mux.HandleFunc("POST /api/go/katabasis/run", s.handleKatabasisRun)
	s.mux.HandleFunc("GET /api/go/katabasis/stream", s.handleKatabasisStream)
	s.mux.HandleFunc("GET /api/go/lineage", s.handleLineage)
	s.mux.HandleFunc("POST /api/go/lineage/sever", s.handleLineageSever)
	s.mux.HandleFunc("GET /api/go/rpg/run", s.handleRPGRun)
	s.mux.HandleFunc("POST /api/go/rpg/run", s.handleRPGRun)
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func (s *Server) handleHealth(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{
		"ok":        true,
		"service":   "orpheus-go-engine",
		"timestamp": time.Now().UTC().Format(time.RFC3339),
		"records":   s.bundle.Analytics,
	})
}

func (s *Server) handleAnalytics(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, s.bundle.Analytics)
}

func (s *Server) handleTransliterations(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, s.bundle.Transliterations)
}

type transliterateReq struct {
	Text       string `json:"text"`
	ScriptType string `json:"script_type"`
}

func (s *Server) handleTransliterate(w http.ResponseWriter, r *http.Request) {
	var req transliterateReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid JSON request"})
		return
	}
	if req.Text == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "text cannot be empty"})
		return
	}
	res := translit.Transliterate(req.Text, req.ScriptType)
	writeJSON(w, http.StatusOK, res)
}

type katabasisReq struct {
	Steps        int `json:"steps"`
	LookBackStep int `json:"look_back_step"`
}

func (s *Server) handleKatabasisRun(w http.ResponseWriter, r *http.Request) {
	var req katabasisReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid JSON request"})
		return
	}
	if req.Steps == 0 {
		req.Steps = 12
	}
	res := katabasis.RunSimulation(req.Steps, req.LookBackStep)
	writeJSON(w, http.StatusOK, res)
}

func (s *Server) handleKatabasisStream(w http.ResponseWriter, r *http.Request) {
	steps, _ := strconv.Atoi(r.URL.Query().Get("steps"))
	if steps == 0 {
		steps = 12
	}
	lookBack, _ := strconv.Atoi(r.URL.Query().Get("look_back_step"))
	res := katabasis.RunSimulation(steps, lookBack)

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	flusher, ok := w.(http.Flusher)

	for _, ev := range res.Events {
		data, _ := json.Marshal(ev)
		_, _ = fmt.Fprintf(w, "event: step\ndata: %s\n\n", data)
		if ok {
			flusher.Flush()
		}
	}
	summary, _ := json.Marshal(map[string]any{
		"outcome":         res.Outcome,
		"hamartia":        res.Hamartia,
		"duration_micros": res.DurationMicros,
	})
	_, _ = fmt.Fprintf(w, "event: complete\ndata: %s\n\n", summary)
	if ok {
		flusher.Flush()
	}
}

func (s *Server) handleLineage(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, s.bundle.Lineage)
}

func (s *Server) handleLineageSever(w http.ResponseWriter, r *http.Request) {
	var req lineage.SeveranceRequest
	if r.Body != nil && r.ContentLength != 0 {
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid JSON request"})
			return
		}
	}
	res := lineage.SimulateSeverance(s.bundle.Lineage, req)
	writeJSON(w, http.StatusOK, res)
}

type rpgRunReq struct {
	Doctrine string `json:"doctrine"`
}

func (s *Server) handleRPGRun(w http.ResponseWriter, r *http.Request) {
	doctrine := r.URL.Query().Get("doctrine")
	if r.Method == http.MethodPost && r.Body != nil && r.ContentLength != 0 {
		var req rpgRunReq
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid JSON request"})
			return
		}
		if req.Doctrine != "" {
			doctrine = req.Doctrine
		}
	}
	writeJSON(w, http.StatusOK, rpg.RunCampaign(doctrine))
}
