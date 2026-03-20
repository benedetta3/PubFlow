package com.pubflow.model.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "tavoli")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TavoloEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Integer numero;

    @Column(nullable = false)
    private Integer capienza;

    @Column(nullable = false)
    private String stato; // LIBERO, IN_ATTESA_CONFERMA, OCCUPATO

}
