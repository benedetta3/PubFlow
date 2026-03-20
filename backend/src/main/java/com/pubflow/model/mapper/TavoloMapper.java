package com.pubflow.model.mapper;

import com.pubflow.model.dto.Tavolo;
import com.pubflow.model.entity.TavoloEntity;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class TavoloMapper {
    
    public Tavolo toDto(TavoloEntity entity) {
        if (entity == null) return null;
        return Tavolo.builder()
                .id(entity.getId())
                .numero(entity.getNumero())
                .capienza(entity.getCapienza())
                .stato(entity.getStato())
                .build();
    }
    
    public TavoloEntity toEntity(Tavolo dto) {
        if (dto == null) return null;
        return TavoloEntity.builder()
                .id(dto.getId())
                .numero(dto.getNumero())
                .capienza(dto.getCapienza())
                .stato(dto.getStato())
                .build();
    }
    
    public List<Tavolo> toDtoList(List<TavoloEntity> entities) {
        if (entities == null) return null;
        return entities.stream().map(this::toDto).collect(Collectors.toList());
    }
}
