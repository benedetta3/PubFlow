package com.pubflow.config;

import com.pubflow.model.entity.MenuItemEntity;
import com.pubflow.model.entity.TavoloEntity;
import com.pubflow.model.repository.MenuItemRepository;
import com.pubflow.model.repository.OrdineRepository;
import com.pubflow.model.repository.PrenotazioneRepository;
import com.pubflow.model.repository.TavoloRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Configuration
public class DataSeeder {

    @Bean
    public org.springframework.boot.CommandLineRunner seedData(
            MenuItemRepository menuItemRepository,
            TavoloRepository tavoloRepository,
            OrdineRepository ordineRepository,
            PrenotazioneRepository prenotazioneRepository,
            com.pubflow.model.repository.UtenteRepository utenteRepository,
            org.springframework.security.crypto.password.PasswordEncoder passwordEncoder
    ) {
        return args -> {
            if (utenteRepository.findByUsername("betcal").isEmpty()) {
                utenteRepository.save(com.pubflow.model.entity.UtenteEntity.builder()
                        .nome("Benedetta")
                        .cognome("Calonico")
                        .username("betcal")
                        .password(passwordEncoder.encode("pub3"))
                        .passwordVisibile("pub3")
                        .ruolo("ROLE_ADMIN")
                        .build());
            }

            // Aggiungi staff predefinito se non esistono (Mario Rossi, Cristina Antonucci, Emanuele Bianchi)
            String[][] defaultStaff = {
                    {"Mario", "Rossi", "marros"},
                    {"Cristina", "Antonucci", "crisant"},
                    {"Emanuele", "Bianchi", "emabian"}
            };
            java.util.Random rand = new java.util.Random();
            for (String[] staffData : defaultStaff) {
                if (utenteRepository.findByUsername(staffData[2]).isEmpty()) {
                    // Genera password 4 lettere 1 numero
                    StringBuilder sb = new StringBuilder();
                    for (int i=0; i<4; i++) sb.append((char) (rand.nextInt(26) + 'a'));
                    sb.append(rand.nextInt(10));
                    String pwd = sb.toString();

                    utenteRepository.save(com.pubflow.model.entity.UtenteEntity.builder()
                            .nome(staffData[0])
                            .cognome(staffData[1])
                            .username(staffData[2])
                            .password(passwordEncoder.encode(pwd))
                            .passwordVisibile(pwd)
                            .ruolo("ROLE_STAFF")
                            .build());
                }
            }
            if (ordineRepository.count() > 0) {
                ordineRepository.deleteAll();
            }
            if (prenotazioneRepository.count() > 0) {
                prenotazioneRepository.deleteAll();
            }

            List<TavoloEntity> tavoli = tavoloRepository.findAll();
            if (tavoli.isEmpty()) {
                tavoloRepository.saveAll(defaultTavoli());
            } else {
                tavoli.forEach(tavolo -> tavolo.setStato("LIBERO"));
                tavoloRepository.saveAll(tavoli);
            }

            List<MenuItemEntity> baseMenu = defaultMenu();
            if (menuItemRepository.count() == 0) {
                menuItemRepository.saveAll(baseMenu);
            }

            List<String> baseNames = baseMenu.stream()
                    .map(MenuItemEntity::getNome)
                    .map(String::toLowerCase)
                    .toList();

            List<MenuItemEntity> existingMenu = menuItemRepository.findAll();
            List<MenuItemEntity> toDelete = new ArrayList<>();
            boolean needsUpdate = false;

            for (MenuItemEntity item : existingMenu) {
                if (item.getNome() != null && item.getNome().equalsIgnoreCase("coc")) {
                    toDelete.add(item);
                    continue;
                }
                if (item.getCustom() == null) {
                    boolean isBase = baseNames.contains(item.getNome().toLowerCase());
                    item.setCustom(!isBase);
                    needsUpdate = true;
                }
            }

            if (!toDelete.isEmpty()) {
                menuItemRepository.deleteAll(toDelete);
                existingMenu.removeAll(toDelete);
            }
            if (needsUpdate) {
                menuItemRepository.saveAll(existingMenu);
            }
        };
    }

    private List<TavoloEntity> defaultTavoli() {
        return List.of(
                TavoloEntity.builder().numero(1).capienza(4).stato("LIBERO").build(),
                TavoloEntity.builder().numero(2).capienza(4).stato("LIBERO").build(),
                TavoloEntity.builder().numero(3).capienza(4).stato("LIBERO").build(),
                TavoloEntity.builder().numero(4).capienza(4).stato("LIBERO").build(),
                TavoloEntity.builder().numero(5).capienza(6).stato("LIBERO").build(),
                TavoloEntity.builder().numero(6).capienza(6).stato("LIBERO").build(),
                TavoloEntity.builder().numero(7).capienza(6).stato("LIBERO").build(),
                TavoloEntity.builder().numero(8).capienza(10).stato("LIBERO").build(),
                TavoloEntity.builder().numero(9).capienza(10).stato("LIBERO").build()
        );
    }

