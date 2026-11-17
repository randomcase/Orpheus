package org.orpheus.research.repo;

import java.util.List;
import org.orpheus.research.model.LiturgicalNarrativeEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LiturgicalNarrativeRepository extends JpaRepository<LiturgicalNarrativeEntity, String> {
    List<LiturgicalNarrativeEntity> findByTraditionOrderByIdAsc(String tradition);
}
