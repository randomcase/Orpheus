package org.orpheus.research.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import org.orpheus.research.model.AnthropologyEntity;
import org.orpheus.research.model.GenerationLineageEntity;
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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Component;

@Component
public class CorpusDatabaseSeeder implements ApplicationRunner {
    private final ObjectMapper objectMapper;
    private final TimelineMilestoneRepository timelineRepo;
    private final PassageRepository passageRepo;
    private final LiturgicalNarrativeRepository liturgicalRepo;
    private final AnthropologyRepository anthropologyRepo;
    private final SocietalRevivalRepository revivalRepo;
    private final GenerationLineageRepository lineageRepo;
    private final Path dataDir;

    public CorpusDatabaseSeeder(
            ObjectMapper objectMapper,
            TimelineMilestoneRepository timelineRepo,
            PassageRepository passageRepo,
            LiturgicalNarrativeRepository liturgicalRepo,
            AnthropologyRepository anthropologyRepo,
            SocietalRevivalRepository revivalRepo,
            GenerationLineageRepository lineageRepo,
            @Value("${orpheus.data-dir:../data}") String dataDirPath) {
        this.objectMapper = objectMapper;
        this.timelineRepo = timelineRepo;
        this.passageRepo = passageRepo;
        this.liturgicalRepo = liturgicalRepo;
        this.anthropologyRepo = anthropologyRepo;
        this.revivalRepo = revivalRepo;
        this.lineageRepo = lineageRepo;
        this.dataDir = resolveDir(dataDirPath, "data");
    }

    public static Path resolveDir(String configured, String fallbackFolderName) {
        Path p = Path.of(configured).toAbsolutePath().normalize();
        if (Files.exists(p)) {
            return p;
        }
        Path alt = Path.of(fallbackFolderName).toAbsolutePath().normalize();
        return Files.exists(alt) ? alt : p;
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        seedFile("01_master_timeline.json", new TypeReference<List<TimelineMilestoneEntity>>() {}, timelineRepo);
        seedFile("02_transliterations.json", new TypeReference<List<PassageEntity>>() {}, passageRepo);
        seedFile("03_liturgical_and_catholic.json", new TypeReference<List<LiturgicalNarrativeEntity>>() {}, liturgicalRepo);
        seedFile("04_anthropology_motif_c331.json", new TypeReference<List<AnthropologyEntity>>() {}, anthropologyRepo);
        seedFile("05_societal_revivals.json", new TypeReference<List<SocietalRevivalEntity>>() {}, revivalRepo);
        seedFile("06_generational_lineage_104.json", new TypeReference<List<GenerationLineageEntity>>() {}, lineageRepo);
    }

    private <T> void seedFile(String filename, TypeReference<List<T>> typeRef, JpaRepository<T, String> repo)
            throws IOException {
        Path file = dataDir.resolve(filename);
        if (!Files.exists(file)) {
            throw new IOException("Missing corpus dataset: " + file);
        }
        List<T> items = objectMapper.readValue(Files.readString(file), typeRef);
        repo.saveAll(items);
    }
}
