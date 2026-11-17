package org.orpheus.research.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;
import org.orpheus.research.model.AnthropologyEntity;
import org.orpheus.research.model.LiturgicalNarrativeEntity;
import org.orpheus.research.model.PassageEntity;
import org.orpheus.research.model.SocietalRevivalEntity;
import org.orpheus.research.model.TimelineMilestoneEntity;
import org.orpheus.research.repo.AnthropologyRepository;
import org.orpheus.research.repo.GenerationLineageRepository;
import org.orpheus.research.repo.LiturgicalNarrativeRepository;
import org.orpheus.research.repo.PassageRepository;
import org.orpheus.research.repo.SocietalRevivalRepository;
import org.orpheus.research.repo.TimelineMilestoneRepository;
import org.orpheus.research.service.CorpusDatabaseSeeder;
import org.orpheus.research.service.GoEngineBridgeService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class OrpheusApiController {
    private final TimelineMilestoneRepository timelineRepo;
    private final PassageRepository passageRepo;
    private final LiturgicalNarrativeRepository liturgicalRepo;
    private final AnthropologyRepository anthropologyRepo;
    private final SocietalRevivalRepository revivalRepo;
    private final GenerationLineageRepository lineageRepo;
    private final GoEngineBridgeService goBridge;
    private final ObjectMapper objectMapper;
    private final Path researchDir;
    private final Path reportsDir;
    private final Path suiteConfigPath;

    public OrpheusApiController(
            TimelineMilestoneRepository timelineRepo,
            PassageRepository passageRepo,
            LiturgicalNarrativeRepository liturgicalRepo,
            AnthropologyRepository anthropologyRepo,
            SocietalRevivalRepository revivalRepo,
            GenerationLineageRepository lineageRepo,
            GoEngineBridgeService goBridge,
            ObjectMapper objectMapper,
            @Value("${orpheus.research-dir:../research}") String researchDir,
            @Value("${orpheus.reports-dir:../reports}") String reportsDir,
            @Value("${orpheus.suite-config:../config/google-suite.json}") String suiteConfig) {
        this.timelineRepo = timelineRepo;
        this.passageRepo = passageRepo;
        this.liturgicalRepo = liturgicalRepo;
        this.anthropologyRepo = anthropologyRepo;
        this.revivalRepo = revivalRepo;
        this.lineageRepo = lineageRepo;
        this.goBridge = goBridge;
        this.objectMapper = objectMapper;
        this.researchDir = CorpusDatabaseSeeder.resolveDir(researchDir, "research");
        this.reportsDir = CorpusDatabaseSeeder.resolveDir(reportsDir, "reports");
        Path sc = Path.of(suiteConfig).toAbsolutePath().normalize();
        this.suiteConfigPath = Files.exists(sc) ? sc : Path.of("config/google-suite.json").toAbsolutePath().normalize();
    }

    @GetMapping("/summary")
    public Map<String, Object> summary() {
        Map<String, Object> counts = new LinkedHashMap<>();
        counts.put("timeline", timelineRepo.count());
        counts.put("transliterations", passageRepo.count());
        counts.put("catholic_liturgical", liturgicalRepo.count());
        counts.put("anthropology", anthropologyRepo.count());
        counts.put("societal_revivals", revivalRepo.count());
        counts.put("generations", lineageRepo.count());

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("project", "Orpheus (600 BCE – 2026 CE)");
        out.put("counts", counts);
        out.put("go_engine_online", goBridge.isHealthy());
        out.put("suite", suite());
        return out;
    }

    @GetMapping("/timeline")
    public List<TimelineMilestoneEntity> timeline(@RequestParam(required = false) String era) {
        if (era != null && !era.isBlank()) {
            return timelineRepo.findByEraOrderByYearAsc(era);
        }
        return timelineRepo.findAllByOrderByYearAsc();
    }

    @GetMapping("/transliterations")
    public Object transliterations() {
        List<Map<String, Object>> enriched = goBridge.getEnrichedPassages();
        if (!enriched.isEmpty()) {
            return enriched;
        }
        List<PassageEntity> list = passageRepo.findAll();
        list.sort(Comparator.comparing(PassageEntity::getId));
        return list;
    }

    @PostMapping("/transliterate")
    public Map<String, Object> transliterate(@RequestBody Map<String, String> req) {
        return goBridge.transliterate(req.get("text"), req.get("script_type"));
    }

    @GetMapping("/catholic-liturgical")
    public List<LiturgicalNarrativeEntity> catholicLiturgical(@RequestParam(required = false) String tradition) {
        if (tradition != null && !tradition.isBlank()) {
            return liturgicalRepo.findByTraditionOrderByIdAsc(tradition);
        }
        List<LiturgicalNarrativeEntity> all = liturgicalRepo.findAll();
        all.sort(Comparator.comparing(LiturgicalNarrativeEntity::getId));
        return all;
    }

    @GetMapping("/anthropology")
    public List<AnthropologyEntity> anthropology() {
        List<AnthropologyEntity> all = anthropologyRepo.findAll();
        all.sort(Comparator.comparing(AnthropologyEntity::getId));
        return all;
    }

    @GetMapping("/revivals")
    public List<SocietalRevivalEntity> revivals() {
        return revivalRepo.findAllByOrderByYearAsc();
    }

    @PostMapping("/katabasis")
    public Map<String, Object> katabasis(@RequestBody(required = false) Map<String, Integer> req) {
        int steps = req != null && req.get("steps") != null ? req.get("steps") : 12;
        int lookBack = req != null && req.get("look_back_step") != null ? req.get("look_back_step") : 11;
        return goBridge.runKatabasis(steps, lookBack);
    }

    @GetMapping("/lineage")
    public List<Map<String, Object>> lineage() {
        return goBridge.getLineage104();
    }

    @PostMapping("/lineage/sever")
    public Map<String, Object> severLineage(@RequestBody(required = false) Map<String, Object> req) {
        return goBridge.runLineageSeverance(req);
    }

    @PostMapping("/rpg/run")
    public Map<String, Object> runRpg(@RequestBody(required = false) Map<String, String> req) {
        String doctrine = req != null ? req.get("doctrine") : null;
        return goBridge.runRpgCampaign(doctrine);
    }

    @GetMapping("/monographs")
    public List<Map<String, String>> monographs() throws IOException {
        if (!Files.exists(researchDir)) {
            return List.of();
        }
        List<Map<String, String>> out = new ArrayList<>();
        try (Stream<Path> stream = Files.list(researchDir)) {
            List<Path> files = stream.filter(p -> p.toString().endsWith(".md"))
                    .sorted(Comparator.comparing(p -> p.getFileName().toString()))
                    .toList();
            for (Path file : files) {
                Map<String, String> item = new LinkedHashMap<>();
                item.put("filename", file.getFileName().toString());
                item.put("markdown", Files.readString(file));
                out.add(item);
            }
        }
        return out;
    }

    @GetMapping("/telemetry")
    public Object telemetry() throws IOException {
        Path reportPath = reportsDir.resolve("latest-telemetry.json");
        if (!Files.exists(reportPath)) {
            return Map.of("status", "pending_report_generation");
        }
        return objectMapper.readValue(Files.readString(reportPath), Object.class);
    }

    @GetMapping("/suite")
    public Object suite() {
        try {
            if (Files.exists(suiteConfigPath)) {
                return objectMapper.readValue(Files.readString(suiteConfigPath), Object.class);
            }
        } catch (IOException ignored) {
            // Return minimal fallback when config file is unavailable.
        }
        return Map.of("project", "Orpheus");
    }
}
