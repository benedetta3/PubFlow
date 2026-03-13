package com.pubflow.model.service;

import com.pubflow.model.dto.Prenotazione;
import com.pubflow.model.entity.PrenotazioneEntity;
import com.pubflow.model.mapper.PrenotazioneMapper;
import com.pubflow.model.repository.PrenotazioneRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PrenotazioneService {

    private final PrenotazioneMapper prenotazioneMapper;
    private final PrenotazioneRepository prenotazioneRepository;

    // Recupera tutte le prenotazioni
    public List<Prenotazione> getAll() {
        return prenotazioneRepository.findAll()
                .stream().map(prenotazioneMapper::toDto).toList();
    }

    // Recupera una prenotazione per id
    public Prenotazione getById(Long id) {
        return prenotazioneRepository.findById(id)
                .map(prenotazioneMapper::toDto)
                .orElse(null);
    }

    // Tracking: recupera per numero prenotazione — con cache
    @Cacheable("prenotazioneNumeroCache")
    public Prenotazione getByNumeroPrenotazione(Integer numero) {
        log.info("Tracking prenotazione numero: {}", numero);
        return prenotazioneRepository.findByNumeroPrenotazione(numero)
                .map(prenotazioneMapper::toDto)
                .orElse(null);
    }

    // Tracking: recupera per telefono cliente
    public List<Prenotazione> getByTelefono(String telefono) {
        log.info("Tracking prenotazioni per telefono: {}", telefono);
        return prenotazioneRepository.findByTelefonoCliente(telefono)
                .stream().map(prenotazioneMapper::toDto).toList();
    }

    // Recupera prenotazioni per una data specifica
    public List<Prenotazione> getByData(LocalDate data) {
        return prenotazioneRepository.findByData(data)
                .stream().map(prenotazioneMapper::toDto).toList();
    }

    // Crea una nuova prenotazione e genera il numero prenotazione
    public Prenotazione save(Prenotazione prenotazione) {
        PrenotazioneEntity entity = prenotazioneMapper.toEntity(prenotazione);
        entity.setStato("CONFERMATA");

        // Genera numero prenotazione progressivo semplice
        long count = prenotazioneRepository.count();
        entity.setNumeroPrenotazione((int) (count + 1));

        log.info("Nuova prenotazione - cliente: {}, data: {}", entity.getNomeCliente(), entity.getData());
        return prenotazioneMapper.toDto(prenotazioneRepository.save(entity));
    }

    // Aggiorna lo stato di una prenotazione tramite query JPQL diretta
    // Invalida la cache per far vedere subito il nuovo stato
    @CacheEvict(value = "prenotazioneNumeroCache", allEntries = true)
    public int aggiornaStato(Long id, String nuovoStato) {
        log.info("Aggiornamento stato prenotazione id: {} -> {}", id, nuovoStato);
        return prenotazioneRepository.updateStato(id, nuovoStato);
    }

    // Elimina una prenotazione
    public void delete(Long id) {
        prenotazioneRepository.deleteById(id);
    }

    /** CLEAR CACHE **/

    @CacheEvict(value = "prenotazioneNumeroCache", allEntries = true)
    @Scheduled(fixedRateString = "${caching.spring.prenotazioneCacheTTL}")
    public void emptyPrenotazioneCache() {
        log.info("Svuotamento cache prenotazioneNumeroCache");
    }
}
