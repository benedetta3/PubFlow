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

    // Crea una nuova prenotazione (con validazione capienza tavoli)
    public Prenotazione save(Prenotazione prenotazione) {
        // Verifica Capienza Tavoli per data e ora
        List<PrenotazioneEntity> occupateData = prenotazioneRepository.findByData(prenotazione.getData());
        List<PrenotazioneEntity> occupateOra = occupateData.stream()
                .filter(p -> p.getOra().equals(prenotazione.getOra()) && 
                            ("CONFERMATA".equals(p.getStato()) || "RICEVUTA".equals(p.getStato())))
                .toList();
        
        List<Integer> groups = new java.util.ArrayList<>();
        for (PrenotazioneEntity p : occupateOra) {
            groups.add(p.getNumeroPersone());
        }
        // Aggiungiamo il nuovo gruppo alla lista per vedere se ci stanno tutti
        groups.add(prenotazione.getNumeroPersone());

        if (!canSatisfyAll(groups)) {
            throw new IllegalArgumentException("Nessun tavolo disponibile per " + prenotazione.getNumeroPersone() + " persone. Locale pieno o combinazione tavoli insufficiente per l'ora richiesta.");
        }

        PrenotazioneEntity entity = prenotazioneMapper.toEntity(prenotazione);
        entity.setStato("CONFERMATA");

        // Genera numero prenotazione progressivo semplice
        long count = prenotazioneRepository.count();
        entity.setNumeroPrenotazione((int) (count + 1));

        log.info("Nuova prenotazione - cliente: {}, data: {}", entity.getNomeCliente(), entity.getData());
        return prenotazioneMapper.toDto(prenotazioneRepository.save(entity));
    }

    private boolean canSatisfyAll(List<Integer> groups) {
        groups.sort(java.util.Collections.reverseOrder());
        List<Integer> availableTables = new java.util.ArrayList<>(java.util.Arrays.asList(10, 10, 6, 6, 6, 4, 4, 4, 4));
        return assignBacktrack(groups, 0, availableTables);
    }

    private boolean assignBacktrack(List<Integer> groups, int groupIndex, List<Integer> availableTables) {
        if (groupIndex == groups.size()) return true;
        
        int currentGroupSize = groups.get(groupIndex);

        List<List<Integer>> validCombos = findValidTableCombos(currentGroupSize, availableTables);
        validCombos.sort(java.util.Comparator.comparingInt(combo -> combo.stream().mapToInt(Integer::intValue).sum()));

        for (List<Integer> combo : validCombos) {
            for (Integer t : combo) {
                availableTables.remove(t);
            }
            
            if (assignBacktrack(groups, groupIndex + 1, availableTables)) {
                return true;
            }
            
            availableTables.addAll(combo);
            availableTables.sort(java.util.Collections.reverseOrder());
        }
        return false;
    }

    private List<List<Integer>> findValidTableCombos(int target, List<Integer> availableTables) {
        List<List<Integer>> results = new java.util.ArrayList<>();
        findSubsets(availableTables, target, 0, new java.util.ArrayList<>(), results, 0);
        
        java.util.Set<List<Integer>> uniqueResults = new java.util.HashSet<>();
        for (List<Integer> result : results) {
            List<Integer> copy = new java.util.ArrayList<>(result);
            java.util.Collections.sort(copy);
            uniqueResults.add(copy);
        }
        return new java.util.ArrayList<>(uniqueResults);
    }

    private void findSubsets(List<Integer> tables, int target, int currentSum, List<Integer> currentSubset, List<List<Integer>> results, int startIndex) {
        if (currentSum >= target) {
            results.add(new java.util.ArrayList<>(currentSubset));
            return;
        }
        for (int i = startIndex; i < tables.size(); i++) {
            currentSubset.add(tables.get(i));
            findSubsets(tables, target, currentSum + tables.get(i), currentSubset, results, i + 1);
            currentSubset.remove(currentSubset.size() - 1);
        }
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
