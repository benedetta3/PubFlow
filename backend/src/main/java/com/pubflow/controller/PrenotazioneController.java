package com.pubflow.controller;

import com.pubflow.exception.NotFoundException;
import com.pubflow.model.dto.Prenotazione;
import com.pubflow.model.service.PrenotazioneService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@Slf4j
@RequestMapping("/pubflow/prenotazioni")
@RequiredArgsConstructor
public class PrenotazioneController {

    private final PrenotazioneService prenotazioneService;

    // GET /pubflow/prenotazioni  -> tutte le prenotazioni
    @GetMapping
    public ResponseEntity<List<Prenotazione>> getAll() {
        List<Prenotazione> prenotazioni = prenotazioneService.getAll();
        return prenotazioni.isEmpty() ? ResponseEntity.noContent().build() : ResponseEntity.ok(prenotazioni);
    }

    // GET /pubflow/prenotazioni/{id}  -> singola prenotazione per id
    @GetMapping("/{id}")
    public ResponseEntity<Prenotazione> getById(@PathVariable Long id) {
        Prenotazione prenotazione = prenotazioneService.getById(id);
        if (prenotazione == null) {
            throw new NotFoundException("Prenotazione con id " + id);
        }
        return ResponseEntity.ok(prenotazione);
    }

    // GET /pubflow/prenotazioni/tracking/numero/{numero}  -> per numero prenotazione
    @GetMapping("/tracking/numero/{numero}")
    public ResponseEntity<Prenotazione> getByNumero(@PathVariable Integer numero) {
        Prenotazione prenotazione = prenotazioneService.getByNumeroPrenotazione(numero);
        if (prenotazione == null) {
            throw new NotFoundException("Prenotazione con numero " + numero);
        }
        return ResponseEntity.ok(prenotazione);
    }

    // GET /pubflow/prenotazioni/tracking/telefono/{telefono}  -> per telefono
    @GetMapping("/tracking/telefono/{telefono}")
    public ResponseEntity<List<Prenotazione>> getByTelefono(@PathVariable String telefono) {
        List<Prenotazione> prenotazioni = prenotazioneService.getByTelefono(telefono);
        return prenotazioni.isEmpty() ? ResponseEntity.noContent().build() : ResponseEntity.ok(prenotazioni);
    }

    // GET /pubflow/prenotazioni/data/{data}  -> prenotazioni di un giorno (yyyy-MM-dd)
    @GetMapping("/data/{data}")
    public ResponseEntity<List<Prenotazione>> getByData(@PathVariable String data) {
        List<Prenotazione> prenotazioni = prenotazioneService.getByData(LocalDate.parse(data));
        return prenotazioni.isEmpty() ? ResponseEntity.noContent().build() : ResponseEntity.ok(prenotazioni);
    }

    // POST /pubflow/prenotazioni  -> crea nuova prenotazione
    @PostMapping
    public ResponseEntity<?> create(@jakarta.validation.Valid @RequestBody Prenotazione prenotazione) {
        try {
            Prenotazione created = prenotazioneService.save(prenotazione);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(java.util.Collections.singletonMap("error", e.getMessage()));
        }
    }

    // PATCH /pubflow/prenotazioni/{id}/stato  -> aggiorna stato
    @PatchMapping("/{id}/stato")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<Integer> aggiornaStato(@PathVariable Long id, @RequestParam String stato) {
        int updated = prenotazioneService.aggiornaStato(id, stato);
        if (updated == 0) {
            throw new NotFoundException("Prenotazione con id " + id);
        }
        return ResponseEntity.ok(updated);
    }

    // DELETE /pubflow/prenotazioni/{id}  -> elimina prenotazione
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        Prenotazione prenotazione = prenotazioneService.getById(id);
        if (prenotazione == null) {
            throw new NotFoundException("Prenotazione con id " + id);
        }
        prenotazioneService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
