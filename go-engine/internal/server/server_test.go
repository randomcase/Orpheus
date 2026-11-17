package server

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"testing"

	"github.com/randomcase/orpheus/go-engine/internal/corpus"
	"github.com/randomcase/orpheus/go-engine/internal/translit"
)

func TestServerEndpoints(t *testing.T) {
	bundle, err := corpus.Load(filepath.Join("..", "..", "..", "data"))
	if err != nil {
		t.Fatalf("load corpus: %v", err)
	}
	srv := New(bundle)
	h := srv.Handler()

	// Health
	req := httptest.NewRequest(http.MethodGet, "/api/go/health", nil)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("health status = %d", rec.Code)
	}

	// Transliterate
	body := bytes.NewBufferString(`{"text":"ὀνομάκλυτον Ὀρφήν","script_type":"polytonic_greek"}`)
	req = httptest.NewRequest(http.MethodPost, "/api/go/transliterate", body)
	rec = httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("transliterate status = %d", rec.Code)
	}
	var tr translit.MultiSystemResult
	if err := json.Unmarshal(rec.Body.Bytes(), &tr); err != nil {
		t.Fatalf("decode translit: %v", err)
	}
	if tr.ISO843 != "onomaklyton Orphēn" {
		t.Fatalf("ISO843 = %q", tr.ISO843)
	}

	// Katabasis
	body = bytes.NewBufferString(`{"steps":10,"look_back_step":9}`)
	req = httptest.NewRequest(http.MethodPost, "/api/go/katabasis/run", body)
	rec = httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("katabasis status = %d", rec.Code)
	}
	if !bytes.Contains(rec.Body.Bytes(), []byte("RELAPSA_INTO_AVERNO")) {
		t.Fatalf("expected RELAPSA_INTO_AVERNO in %s", rec.Body.String())
	}
}
