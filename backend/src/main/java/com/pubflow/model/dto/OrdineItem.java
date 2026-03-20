package com.pubflow.model.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class OrdineItem {
    private Long id;

    @NotNull
    private Long menuItemId;

    private String menuItemNome;

    @NotNull
    @Min(1)
    private Integer quantita;

    private String note;
}
