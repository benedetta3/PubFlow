package com.pubflow.model.mapper;

import com.pubflow.model.dto.Prenotazione;
import com.pubflow.model.entity.PrenotazioneEntity;
import org.springframework.stereotype.Component;

@Component
public class PrenotazioneMapper {

    // Conversione da Entity a DTO
    public Prenotazione toDto(PrenotazioneEntity entity) {
        if (entity == null) {
            return null;
        }
        Prenotazione dto = new Prenotazione();
        dto.setId(entity.getId());
        dto.setNumeroPrenotazione(entity.getNumeroPrenotazione());
        dto.setNomeCliente(entity.getNomeCliente());
        dto.setTelefonoCliente(entity.getTelefonoCliente());
        dto.setNumeroPersone(entity.getNumeroPersone());
        dto.setData(entity.getData());
        dto.setOra(entity.getOra());
        dto.setStato(entity.getStato());
        return dto;
    }

    // Conversione da DTO a Entity
    public PrenotazioneEntity toEntity(Prenotazione dto) {
        if (dto == null) {
            return null;
        }
        PrenotazioneEntity entity = new PrenotazioneEntity();
        entity.setId(dto.getId());
        entity.setNumeroPrenotazione(dto.getNumeroPrenotazione());
        entity.setNomeCliente(dto.getNomeCliente());
        entity.setTelefonoCliente(dto.getTelefonoCliente());
        entity.setNumeroPersone(dto.getNumeroPersone());
        entity.setData(dto.getData());
        entity.setOra(dto.getOra());
        entity.setStato(dto.getStato());
        return entity;
    }
}
