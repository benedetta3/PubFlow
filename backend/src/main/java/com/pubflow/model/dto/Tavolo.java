package com.pubflow.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Tavolo {
    private Long id;
    private Integer numero;
    private Integer capienza;
    private String stato;
}
