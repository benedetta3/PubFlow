package com.pubflow.model.mapper;

import com.pubflow.model.dto.UtenteDto;
import com.pubflow.model.entity.UtenteEntity;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class UtenteMapper {

    public UtenteDto toDto(UtenteEntity entity) {
        if (entity == null) {
            return null;
        }

        return UtenteDto.builder()
                .id(entity.getId())
                .nome(entity.getNome())
                .cognome(entity.getCognome())
                .username(entity.getUsername())
                .passwordVisibile(entity.getPasswordVisibile())
                .ruolo(entity.getRuolo())
                .build();
    }

    public List<UtenteDto> toDtoList(List<UtenteEntity> entities) {
        if (entities == null) {
            return null;
        }
        return entities.stream()
                .map(this::toDto)
                .toList();
    }
}
