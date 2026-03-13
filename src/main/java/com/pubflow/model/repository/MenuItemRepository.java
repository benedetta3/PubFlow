package com.pubflow.model.repository;

import com.pubflow.model.entity.MenuItemEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MenuItemRepository extends JpaRepository<MenuItemEntity, Long> {

    // Trova tutti i prodotti di una categoria (es. "panini", "bibite")
    List<MenuItemEntity> findByCategoria(String categoria);

    // Trova solo i prodotti disponibili
    List<MenuItemEntity> findByDisponibileTrue();
}
