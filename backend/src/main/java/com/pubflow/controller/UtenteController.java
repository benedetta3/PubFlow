package com.pubflow.controller;

import com.pubflow.model.dto.UtenteDto;
import com.pubflow.model.service.UtenteService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/pubflow/admin/staff")
@RequiredArgsConstructor
@Slf4j
public class UtenteController {

    private final UtenteService utenteService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UtenteDto>> getAllStaff() {
        List<UtenteDto> staff = utenteService.getTuttoLoStaff();
        return ResponseEntity.ok(staff);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UtenteDto> assumiStaff(@RequestBody UtenteDto request) {
        if (request.getNome() == null || request.getCognome() == null) {
            return ResponseEntity.badRequest().build();
        }
        UtenteDto assunto = utenteService.assumi(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(assunto);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> licenziaStaff(@PathVariable Long id) {
        utenteService.licenzia(id);
        return ResponseEntity.noContent().build();
    }
}
