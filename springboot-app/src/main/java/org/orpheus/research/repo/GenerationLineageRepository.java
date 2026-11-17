package org.orpheus.research.repo;

import java.util.List;
import org.orpheus.research.model.GenerationLineageEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GenerationLineageRepository extends JpaRepository<GenerationLineageEntity, String> {
    List<GenerationLineageEntity> findAllByOrderByGenNumberAsc();
}
