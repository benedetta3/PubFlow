package com.pubflow.config;

import com.pubflow.model.entity.TavoloEntity;
import com.pubflow.model.repository.OrdineRepository;
import com.pubflow.model.repository.PrenotazioneRepository;
import com.pubflow.model.repository.TavoloRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataCleanupRunner implements ApplicationRunner {

    private final OrdineRepository ordineRepository;
    private final PrenotazioneRepository prenotazioneRepository;
    private final TavoloRepository tavoloRepository;

    @Override
    public void run(ApplicationArguments args) {
        log.info("Esecuzione pulizia dati all'avvio: rimozione ordini e prenotazioni, reset stato tavoli...");

        try {
            // 1. Elimina tutti gli ordini (cascade elimina anche gli OrdineItem)
            ordineRepository.deleteAll();
            log.info("Tutti gli ordini sono stati rimossi.");

            // 2. Elimina tutte le prenotazioni
            prenotazioneRepository.deleteAll();
            log.info("Tutte le prenotazioni sono state rimosse.");

            // 3. Reset stato tavoli a LIBERO e rigenera codici segreti
            List<TavoloEntity> tavoli = tavoloRepository.findAll();
            java.util.Random random = new java.util.Random();
            for (TavoloEntity tavolo : tavoli) {
                tavolo.setStato("LIBERO");
                int code = 1000 + random.nextInt(9000); // 1000 to 9999
                tavolo.setCodiceSegreto(String.valueOf(code));
            }
            tavoloRepository.saveAll(tavoli);
            log.info("Stato dei tavoli resettato a LIBERO e nuovi codici segreti generati.");

        } catch (Exception e) {
            log.error("Errore durante la pulizia dei dati all'avvio: {}", e.getMessage(), e);
        }
        
        log.info("Pulizia dati completata.");
    }
}
