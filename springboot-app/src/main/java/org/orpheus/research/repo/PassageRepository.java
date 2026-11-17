package org.orpheus.research.repo;

import org.orpheus.research.model.PassageEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PassageRepository extends JpaRepository<PassageEntity, String> {
}
