package org.orpheus.research.repo;

import java.util.List;
import org.orpheus.research.model.SocietalRevivalEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SocietalRevivalRepository extends JpaRepository<SocietalRevivalEntity, String> {
    List<SocietalRevivalEntity> findAllByOrderByYearAsc();
}
