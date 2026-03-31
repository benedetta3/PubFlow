package com.pubflow.model.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "utenti")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UtenteEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 50)
    private String nome;

    @Column(length = 50)
    private String cognome;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(name = "password_visibile")
    private String passwordVisibile;

    @Column(nullable = false, length = 20)
    private String ruolo; // Es: "ROLE_ADMIN", "ROLE_STAFF"
}
