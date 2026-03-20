package com.pubflow.controller;

import com.pubflow.exception.NotFoundException;
import com.pubflow.model.dto.MenuItem;
import com.pubflow.model.service.MenuItemService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@Slf4j
@RequestMapping("/pubflow/menu")
@RequiredArgsConstructor
public class MenuItemController {

    private final MenuItemService menuItemService;

    // GET /pubflow/menu  -> tutti i prodotti
    @GetMapping
    public ResponseEntity<List<MenuItem>> getAll() {
        List<MenuItem> items = menuItemService.getAll();
        return items.isEmpty() ? ResponseEntity.noContent().build() : ResponseEntity.ok(items);
    }

    // GET /pubflow/menu/disponibili  -> solo i prodotti disponibili
    @GetMapping("/disponibili")
    public ResponseEntity<List<MenuItem>> getDisponibili() {
        List<MenuItem> items = menuItemService.getDisponibili();
        return items.isEmpty() ? ResponseEntity.noContent().build() : ResponseEntity.ok(items);
    }

    // GET /pubflow/menu/categoria/{categoria}  -> per categoria
    @GetMapping("/categoria/{categoria}")
    public ResponseEntity<List<MenuItem>> getByCategoria(@PathVariable String categoria) {
        List<MenuItem> items = menuItemService.getByCategoria(categoria);
        return items.isEmpty() ? ResponseEntity.noContent().build() : ResponseEntity.ok(items);
    }

    // GET /pubflow/menu/{id}  -> singolo prodotto
    @GetMapping("/{id}")
    public ResponseEntity<MenuItem> getById(@PathVariable Long id) {
        MenuItem item = menuItemService.getById(id);
        if (item == null) {
            throw new NotFoundException("MenuItem con id " + id);
        }
        return ResponseEntity.ok(item);
    }

    // POST /pubflow/menu  -> crea nuovo prodotto
    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<MenuItem> create(@jakarta.validation.Valid @RequestBody MenuItem menuItem) {
        MenuItem created = menuItemService.save(menuItem);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // PUT /pubflow/menu/{id}  -> aggiorna prodotto
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<MenuItem> update(@PathVariable Long id, @RequestBody MenuItem menuItem) {
        MenuItem existing = menuItemService.getById(id);
        if (existing == null) {
            throw new NotFoundException("MenuItem con id " + id);
        }
        return ResponseEntity.ok(menuItemService.update(id, menuItem));
    }

    // DELETE /pubflow/menu/{id}  -> elimina prodotto
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        MenuItem existing = menuItemService.getById(id);
        if (existing == null) {
            throw new NotFoundException("MenuItem con id " + id);
        }
        if (existing.getCustom() == null || !existing.getCustom()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        menuItemService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // GET /pubflow/menu/page?page=0&size=5&sortField=nome&sortDirection=asc  -> paginazione
    @GetMapping("/page")
    public ResponseEntity<Page<MenuItem>> getByPage(@RequestParam("page") int page,
                                    @RequestParam("size") int size,
                                    @RequestParam(value = "sortField") String sortField,
                                    @RequestParam(value = "sortDirection") String sortDirection) {
        Pageable pageable = PageRequest.of(page,
                size,
                Sort.by(sortDirection.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC,
                        sortField));
        return ResponseEntity.ok(menuItemService.getByPage(pageable));
    }
}
