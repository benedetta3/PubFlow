package com.pubflow.model.mapper;

import com.pubflow.model.dto.OrdineItem;
import com.pubflow.model.entity.MenuItemEntity;
import com.pubflow.model.entity.OrdineItemEntity;
import org.springframework.stereotype.Component;

@Component
public class OrdineItemMapper {

    // Mappa l'id e il nome del menuItem annidato nel DTO piatto
    public OrdineItem toDto(OrdineItemEntity entity) {
        if (entity == null) {
            return null;
        }
        OrdineItem dto = new OrdineItem();
        dto.setId(entity.getId());
        if (entity.getMenuItem() != null) {
            dto.setMenuItemId(entity.getMenuItem().getId());
            dto.setMenuItemNome(entity.getMenuItem().getNome());
        }
        dto.setQuantita(entity.getQuantita());
        return dto;
    }

    // Il mapping inverso (DTO -> Entity) non viene usato direttamente nel service,
    // perché l'item viene costruito manualmente per associare il menuItem corretto
    public OrdineItemEntity toEntity(OrdineItem dto) {
        if (dto == null) {
            return null;
        }
        OrdineItemEntity entity = new OrdineItemEntity();
        entity.setId(dto.getId());
        entity.setQuantita(dto.getQuantita());
        if (dto.getMenuItemId() != null) {
            MenuItemEntity menuItem = new MenuItemEntity();
            menuItem.setId(dto.getMenuItemId());
            entity.setMenuItem(menuItem);
        }
        return entity;
    }
}
