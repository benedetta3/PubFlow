package com.pubflow.model.service;

import com.pubflow.model.dto.MenuItem;
import com.pubflow.model.entity.MenuItemEntity;
import com.pubflow.model.mapper.MenuItemMapper;
import com.pubflow.model.repository.MenuItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class MenuItemService {

    private final MenuItemMapper menuItemMapper;
    private final MenuItemRepository menuItemRepository;

    // Recupera tutti i prodotti del menu
    public List<MenuItem> getAll() {
        return menuItemRepository.findAll()
                .stream().map(menuItemMapper::toDto).toList();
    }

    // Recupera solo i prodotti disponibili
    public List<MenuItem> getDisponibili() {
        return menuItemRepository.findByDisponibileTrueAndQuantitaDisponibileGreaterThan(0)
                .stream().map(menuItemMapper::toDto).toList();
    }

    // Recupera tutti i prodotti per categoria (con cache)
    @Cacheable("menuCategoriaCache")
    public List<MenuItem> getByCategoria(String categoria) {
        log.info("Ricerca prodotti per categoria: {}", categoria);
        return menuItemRepository.findByCategoria(categoria)
                .stream().map(menuItemMapper::toDto).toList();
    }

    // Recupera un prodotto per id
    public MenuItem getById(Long id) {
        return menuItemRepository.findById(id)
                .map(menuItemMapper::toDto)
                .orElse(null);
    }

    // Salva un nuovo prodotto
    public MenuItem save(MenuItem menuItem) {
        MenuItemEntity entity = menuItemMapper.toEntity(menuItem);
        entity.setCustom(true);
        normalizeDisponibilita(entity);
        return menuItemMapper.toDto(menuItemRepository.save(entity));
    }

    // Aggiorna un prodotto esistente
    public MenuItem update(Long id, MenuItem menuItem) {
        MenuItemEntity existing = menuItemRepository.findById(id).orElse(null);
        if (existing == null) {
            return null;
        }
        MenuItemEntity entity = menuItemMapper.toEntity(menuItem);
        entity.setId(id);
        entity.setCustom(existing.getCustom());
        normalizeDisponibilita(entity);
        return menuItemMapper.toDto(menuItemRepository.save(entity));
    }

    // Elimina un prodotto
    public void delete(Long id) {
        menuItemRepository.deleteById(id);
    }

    // Recupera i prodotti con paginazione e ordinamento
    public Page<MenuItem> getByPage(Pageable pageable) {
        return menuItemRepository.findAll(pageable)
                .map(menuItemMapper::toDto);
    }

    /** CLEAR CACHE **/

    @CacheEvict(value = "menuCategoriaCache", allEntries = true)
    @Scheduled(fixedRateString = "${caching.spring.menuCacheTTL}")
    public void emptyMenuCategoriaCache() {
        log.info("Svuotamento cache menuCategoriaCache");
    }

    private void normalizeDisponibilita(MenuItemEntity entity) {
        Integer quantita = entity.getQuantitaDisponibile();
        if (quantita != null && quantita <= 0) {
            entity.setDisponibile(false);
        }
    }
}
