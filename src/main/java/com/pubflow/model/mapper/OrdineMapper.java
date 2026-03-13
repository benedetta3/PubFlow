package com.pubflow.model.mapper;

import com.pubflow.model.dto.Ordine;
import com.pubflow.model.dto.OrdineItem;
import com.pubflow.model.entity.OrdineEntity;
import com.pubflow.model.entity.OrdineItemEntity;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class OrdineMapper {

    private final OrdineItemMapper ordineItemMapper;

    public OrdineMapper(OrdineItemMapper ordineItemMapper) {
        this.ordineItemMapper = ordineItemMapper;
    }

    // Conversione da Entity a DTO
    public Ordine toDto(OrdineEntity entity) {
        if (entity == null) {
            return null;
        }
        Ordine dto = new Ordine();
        dto.setId(entity.getId());
        dto.setNumeroOrdine(entity.getNumeroOrdine());
        dto.setDataOra(entity.getDataOra());
        dto.setTipoOrdine(entity.getTipoOrdine());
        dto.setStato(entity.getStato());
        dto.setTotale(entity.getTotale());
        dto.setTelefonoCliente(entity.getTelefonoCliente());
        dto.setNumeroTavolo(entity.getNumeroTavolo());
        dto.setIndirizzoConsegna(entity.getIndirizzoConsegna());
        if (entity.getItems() != null) {
            List<OrdineItem> items = entity.getItems().stream()
                    .map(ordineItemMapper::toDto)
                    .toList();
            dto.setItems(items);
        }
        return dto;
    }

    // Conversione da DTO a Entity
    public OrdineEntity toEntity(Ordine dto) {
        if (dto == null) {
            return null;
        }
        OrdineEntity entity = new OrdineEntity();
        entity.setId(dto.getId());
        entity.setNumeroOrdine(dto.getNumeroOrdine());
        entity.setDataOra(dto.getDataOra());
        entity.setTipoOrdine(dto.getTipoOrdine());
        entity.setStato(dto.getStato());
        entity.setTotale(dto.getTotale());
        entity.setTelefonoCliente(dto.getTelefonoCliente());
        entity.setNumeroTavolo(dto.getNumeroTavolo());
        entity.setIndirizzoConsegna(dto.getIndirizzoConsegna());
        if (dto.getItems() != null) {
            List<OrdineItemEntity> items = dto.getItems().stream()
                    .map(ordineItemMapper::toEntity)
                    .toList();
            entity.setItems(items);
        }
        return entity;
    }
}
