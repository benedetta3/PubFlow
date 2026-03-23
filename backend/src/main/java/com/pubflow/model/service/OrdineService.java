package com.pubflow.model.service;

import com.pubflow.model.dto.Ordine;
import com.pubflow.model.dto.OrdineItem;
import com.pubflow.model.entity.MenuItemEntity;
import com.pubflow.model.entity.OrdineEntity;
import com.pubflow.model.entity.OrdineItemEntity;
import com.pubflow.model.mapper.OrdineMapper;
import com.pubflow.model.repository.MenuItemRepository;
import com.pubflow.model.repository.OrdineRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrdineService {

    private final OrdineMapper ordineMapper;
    private final OrdineRepository ordineRepository;
    private final MenuItemRepository menuItemRepository;
    private final TavoloService tavoloService;

    // Recupera tutti gli ordini
    public List<Ordine> getAll() {
        return ordineRepository.findAll()
                .stream().map(ordineMapper::toDto).toList();
    }

    // Recupera un ordine per id
    public Ordine getById(Long id) {
        return ordineRepository.findById(id)
                .map(ordineMapper::toDto)
                .orElse(null);
    }

    // Tracking: recupera ordine per numero ordine (mostrato al cliente) — con cache
    @Cacheable("ordineNumeroCache")
    public Ordine getByNumeroOrdine(Integer numeroOrdine) {
        log.info("Tracking ordine numero: {}", numeroOrdine);
        return ordineRepository.findByNumeroOrdine(numeroOrdine)
                .map(ordineMapper::toDto)
                .orElse(null);
    }

    // Tracking: recupera ordini per numero di telefono
    public List<Ordine> getByTelefono(String telefono) {
        log.info("Tracking ordini per telefono: {}", telefono);
        return ordineRepository.findByTelefonoCliente(telefono)
                .stream().map(ordineMapper::toDto).toList();
    }

    // Recupera tutti gli ordini per stato (es. per il personale del pub)
    public List<Ordine> getByStato(String stato) {
        return ordineRepository.findByStato(stato)
                .stream().map(ordineMapper::toDto).toList();
    }

    // Crea un nuovo ordine
    public Ordine save(Ordine ordine) {
        OrdineEntity entity = new OrdineEntity();
        entity.setDataOra(LocalDateTime.now());
        entity.setNomeCliente(ordine.getNomeCliente());
        entity.setTipoOrdine(ordine.getTipoOrdine());
        entity.setStato("RICEVUTO");
        entity.setTelefonoCliente(ordine.getTelefonoCliente());
        entity.setNumeroTavolo(ordine.getNumeroTavolo());
        entity.setIndirizzoConsegna(ordine.getIndirizzoConsegna());

        if ("TAVOLO".equalsIgnoreCase(ordine.getTipoOrdine()) && ordine.getNumeroTavolo() != null) {
            tavoloService.aggiornaStato(ordine.getNumeroTavolo(), "OCCUPATO");
        }

        // Costruisce gli OrdineItem e calcola il totale
        List<OrdineItemEntity> items = new ArrayList<>();
        BigDecimal totale = BigDecimal.ZERO;

        for (OrdineItem itemDto : ordine.getItems()) {
            MenuItemEntity menuItem = menuItemRepository.findById(itemDto.getMenuItemId())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "MenuItem non trovato con id: " + itemDto.getMenuItemId()));

            // Controlla disponibilità e inventario
            if (!menuItem.isDisponibile()) {
                throw new IllegalArgumentException("Il prodotto " + menuItem.getNome() + " non è attualmente disponibile.");
            }
            if (menuItem.getQuantitaDisponibile() != null) {
                if (itemDto.getQuantita() > menuItem.getQuantitaDisponibile()) {
                    throw new IllegalArgumentException("Quantità insufficiente in magazzino per " + menuItem.getNome() + ". Rimanenti: " + menuItem.getQuantitaDisponibile());
                }
                menuItem.setQuantitaDisponibile(menuItem.getQuantitaDisponibile() - itemDto.getQuantita());
            }

            OrdineItemEntity itemEntity = new OrdineItemEntity();
            itemEntity.setOrdine(entity);
            itemEntity.setMenuItem(menuItem);
            itemEntity.setQuantita(itemDto.getQuantita());
            itemEntity.setNote(itemDto.getNote());
            items.add(itemEntity);

            totale = totale.add(menuItem.getPrezzo().multiply(
                    BigDecimal.valueOf(itemDto.getQuantita())));
        }

        entity.setItems(items);
        entity.setTotale(totale);

        // Genera numero ordine progressivo semplice
        long count = ordineRepository.count();
        entity.setNumeroOrdine((int) (count + 1));

        log.info("Nuovo ordine creato - tipo: {}, totale: {}", entity.getTipoOrdine(), entity.getTotale());
        return ordineMapper.toDto(ordineRepository.save(entity));
    }

    // Aggiorna lo stato di un ordine tramite query JPQL diretta
    // Invalida la cache per far vedere subito il nuovo stato al cliente
    @CacheEvict(value = "ordineNumeroCache", allEntries = true)
    public int aggiornaStato(Long id, String nuovoStato) {
        // Validazione flusso: RICEVUTO -> IN_PREPARAZIONE -> PRONTO -> IN_CONSEGNA -> CONSEGNATO
        OrdineEntity ordine = ordineRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ordine non trovato con id: " + id));

        String statoAttuale = ordine.getStato();
        if (!isTransizioneValida(statoAttuale, nuovoStato)) {
            throw new IllegalArgumentException(
                    "Transizione di stato non valida: " + statoAttuale + " -> " + nuovoStato);
        }

        log.info("Aggiornamento stato ordine id: {} -> {}", id, nuovoStato);
        return ordineRepository.updateStato(id, nuovoStato);
    }

    // Verifica che la transizione di stato sia nel flusso corretto
    private boolean isTransizioneValida(String statoAttuale, String nuovoStato) {
        return switch (statoAttuale) {
            case "RICEVUTO"        -> "IN_PREPARAZIONE".equals(nuovoStato);
            case "IN_PREPARAZIONE" -> "PRONTO".equals(nuovoStato);
            case "PRONTO"          -> "IN_CONSEGNA".equals(nuovoStato) || "CONSEGNATO".equals(nuovoStato);
            case "IN_CONSEGNA"     -> "CONSEGNATO".equals(nuovoStato);
            default -> false; // CONSEGNATO è stato finale
        };
    }

    // Elimina un ordine
    public void delete(Long id) {
        ordineRepository.deleteById(id);
    }

    // Paga tutti gli ordini attivi di un tavolo e libera il tavolo
    @CacheEvict(value = "ordineNumeroCache", allEntries = true)
    public int pagaOrdiniTavolo(Integer numeroTavolo) {
        log.info("Chiusura ordini (PAGATO) e liberazione per il tavolo: {}", numeroTavolo);
        tavoloService.aggiornaStato(numeroTavolo, "LIBERO");
        return ordineRepository.updateStatoPerTavolo(numeroTavolo, "PAGATO");
    }

    /** CLEAR CACHE **/

    @CacheEvict(value = "ordineNumeroCache", allEntries = true)
    @Scheduled(fixedRateString = "${caching.spring.ordineCacheTTL}")
    public void emptyOrdineCache() {
        log.info("Svuotamento cache ordineNumeroCache");
    }
}
