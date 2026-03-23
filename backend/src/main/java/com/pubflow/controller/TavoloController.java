package com.pubflow.controller;

import com.pubflow.exception.NotFoundException;
import com.pubflow.model.dto.Tavolo;
import com.pubflow.model.service.TavoloService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@Slf4j
@RequestMapping("/pubflow/tavoli")
@RequiredArgsConstructor
public class TavoloController {

    private final TavoloService tavoloService;

    // GET /pubflow/tavoli  -> tutti i tavoli (per visualizzazione capienza)
    @GetMapping
    public ResponseEntity<List<Tavolo>> getAll() {
        List<Tavolo> tavoli = tavoloService.getAll();
        return tavoli.isEmpty() ? ResponseEntity.noContent().build() : ResponseEntity.ok(tavoli);
    }

    // GET /pubflow/tavoli/{numero}  -> stato di un singolo tavolo
    @GetMapping("/{numero}")
    public ResponseEntity<Tavolo> getByNumero(@PathVariable Integer numero) {
        Tavolo tavolo = tavoloService.getByNumero(numero);
        if (tavolo == null) {
            throw new NotFoundException("Tavolo con numero " + numero);
        }
        return ResponseEntity.ok(tavolo);
    }

    // GET /pubflow/tavoli/stato/{stato}  -> es. tavoli in attesa di conferma
    @GetMapping("/stato/{stato}")
    public ResponseEntity<List<Tavolo>> getByStato(@PathVariable String stato) {
        List<Tavolo> tavoli = tavoloService.getByStato(stato);
        return tavoli.isEmpty() ? ResponseEntity.noContent().build() : ResponseEntity.ok(tavoli);
    }

    // PATCH /pubflow/tavoli/{numero}/stato  -> aggiorna stato (STAFF)
    @PatchMapping("/{numero}/stato")
    public ResponseEntity<Boolean> aggiornaStato(@PathVariable Integer numero, @RequestParam String stato) {
        boolean updated = tavoloService.aggiornaStato(numero, stato);
        if (!updated) {
            throw new NotFoundException("Tavolo con numero " + numero);
        }
        return ResponseEntity.ok(true);
    }

    // POST /pubflow/tavoli/login  -> accesso cliente con codice segreto
    @PostMapping("/login")
    public ResponseEntity<?> loginCliente(@RequestParam String codice) {
        try {
            Tavolo tavolo = tavoloService.loginByCodice(codice);
            return ResponseEntity.ok(tavolo);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).body(java.util.Collections.singletonMap("error", e.getMessage()));
        }
    }
}
