package org.orpheus.research.service;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class GoEngineBridgeService {
    private static final Logger log = LoggerFactory.getLogger(GoEngineBridgeService.class);

    private final RestClient restClient;
    private final String goEngineUrl;
    private final boolean autoStart;
    private final Path binaryPath;
    private final Path dataDir;
    private Process managedProcess;

    public GoEngineBridgeService(
            @Value("${orpheus.go-engine.url:http://127.0.0.1:8091}") String goEngineUrl,
            @Value("${orpheus.go-engine.auto-start:true}") boolean autoStart,
            @Value("${orpheus.go-engine.binary-path:../bin/orpheus-engine.exe}") String binaryPath,
            @Value("${orpheus.data-dir:../data}") String dataDir) {
        this.goEngineUrl = goEngineUrl;
        this.autoStart = autoStart;
        this.binaryPath = Path.of(binaryPath).toAbsolutePath().normalize();
        this.dataDir = CorpusDatabaseSeeder.resolveDir(dataDir, "data");
        this.restClient = RestClient.builder().baseUrl(goEngineUrl).build();
    }

    @PostConstruct
    public void ensureGoEngineRunning() {
        if (!autoStart || isHealthy()) {
            return;
        }
        Path candidate = resolveExecutable();
        if (candidate == null) {
            log.info("Go engine binary not found at {}; running with JVM fallback.", binaryPath);
            return;
        }
        try {
            ProcessBuilder pb = new ProcessBuilder(
                    candidate.toString(),
                    "--mode=serve",
                    "--port=" + extractPort(goEngineUrl),
                    "--data-dir=" + dataDir.toString());
            pb.redirectErrorStream(true);
            this.managedProcess = pb.start();
            for (int i = 0; i < 15; i++) {
                if (isHealthy()) {
                    log.info("Auto-started Orpheus Go Engine at {}", goEngineUrl);
                    return;
                }
                Thread.sleep(150);
            }
        } catch (IOException | InterruptedException ex) {
            log.warn("Could not auto-start Go engine: {}", ex.getMessage());
            if (ex instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
        }
    }

    @PreDestroy
    public void stopManagedGoEngine() {
        if (managedProcess != null && managedProcess.isAlive()) {
            managedProcess.destroy();
        }
    }

    private Path resolveExecutable() {
        if (Files.isRegularFile(binaryPath)) {
            return binaryPath;
        }
        Path unixBinary = Path.of("../bin/orpheus-engine").toAbsolutePath().normalize();
        return Files.isRegularFile(unixBinary) ? unixBinary : null;
    }

    private static int extractPort(String url) {
        int colon = url.lastIndexOf(':');
        if (colon > 5) {
            try {
                return Integer.parseInt(url.substring(colon + 1).replaceAll("\\D.*", ""));
            } catch (NumberFormatException ignored) {
                return 8091;
            }
        }
        return 8091;
    }

    public boolean isHealthy() {
        try {
            Map<String, Object> body = restClient.get()
                    .uri("/api/go/health")
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {});
            return body != null && Boolean.TRUE.equals(body.get("ok"));
        } catch (Exception ex) {
            return false;
        }
    }

    public Map<String, Object> transliterate(String text, String scriptType) {
        try {
            Map<String, Object> payload = Map.of(
                    "text", text == null ? "" : text,
                    "script_type", scriptType == null ? "" : scriptType);
            Map<String, Object> res = restClient.post()
                    .uri("/api/go/transliterate")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {});
            if (res != null) {
                res.put("engine", "go-1.26-live");
                return res;
            }
        } catch (Exception ignored) {
            // Fall through to JVM fallback when Go server is not reachable (e.g., isolated MockMvc test).
        }
        Map<String, Object> fallback = new LinkedHashMap<>();
        fallback.put("original_text", text);
        fallback.put("script_type", scriptType == null || scriptType.isBlank() ? "latin" : scriptType);
        fallback.put("engine", "jvm-fallback");
        fallback.put("note", "Start go-engine on :8091 for full multi-system Greek/Latin phonetics.");
        return fallback;
    }

    public List<Map<String, Object>> getEnrichedPassages() {
        try {
            List<Map<String, Object>> res = restClient.get()
                    .uri("/api/go/transliterations")
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {});
            if (res != null) {
                return res;
            }
        } catch (Exception ignored) {
            // Fallback handled by controller using JPA passages.
        }
        return List.of();
    }

    public Map<String, Object> runKatabasis(int steps, int lookBackStep) {
        try {
            Map<String, Object> req = Map.of("steps", steps, "look_back_step", lookBackStep);
            Map<String, Object> res = restClient.post()
                    .uri("/api/go/katabasis/run")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(req)
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {});
            if (res != null) {
                res.put("engine", "go-1.26-goroutines");
                return res;
            }
        } catch (Exception ignored) {
            // Deterministic JVM fallback if Go service is offline in isolated test mode.
        }
        int bounded = Math.max(3, Math.min(30, steps == 0 ? 12 : steps));
        List<Map<String, Object>> events = new ArrayList<>();
        boolean relapsed = lookBackStep >= 1 && lookBackStep <= bounded;
        int limit = relapsed ? lookBackStep : bounded;
        for (int i = 1; i <= limit; i++) {
            boolean turn = relapsed && i == lookBackStep;
            Map<String, Object> ev = new LinkedHashMap<>();
            ev.put("step", i);
            ev.put("total_steps", bounded);
            ev.put("actor", turn ? "Orpheus" : "Orpheus & Eurydice");
            ev.put("phase", turn ? "Respexit" : "Ascent");
            ev.put("message", turn ? "Backward glance breaks Motif C331." : "Ascending in silence (" + i + "/" + bounded + ").");
            ev.put("taboo_intact", !turn);
            events.add(ev);
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("steps_requested", bounded);
        out.put("look_back_at_step", lookBackStep);
        out.put("outcome", relapsed ? "RELAPSA_INTO_AVERNO" : "REUNITED_IN_LIGHT");
        if (relapsed) {
            out.put("hamartia", "Motif C331 violated at step " + lookBackStep + " of " + bounded);
        }
        out.put("events", events);
        out.put("engine", "jvm-fallback");
        return out;
    }
}
