package com.pubflow.controller;

import com.pubflow.exception.NotFoundException;
import com.pubflow.model.dto.Ordine;
import com.pubflow.model.service.OrdineService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@Slf4j
@RequestMapping("/pubflow/ordini")
@RequiredArgsConstructor
public class OrdineController {

    private final OrdineService ordineService;

    // GET /pubflow/ordini  -> tutti gli ordini
    @GetMapping
    public ResponseEntity<List<Ordine>> getAll() {
        List<Ordine> ordini = ordineService.getAll();
        return ordini.isEmpty() ? ResponseEntity.noContent().build() : ResponseEntity.ok(ordini);
    }

    // GET /pubflow/ordini/{id}  -> singolo ordine per id
    @GetMapping("/{id}")
    public ResponseEntity<Ordine> getById(@PathVariable Long id) {
        Ordine ordine = ordineService.getById(id);
        if (ordine == null) {
            throw new NotFoundException("Ordine con id " + id);
        }
        return ResponseEntity.ok(ordine);
    }

    // GET /pubflow/ordini/tracking/numero/{numeroOrdine}  -> stato ordine per numero
    @GetMapping("/tracking/numero/{numeroOrdine}")
    public ResponseEntity<Ordine> getByNumeroOrdine(@PathVariable Integer numeroOrdine) {
        Ordine ordine = ordineService.getByNumeroOrdine(numeroOrdine);
        if (ordine == null) {
            throw new NotFoundException("Ordine con numero " + numeroOrdine);
        }
        return ResponseEntity.ok(ordine);
    }

    // GET /pubflow/ordini/tracking/telefono/{telefono}  -> ordini per telefono
    @GetMapping("/tracking/telefono/{telefono}")
    public ResponseEntity<List<Ordine>> getByTelefono(@PathVariable String telefono) {
        List<Ordine> ordini = ordineService.getByTelefono(telefono);
        return ordini.isEmpty() ? ResponseEntity.noContent().build() : ResponseEntity.ok(ordini);
    }

    // GET /pubflow/ordini/stato/{stato}  -> ordini per stato (uso interno pub)
    @GetMapping("/stato/{stato}")
    public ResponseEntity<List<Ordine>> getByStato(@PathVariable String stato) {
        List<Ordine> ordini = ordineService.getByStato(stato);
        return ordini.isEmpty() ? ResponseEntity.noContent().build() : ResponseEntity.ok(ordini);
    }

    // POST /pubflow/ordini  -> crea nuovo ordine
    @PostMapping
    public ResponseEntity<?> create(@jakarta.validation.Valid @RequestBody Ordine ordine) {
        try {
            Ordine created = ordineService.save(ordine);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(java.util.Collections.singletonMap("error", e.getMessage()));
        }
    }

    // PATCH /pubflow/ordini/{id}/stato  -> aggiorna stato ordine
    @PatchMapping("/{id}/stato")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<Integer> aggiornaStato(@PathVariable Long id, @RequestParam String stato) {
        int updated = ordineService.aggiornaStato(id, stato);
        if (updated == 0) {
            throw new NotFoundException("Ordine con id " + id);
        }
        return ResponseEntity.ok(updated);
    }

    // POST /pubflow/ordini/tavolo/{numero}/paga  -> paga e libera tutti gli ordini del tavolo
    @PostMapping("/tavolo/{numero}/paga")
    public ResponseEntity<Integer> pagaTavolo(@PathVariable Integer numero) {
        int updated = ordineService.pagaOrdiniTavolo(numero);
        return ResponseEntity.ok(updated);
    }

    // DELETE /pubflow/ordini/{id}  -> elimina ordine
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        Ordine ordine = ordineService.getById(id);
        if (ordine == null) {
            throw new NotFoundException("Ordine con id " + id);
        }
        ordineService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
