package com.pubflow.model.repository;

import com.pubflow.model.entity.UtenteEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface UtenteRepository extends JpaRepository<UtenteEntity, Long> {
    
    Optional<UtenteEntity> findByUsername(String username);

    List<UtenteEntity> findByRuolo(String ruolo);
}
