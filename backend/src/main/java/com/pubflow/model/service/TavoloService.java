package com.pubflow.model.service;

import com.pubflow.model.dto.Tavolo;
import com.pubflow.model.entity.TavoloEntity;
import com.pubflow.model.mapper.TavoloMapper;
import com.pubflow.model.repository.TavoloRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class TavoloService {
    private final TavoloRepository tavoloRepository;
    private final TavoloMapper tavoloMapper;

    public List<Tavolo> getAll() {
        return tavoloMapper.toDtoList(tavoloRepository.findAll());
    }

    public List<Tavolo> getByStato(String stato) {
        return tavoloMapper.toDtoList(tavoloRepository.findByStato(stato));
    }

    public Tavolo getByNumero(Integer numero) {
        return tavoloRepository.findByNumero(numero)
                .map(tavoloMapper::toDto)
                .orElse(null);
    }
    
    public boolean aggiornaStato(Integer numeroTavolo, String nuovoStato) {
        log.info("Aggiornamento stato tavolo {} a {}", numeroTavolo, nuovoStato);
        int updated = tavoloRepository.updateStato(numeroTavolo, nuovoStato);
        return updated > 0;
    }

    public Tavolo loginByCodice(String codice) {
        TavoloEntity tavolo = tavoloRepository.findByCodiceSegreto(codice)
                .orElseThrow(() -> new IllegalArgumentException("Codice segreto non valido"));
        
        if ("OCCUPATO".equalsIgnoreCase(tavolo.getStato())) {
            throw new IllegalArgumentException("Il tavolo è già occupato da un altro cliente");
        }
        
        tavolo.setStato("OCCUPATO");
        tavoloRepository.save(tavolo);
        log.info("Accesso cliente tramite codice segreto riuscito per tavolo: {}", tavolo.getNumero());
        return tavoloMapper.toDto(tavolo);
    }
}
