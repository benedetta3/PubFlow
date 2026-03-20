package com.pubflow.model.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "ordine")
@Data
public class OrdineEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "numero_ordine", unique = true)
    private Integer numeroOrdine;

    @Column(name = "data_ora")
    private LocalDateTime dataOra;

    // Tipo: TAVOLO, ASPORTO, DOMICILIO
    @Column(name = "tipo_ordine")
    private String tipoOrdine;

    // Stato: RICEVUTO, IN_PREPARAZIONE, PRONTO, IN_CONSEGNA, CONSEGNATO
    @Column(name = "stato")
    private String stato;

    @Column(name = "totale")
    private BigDecimal totale;

    @Column(name = "telefono_cliente")
    private String telefonoCliente;

    // Solo per tipo TAVOLO
    @Column(name = "numero_tavolo")
    private Integer numeroTavolo;

    // Solo per tipo DOMICILIO
    @Column(name = "indirizzo_consegna")
    private String indirizzoConsegna;

    @OneToMany(mappedBy = "ordine", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrdineItemEntity> items;
}
