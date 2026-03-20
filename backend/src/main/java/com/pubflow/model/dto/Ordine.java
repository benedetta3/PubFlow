package com.pubflow.model.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class Ordine {
    private Long id;
    private Integer numeroOrdine;
    private LocalDateTime dataOra;

    @NotNull
    private String tipoOrdine;   // TAVOLO, ASPORTO, DOMICILIO

    private String stato;        // RICEVUTO, IN_PREPARAZIONE, PRONTO, CONSEGNATO
    private BigDecimal totale;
    private String telefonoCliente;
    private Integer numeroTavolo;       // solo se TAVOLO
    private String indirizzoConsegna;  // solo se DOMICILIO

    @NotNull
    @NotEmpty
    private List<OrdineItem> items;
}
