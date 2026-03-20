package com.pubflow.model.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "ordine_item")
@Data
public class OrdineItemEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "ordine_id")
    private OrdineEntity ordine;

    @ManyToOne
    @JoinColumn(name = "menu_item_id")
    private MenuItemEntity menuItem;

    @Column(name = "quantita")
    private Integer quantita;

    @Column(name = "note")
    private String note;
}
