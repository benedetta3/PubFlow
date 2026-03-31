package com.pubflow.model.service;

import com.pubflow.model.dto.UtenteDto;
import com.pubflow.model.entity.UtenteEntity;
import com.pubflow.model.mapper.UtenteMapper;
import com.pubflow.model.repository.UtenteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Random;

@Service
@RequiredArgsConstructor
@Slf4j
public class UtenteService {

    private final UtenteRepository utenteRepository;
    private final UtenteMapper utenteMapper;
    private final PasswordEncoder passwordEncoder;

    public List<UtenteDto> getTuttoLoStaff() {
        return utenteMapper.toDtoList(utenteRepository.findByRuolo("ROLE_STAFF"));
    }

    public UtenteDto assumi(UtenteDto request) {
        String nome = request.getNome().trim();
        String cognome = request.getCognome().trim();
        
        // Genera username: prime 3 lettere del nome + prime 3 del cognome
        String usernameBase = (nome.length() >= 3 ? nome.substring(0, 3) : nome) +
                              (cognome.length() >= 3 ? cognome.substring(0, 3) : cognome);
        usernameBase = usernameBase.toLowerCase();
        
        // Assicurati che non esista già
        String finalUsername = usernameBase;
        int counter = 1;
        while (utenteRepository.findByUsername(finalUsername).isPresent()) {
            finalUsername = usernameBase + counter;
            counter++;
        }

        // Genera password casuale: 4 minuscole, 1 numero
        String passwordGenerata = generaPasswordCasuale();

        UtenteEntity nuovoUtente = UtenteEntity.builder()
                .nome(nome)
                .cognome(cognome)
                .username(finalUsername)
                .password(passwordEncoder.encode(passwordGenerata))
                .passwordVisibile(passwordGenerata) 
                .ruolo("ROLE_STAFF")
                .build();

        nuovoUtente = utenteRepository.save(nuovoUtente);
        log.info("Assunto nuovo membro dello staff: {} {}", nome, cognome);
        return utenteMapper.toDto(nuovoUtente);
    }

    public void licenzia(Long id) {
        UtenteEntity utente = utenteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Utente non trovato"));
                
        if (!"ROLE_STAFF".equals(utente.getRuolo())) {
            throw new IllegalArgumentException("Puoi licenziare solo membri dello staff");
        }
        
        utenteRepository.delete(utente);
        utenteRepository.delete(utente);
        log.info("Licenziato utente con ID: {}", id);
    }

    private String generaPasswordCasuale() {
        Random random = new Random();
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 4; i++) {
            char c = (char) (random.nextInt(26) + 'a');
            sb.append(c);
        }
        sb.append(random.nextInt(10)); // 1 numero finale
        return sb.toString();
    }
}