    private List<MenuItemEntity> defaultMenu() {
        List<MenuItemEntity> menu = new ArrayList<>();
        menu.add(menuItem("Birra Artigianale", "IPA locale 33cl", 5.50, "BIRRE", true, 24));
        menu.add(menuItem("Birra Rossa", "Strong ale 50cl", 6.50, "BIRRE", true, 18));
        menu.add(menuItem("Birra Lager", "Bionda 50cl", 4.50, "BIRRE", true, 30));
        menu.add(menuItem("Leffe Rouge", "Birra d'Abbazia 33cl, vol 6,6%", 5.50, "BIRRE", true, 20));
        menu.add(menuItem("Leffe Blonde", "Birra d'Abbazia 33cl, vol 6,6%", 5.00, "BIRRE", true, 20));
        menu.add(menuItem("Black Angus", "Panino al sesamo, hamburger Black Angus 200gr, cheddar, pomodoro, lattuga, bacon croccante, salsa irlandese, patatine rosse dolci", 15.00, "PANINI", true, 10));
        menu.add(menuItem("Smokey Burger", "Hamburger 170gr, mozzarella di bufala Campana D.O.P., bacon croccante, salsa smokey, pomodoro, lattuga, crema di pecorino molisano", 12.00, "PANINI", true, 12));
        menu.add(menuItem("DCLAPS", "Panino al sesamo, hamburger home-made 170gr, mortadella al pistacchio I.G.P., rucola, burratina DOP 125gr, crema al pistacchio di Bronte, granella di pistacchio", 12.00, "PANINI", true, 8));
        menu.add(menuItem("Double P.", "Doppio hamburger 170gr, doppia scamorza affumicata, doppia pancetta, pomodoro, maionese, salsa barbecue, tabasco", 12.00, "PANINI", true, 9));
        menu.add(menuItem("Big Pepito", "Hamburger home-made 170gr, doppia scamorza affumicata, pancetta arrotolata, bacon affumicato, pomodoro, maionese, salsa barbecue, tabasco", 8.00, "PANINI", true, 11));
        menu.add(menuItem("Pepito", "Hamburger home-made 170gr, scamorza affumicata, pancetta arrotolata, pomodoro, maionese", 6.00, "PANINI", true, 14));
        menu.add(menuItem("Bufalo Bill", "Panino al sesamo, hamburger di bufalo 200gr, maionese al pepe nero, mozzarella di bufala, pomodoro, lattuga, salsa BBQ, porzione di patate dippers", 15.00, "PANINI", true, 6));
        menu.add(menuItem("Eddie Rocket's", "Panino al sesamo, hamburger 170gr, doppio cheddar, pomodoro, lattuga, anelli di cipolla, bacon, maionese, salsa BBQ", 9.00, "PANINI", true, 10));
        menu.add(menuItem("Tartufo Burger", "Hamburger 170gr, salsa tartufata, maionese al pepe nero, guanciale, uovo all'occhio di bue, scaglie di parmigiano, lattuga, porzione di patate buccia", 15.00, "PANINI", true, 7));
        menu.add(menuItem("Bacon Burger", "Hamburger home-made 180gr, bacon croccante, formaggio cheddar, pomodoro, lattuga, maionese, salsa BBQ", 8.00, "PANINI", true, 12));
        menu.add(menuItem("Queso", "Hamburger home-made 180gr, scamorza affumicata, Philadelphia, mozzarella, maionese", 6.00, "PANINI", true, 9));
        menu.add(menuItem("Patate Rosse", "Dritte dall'America, patate rosse 100% naturali, croccanti, saporite e fuori dal comune", 5.00, "FRITTI", true, 20));
        menu.add(menuItem("Chicken Chips", "6 croccanti chips di filetto di pollo panate", 3.50, "FRITTI", true, 18));
        menu.add(menuItem("Philadelphia's Crispy", "10 palline di Philadelphia ed erba cipollina", 4.00, "FRITTI", true, 16));
        menu.add(menuItem("Mini Corn Dog", "Mini wurstel pastellati croccanti (4 pz)", 3.00, "FRITTI", true, 14));
        menu.add(menuItem("Supplìcini", "Bocconcini di riso al pomodoro con cuore di mozzarella filante (6 pz)", 4.00, "FRITTI", true, 12));
        menu.add(menuItem("Spiedino di Pollo BBQ", "Spiedino di pollo alla piastra marinato in salsa BBQ", 4.00, "FRITTI", true, 10));
        menu.add(menuItem("Green Heroes Chikn Nuggets Vegano", "6 pezzi", 4.00, "FRITTI", false, 0));
        menu.add(menuItem("Alette di Pollo", "5 alette di pollo speziate alla paprika", 5.50, "FRITTI", true, 12));
        menu.add(menuItem("Anelli di cipolla", "8 anelli di cipolla pastellati", 3.50, "FRITTI", true, 18));
        menu.add(menuItem("Bandidos", "7 straccetti di pollo panati al BBQ", 5.50, "FRITTI", true, 10));
        menu.add(menuItem("Cheddar Nuggets", "6 bocconcini di formaggio cheddar con pezzi di peperoncino jalapeno", 3.50, "FRITTI", true, 14));
        menu.add(menuItem("Chele di granchio", "5 chele di granchio panate", 4.00, "FRITTI", true, 12));
        menu.add(menuItem("Jalapeno", "6 bocconcini di formaggio cremoso con pezzetti di peperoncino jalapeno", 3.50, "FRITTI", true, 12));
        menu.add(menuItem("Mozza Sticks al Bacon", "4 stick di mozzarella panati e ricoperti di bacon croccante", 5.00, "FRITTI", true, 10));
        menu.add(menuItem("Mozza Stick", "4 stick di mozzarella panati", 4.00, "FRITTI", true, 12));
        menu.add(menuItem("Mozzarelle Panate", "6 bocconcini di mozzarella panati", 3.50, "FRITTI", true, 16));
        menu.add(menuItem("Turkey Toast", "Pane tostato con tacchino e cheddar", 3.00, "FRITTI", true, 12));
        menu.add(menuItem("Salami Toast", "Pane tostato con schiacciata e scamorza", 3.00, "FRITTI", true, 12));
        menu.add(menuItem("Veggie Toast", "Pane tostato con rucola, scamorza e cheddar", 3.00, "FRITTI", true, 12));
        menu.add(menuItem("Meteoritos", "Filetto di pollo avvolto in una croccante panatura speziata", 5.00, "FRITTI", true, 10));
        menu.add(menuItem("Patata Twister", "Patata speziata alla paprika dolce tagliata a cavatappi", 4.00, "FRITTI", true, 16));
        menu.add(menuItem("Tris Salse Heinz", "Bustina ketchup 11g, bustina BBQ 9g, bustina mayo 9,5g", 0.30, "FRITTI", true, 30));
        menu.add(menuItem("Patatina Stick 13x13", "Patatina tagliata a bastoncino extra crunch", 3.50, "FRITTI", true, 22));
        menu.add(menuItem("Patatina Dippers", "Patata al naturale tagliata a ricciolo con buccia", 3.50, "FRITTI", true, 20));
        menu.add(menuItem("Gnocchi Fritti", "Gnocchi di patata fritti", 3.50, "FRITTI", true, 18));
        menu.add(menuItem("Acqua Naturale", "Bottiglia da 500cc", 1.50, "BEVANDE", true, 50));
        menu.add(menuItem("Ferrarelle", "Bottiglia da 0,5 cl", 1.50, "BEVANDE", true, 40));
        menu.add(menuItem("Coca Cola", "Bottiglia vetro da 0,33 cl", 2.50, "BEVANDE", true, 45));
        menu.add(menuItem("Coca Cola Zero", "Bottiglia vetro da 0,33 cl", 2.50, "BEVANDE", true, 40));
        menu.add(menuItem("Fanta", "Bottiglia vetro da 0,33 cl", 2.50, "BEVANDE", true, 40));
        menu.add(menuItem("Sprite", "Bottiglia vetro da 0,33 cl", 2.50, "BEVANDE", true, 40));
        menu.add(menuItem("Soufflé Cioccolato", "Tortino al cacao con un cuore fuso di cioccolato fondente", 4.00, "DOLCI", true, 12));
        menu.add(menuItem("Moonshine", "Panino con crema di pistacchio, crema al cioccolato bianco, Cocopops e Twix", 4.00, "DOLCI", true, 10));
        menu.add(menuItem("Tiramisù", "Deliziosa crema di mascarpone e pan di spagna imbevuto al caffè", 4.00, "DOLCI", false, 0));
        return menu;
    }

    private MenuItemEntity menuItem(
            String nome,
            String descrizione,
            double prezzo,
            String categoria,
            boolean disponibile,
            int quantitaDisponibile
    ) {
        MenuItemEntity item = new MenuItemEntity();
        item.setNome(nome);
        item.setDescrizione(descrizione);
        item.setPrezzo(BigDecimal.valueOf(prezzo));
        item.setCategoria(categoria);
        item.setDisponibile(disponibile);
        item.setQuantitaDisponibile(quantitaDisponibile);
        item.setCustom(false);
        return item;
    }
}
