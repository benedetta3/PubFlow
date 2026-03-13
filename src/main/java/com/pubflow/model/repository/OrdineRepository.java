package com.pubflow.model.repository;

import com.pubflow.model.entity.OrdineEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrdineRepository extends JpaRepository<OrdineEntity, Long> {

    // Trova per numero ordine (mostrato al cliente)
    Optional<OrdineEntity> findByNumeroOrdine(Integer numeroOrdine);

    // Trova per telefono cliente (tracking ordini)
    List<OrdineEntity> findByTelefonoCliente(String telefonoCliente);

    // Trova per stato (es. tutti gli ordini IN_PREPARAZIONE)
    List<OrdineEntity> findByStato(String stato);

    // Aggiornamento diretto dello stato tramite JPQL
    @Transactional
    @Modifying
    @Query("UPDATE OrdineEntity o SET o.stato = :stato WHERE o.id = :id")
    int updateStato(Long id, String stato);
}
