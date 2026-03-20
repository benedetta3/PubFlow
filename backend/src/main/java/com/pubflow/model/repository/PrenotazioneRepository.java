package com.pubflow.model.repository;

import com.pubflow.model.entity.PrenotazioneEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface PrenotazioneRepository extends JpaRepository<PrenotazioneEntity, Long> {

    // Trova per numero prenotazione (fornito al cliente)
    Optional<PrenotazioneEntity> findByNumeroPrenotazione(Integer numeroPrenotazione);

    // Trova per telefono cliente
    List<PrenotazioneEntity> findByTelefonoCliente(String telefonoCliente);

    // Trova tutte le prenotazioni di una data specifica
    List<PrenotazioneEntity> findByData(LocalDate data);

    // Ordina tutte le prenotazioni per data e ora
    List<PrenotazioneEntity> findAllByOrderByDataAscOraAsc();

    // Aggiornamento diretto dello stato tramite JPQL
    @Transactional
    @Modifying
    @Query("UPDATE PrenotazioneEntity p SET p.stato = :stato WHERE p.id = :id")
    int updateStato(Long id, String stato);
}
