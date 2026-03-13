package com.pubflow.model.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "prenotazione")
@Data
public class PrenotazioneEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "numero_prenotazione", unique = true)
    private Integer numeroPrenotazione;

    @Column(name = "nome_cliente")
    private String nomeCliente;

    @Column(name = "telefono_cliente")
    private String telefonoCliente;

    @Column(name = "numero_persone")
    private Integer numeroPersone;

    @Column(name = "data")
    private LocalDate data;

    @Column(name = "ora")
    private LocalTime ora;

    // Stato: CONFERMATA, ANNULLATA, COMPLETATA
    @Column(name = "stato")
    private String stato;
}
