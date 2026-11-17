package org.orpheus.research.repo;

import java.util.List;
import org.orpheus.research.model.TimelineMilestoneEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TimelineMilestoneRepository extends JpaRepository<TimelineMilestoneEntity, String> {
    List<TimelineMilestoneEntity> findAllByOrderByYearAsc();
    List<TimelineMilestoneEntity> findByEraOrderByYearAsc(String era);
}
