package com.pubflow.model.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class Prenotazione {
    private Long id;
    private Integer numeroPrenotazione;

    @NotBlank
    private String nomeCliente;

    @NotBlank
    private String telefonoCliente;

    @NotNull
    @Min(1)
    private Integer numeroPersone;

    @NotNull
    private LocalDate data;

    @NotNull
    private LocalTime ora;

    private String stato;  // CONFERMATA, ANNULLATA, COMPLETATA
}
