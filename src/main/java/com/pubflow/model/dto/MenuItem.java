package com.pubflow.model.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class MenuItem {
    private Long id;

    @NotBlank
    private String nome;

    private String descrizione;

    @NotNull
    @DecimalMin(value = "0.0", inclusive = false)
    private BigDecimal prezzo;

    @NotBlank
    private String categoria;

    private boolean disponibile;
}
