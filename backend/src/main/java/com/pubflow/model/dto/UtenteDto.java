package com.pubflow.model.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UtenteDto {
    private Long id;
    
    @NotBlank
    private String nome;
    
    @NotBlank
    private String cognome;
    
    private String username;
    
    // Non restituiamo l'hash bcrypt al frontend, 
    // ma restituiamo (se admin) la password visibile per l'interfaccia.
    private String passwordVisibile;
    
    private String ruolo;
}
