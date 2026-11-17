package org.orpheus.research.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
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
    private final ObjectMapper objectMapper;
    private final String goEngineUrl;
    private final boolean autoStart;
    private final Path binaryPath;
    private final Path dataDir;
    private Process managedProcess;

    private static final List<String> MYTHEME_KEYS = List.of(
            "threshold_voice",
            "argonaut_voyage",
            "mystery_passport",
            "katabasis_descent",
            "named_eurydice",
            "taboo_c331_glance",
            "sparagmos_head_oracle",
            "redemptive_return"
    );

    public GoEngineBridgeService(
            ObjectMapper objectMapper,
            @Value("${orpheus.go-engine.url:http://127.0.0.1:8091}") String goEngineUrl,
            @Value("${orpheus.go-engine.auto-start:true}") boolean autoStart,
            @Value("${orpheus.go-engine.binary-path:../bin/orpheus-engine.exe}") String binaryPath,
            @Value("${orpheus.data-dir:../data}") String dataDir) {
        this.objectMapper = objectMapper;
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

    public List<Map<String, Object>> getLineage104() {
        try {
            List<Map<String, Object>> res = restClient.get()
                    .uri("/api/go/lineage")
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {});
            if (res != null && !res.isEmpty()) {
                return res;
            }
        } catch (Exception ignored) {
            // Fall back to canonical JSON file when Go engine is offline.
        }
        try {
            Path file = dataDir.resolve("06_generational_lineage_104.json");
            if (Files.exists(file)) {
                return objectMapper.readValue(Files.readString(file), new TypeReference<>() {});
            }
        } catch (IOException ex) {
            log.warn("Could not load lineage JSON: {}", ex.getMessage());
        }
        return List.of();
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> runLineageSeverance(Map<String, Object> req) {
        Map<String, Object> payload = req == null ? Map.of() : req;
        try {
            Map<String, Object> res = restClient.post()
                    .uri("/api/go/lineage/sever")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {});
            if (res != null) {
                res.put("engine", "go-1.26-lineage-dag");
                return res;
            }
        } catch (Exception ignored) {
            // Deterministic Java DAG mirror fallback when Go engine is offline.
        }

        List<Map<String, Object>> nodes = new ArrayList<>(getLineage104());
        nodes.sort(Comparator.comparingInt(n -> ((Number) n.getOrDefault("gen_number", 0)).intValue()));

        Set<String> severedIds = new HashSet<>();
        Object rawIds = payload.get("severed_ids");
        if (rawIds instanceof List<?> list) {
            for (Object item : list) {
                if (item != null && !item.toString().isBlank()) {
                    severedIds.add(item.toString().trim().toUpperCase());
                }
            }
        }

        Set<String> severedStreams = new HashSet<>();
        Object rawStreams = payload.get("severed_streams");
        if (rawStreams instanceof List<?> list) {
            for (Object item : list) {
                if (item != null && !item.toString().isBlank()) {
                    severedStreams.add(item.toString().trim());
                }
            }
        }
        boolean disableCapsules = Boolean.TRUE.equals(payload.get("disable_time_capsules"));

        Map<String, Boolean> alive = new HashMap<>();
        Map<String, Boolean> livingOnlyAlive = new HashMap<>();
        Map<String, Set<String>> ancestors = new HashMap<>();
        List<String> aliveIds = new ArrayList<>();
        List<String> darkIds = new ArrayList<>();
        List<String> severedApplied = new ArrayList<>();

        for (Map<String, Object> n : nodes) {
            String id = String.valueOf(n.get("id"));
            int gen = ((Number) n.getOrDefault("gen_number", 0)).intValue();
            String stream = String.valueOf(n.getOrDefault("primary_stream", ""));
            if (severedIds.contains(id)) {
                severedApplied.add(id);
            }
            if (severedIds.contains(id) || severedStreams.contains(stream)) {
                darkIds.add(id);
                continue;
            }

            List<String> upstream = (List<String>) n.getOrDefault("upstream_ids", List.of());
            List<String> capsuleUp = (List<String>) n.getOrDefault("capsule_upstream_ids", List.of());

            boolean isLiving = (gen == 1);
            if (!isLiving) {
                for (String up : upstream) {
                    if (Boolean.TRUE.equals(livingOnlyAlive.get(up))) {
                        isLiving = true;
                        break;
                    }
                }
            }
            livingOnlyAlive.put(id, isLiving);

            List<String> activeParents = new ArrayList<>();
            for (String up : upstream) {
                if (Boolean.TRUE.equals(alive.get(up))) {
                    activeParents.add(up);
                }
            }
            if (!disableCapsules) {
                for (String cup : capsuleUp) {
                    if (Boolean.TRUE.equals(alive.get(cup))) {
                        activeParents.add(cup);
                    }
                }
            }
            if (gen != 1 && activeParents.isEmpty()) {
                darkIds.add(id);
                continue;
            }
            alive.put(id, true);
            aliveIds.add(id);
            Set<String> anc = new HashSet<>();
            anc.add(id);
            for (String p : activeParents) {
                Set<String> pAnc = ancestors.get(p);
                if (pAnc != null) {
                    anc.addAll(pAnc);
                }
            }
            ancestors.put(id, anc);
        }

        String targetId = nodes.isEmpty() ? "G-104" : String.valueOf(nodes.get(nodes.size() - 1).get("id"));
        boolean survives2026 = Boolean.TRUE.equals(alive.get(targetId));
        boolean capsuleResurrected = survives2026 && !Boolean.TRUE.equals(livingOnlyAlive.get(targetId));

        Set<String> survivingMythemeSet = new HashSet<>();
        Set<String> survivingMilestoneSet = new HashSet<>();
        List<String> allMilestones = new ArrayList<>();
        Set<String> targetAnc = ancestors.getOrDefault(targetId, Set.of());

        for (Map<String, Object> n : nodes) {
            String id = String.valueOf(n.get("id"));
            List<String> msList = (List<String>) n.getOrDefault("milestone_ids", List.of());
            allMilestones.addAll(msList);
            if (survives2026 && targetAnc.contains(id)) {
                survivingMythemeSet.addAll((List<String>) n.getOrDefault("introduced_mythemes", List.of()));
                survivingMilestoneSet.addAll(msList);
            }
        }

        List<String> survivingMythemes = new ArrayList<>();
        List<String> extinctMythemes = new ArrayList<>();
        for (String k : MYTHEME_KEYS) {
            if (survivingMythemeSet.contains(k)) {
                survivingMythemes.add(k);
            } else {
                extinctMythemes.add(k);
            }
        }

        List<String> survivingMilestones = new ArrayList<>();
        List<String> lostMilestones = new ArrayList<>();
        for (String ms : allMilestones) {
            if (survivingMilestoneSet.contains(ms)) {
                survivingMilestones.add(ms);
            } else {
                lostMilestones.add(ms);
            }
        }

        String diagnosis = !survives2026
                ? "Total extinction: chain broken before Generation #104 (2026 CE)."
                : (capsuleResurrected
                        ? "Archaeological resurrection: buried time capsules rescued Orpheus to 2026 CE."
                        : (extinctMythemes.isEmpty()
                                ? "Unbroken transmission across 104 generations to 2026 CE."
                                : "Partial survival reaching 2026 CE; extinguished: " + String.join(", ", extinctMythemes)));

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("story_survives_to_2026", survives2026);
        out.put("capsule_resurrected", capsuleResurrected);
        out.put("alive_count", aliveIds.size());
        out.put("dark_count", darkIds.size());
        out.put("alive_ids", aliveIds);
        out.put("dark_ids", darkIds);
        out.put("severed_applied", severedApplied);
        out.put("surviving_mythemes", survivingMythemes);
        out.put("extinct_mythemes", extinctMythemes);
        out.put("surviving_milestones", survivingMilestones);
        out.put("lost_milestones", lostMilestones);
        out.put("diagnosis", diagnosis);
        out.put("engine", "jvm-fallback");
        return out;
    }

    public Map<String, Object> runRpgCampaign(String rawDoctrine) {
        String doctrine = rawDoctrine == null ? "" : rawDoctrine.trim().toLowerCase();
        String norm = switch (doctrine) {
            case "archaic_redemptive", "redemptive", "euripides", "gluck", "sir_orfeo" -> "archaic_redemptive";
            case "consensual_memory", "sciamma", "consensual", "modern" -> "consensual_memory";
            default -> "canonical_tragic";
        };

        try {
            Map<String, Object> res = restClient.post()
                    .uri("/api/go/rpg/run")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("doctrine", norm))
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {});
            if (res != null) {
                res.put("engine", "go-1.26-rpg");
                return res;
            }
        } catch (Exception ignored) {
            // Deterministic Java 7-Act fallback when Go engine is offline.
        }

        List<String> relics = new ArrayList<>();
        List<Map<String, Object>> acts = new ArrayList<>();
        int pothos = 10;
        int psycheHp = 100;
        int mnemosyne = 30;
        int peitho = 25;
        int xp = 0;

        Object[][] defs = {
                {1, "I", "Aboard the Argo & Clashing Rocks", "argo", "VICTORY_HARMONIC_PASSAGE", "Apolline Seven-String Kithara", 140, 40, 40, 10, 100},
                {2, "II", "Pierian Grove & Olbia Initiations", "grove", "NATURE_AND_SOUL_ATTUNED", "Olbia Bone Plaque (Life-Death-Life)", 320, 58, 60, 15, 100},
                {3, "III", "Hymenaios Meadow & The Lurking Serpent", "meadow", "BEREAVEMENT_KATABASIS_SWORN", "Bridal Saffron Veil", 510, 58, 60, 57, 72},
                {4, "IV", "Crossing Styx, Cerberus & Tartarus", "tartarus", "TARTARUS_CHOREOGRAPHY_SUSPENDED", "Hipponion Gold Memory Lamella", 760, 80, 60, 67, 72},
                {5, "V", "Plea Before Hades & Persephone", "throne", "CONDITIONAL_PACT_GRANTED", "Pomegranate Seal of Persephone", 1040, 96, 85, 79, 72},
                {6, "VI", "Twelve Steps of Cave Taenarum", "ascent",
                        "archaic_redemptive".equals(norm) ? "THRESHOLD_CROSSED_TOGETHER"
                                : ("consensual_memory".equals(norm) ? "CONSENSUAL_GAZE_FULFILLED" : "RESPEXIT_RELAPSA_INTO_AVERNO"),
                        "Threshold Mirror Shard", 1380, 96,
                        "consensual_memory".equals(norm) ? 100 : ("archaic_redemptive".equals(norm) ? 98 : 78),
                        "archaic_redemptive".equals(norm) ? 62 : ("consensual_memory".equals(norm) ? 84 : 100),
                        "archaic_redemptive".equals(norm) ? 95 : ("consensual_memory".equals(norm) ? 90 : 45)},
                {7, "VII", "Hebrus Oracle & Constellation Lyra", "lyra", "IMMORTALIZED_IN_SONG_TO_2026", "Starlight Constellation Lyra", 1800, 100, 100,
                        "archaic_redemptive".equals(norm) ? 62 : ("consensual_memory".equals(norm) ? 84 : 100),
                        "archaic_redemptive".equals(norm) ? 95 : ("consensual_memory".equals(norm) ? 90 : 45)}
        };

        Map<String, Object> finalStats = new LinkedHashMap<>();
        for (Object[] row : defs) {
            int num = (int) row[0];
            String relic = (String) row[5];
            relics.add(relic);
            xp = (int) row[6];
            peitho = (int) row[7];
            mnemosyne = (int) row[8];
            pothos = (int) row[9];
            psycheHp = (int) row[10];

            Map<String, Object> snap = new LinkedHashMap<>();
            snap.put("level", num);
            snap.put("xp", xp);
            snap.put("psyche_hp", psycheHp);
            snap.put("melos_mana", 88);
            snap.put("peitho", peitho);
            snap.put("mnemosyne", mnemosyne);
            snap.put("pothos", pothos);
            snap.put("relics", new ArrayList<>(relics));
            finalStats = snap;

            Map<String, Object> act = new LinkedHashMap<>();
            act.put("act_number", num);
            act.put("roman", row[1]);
            act.put("title", row[2]);
            act.put("biome", row[3]);
            act.put("outcome", row[4]);
            act.put("relic_unlocked", relic);
            act.put("stats_after", snap);
            act.put("events", List.of("Act " + row[1] + " resolved: " + row[4]));
            acts.add(act);
        }

        String finalOutcome = switch (norm) {
            case "archaic_redemptive" -> "REUNITED_IN_SUNLIGHT";
            case "consensual_memory" -> "ETERNAL_RESONANCE";
            default -> "RELAPSA_INTO_AVERNO";
        };

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("hero", "Orpheus of Thrace");
        out.put("class", "Kitharode & Katabasis Bard");
        out.put("doctrine", norm);
        out.put("final_outcome", finalOutcome);
        out.put("total_turns", acts.size());
        out.put("final_stats", finalStats);
        out.put("acts", acts);
        out.put("engine", "jvm-fallback");
        return out;
    }
}
