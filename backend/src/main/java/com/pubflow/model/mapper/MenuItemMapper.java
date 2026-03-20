package com.pubflow.model.mapper;

import com.pubflow.model.dto.MenuItem;
import com.pubflow.model.entity.MenuItemEntity;
import org.springframework.stereotype.Component;

@Component
public class MenuItemMapper {

    // Conversione da Entity a DTO
    public MenuItem toDto(MenuItemEntity entity) {
        if (entity == null) {
            return null;
        }
        MenuItem dto = new MenuItem();
        dto.setId(entity.getId());
        dto.setNome(entity.getNome());
        dto.setDescrizione(entity.getDescrizione());
        dto.setPrezzo(entity.getPrezzo());
        dto.setCategoria(entity.getCategoria());
        dto.setDisponibile(entity.isDisponibile());
        dto.setQuantitaDisponibile(entity.getQuantitaDisponibile());
        dto.setCustom(entity.getCustom());
        return dto;
    }

    // Conversione da DTO a Entity
    public MenuItemEntity toEntity(MenuItem dto) {
        if (dto == null) {
            return null;
        }
        MenuItemEntity entity = new MenuItemEntity();
        entity.setId(dto.getId());
        entity.setNome(dto.getNome());
        entity.setDescrizione(dto.getDescrizione());
        entity.setPrezzo(dto.getPrezzo());
        entity.setCategoria(dto.getCategoria());
        entity.setDisponibile(dto.isDisponibile());
        entity.setQuantitaDisponibile(dto.getQuantitaDisponibile());
        entity.setCustom(dto.getCustom());
        return entity;
    }
}
