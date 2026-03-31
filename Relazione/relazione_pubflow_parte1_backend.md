# 📘 Relazione PubFlow — Parte 1: Backend (Config, Entity, DTO, Mapper)

---

## 1. Cos'è PubFlow

PubFlow è un'applicazione web per gestire un pub chiamato "The Cave Pub". Permette di:
- **Clienti**: ordinare al tavolo (con codice segreto), fare asporto, domicilio, prenotare un tavolo
- **Staff**: gestire ordini (avanzare gli stati), gestire il menu (quantità, aggiunte, eliminazioni), vedere prenotazioni e la planimetria del locale

L'applicazione è divisa in **backend** (Java/Spring Boot, porta 8080) e **frontend** (Angular, porta 4200). Comunicano tramite **API REST** (il frontend manda richieste HTTP al backend, il backend risponde con JSON).

---

## 2. Architettura a livelli del Backend

```
                   RICHIESTA HTTP (dal browser)
                          │
                ┌─────────▼──────────┐
                │    CONTROLLER      │   Riceve la richiesta, la valida,
                │  (RestController)  │   la passa al Service
                └─────────┬──────────┘
                          │
                ┌─────────▼──────────┐
                │     SERVICE        │   Contiene la LOGICA: calcoli,
                │  (Business Logic)  │   controlli, regole
                └─────────┬──────────┘
                          │
                ┌─────────▼──────────┐
                │    REPOSITORY      │   Parla con il database
                │   (JpaRepository)  │   (query SQL generate automaticamente)
                └─────────┬──────────┘
                          │
                ┌─────────▼──────────┐
                │    DATABASE H2     │   Dove i dati sono salvati
                └────────────────────┘
```

Tra i livelli ci sono anche:
- **Entity** = classi che rappresentano le TABELLE del database
- **DTO** = classi che rappresentano i DATI scambiati con il frontend
- **Mapper** = classi che convertono Entity ↔ DTO

**Perché separare Entity e DTO?** Perché i dati interni (Entity) possono avere campi sensibili o relazioni complesse che non vogliamo esporre all'esterno. Il DTO è una "vista pulita" dei dati.

---

## 3. Il file pom.xml (dipendenze Maven)

Maven è il **gestore di dipendenze** di Java. Il `pom.xml` elenca tutte le librerie esterne usate.

**Configurazione del progetto:**
- **groupId**: `com.pubflow` — il "nome del pacchetto" dell'organizzazione
- **artifactId**: `pubflow` — il nome del progetto
- **Java version**: 21
- **Spring Boot version**: 3.4.3 (come parent)

**Dipendenze:**

| Libreria | artifactId | Cosa fa |
|---|---|---|
| Spring Web | `spring-boot-starter-web` | Crea il server web e permette di definire endpoint REST (@RestController, @GetMapping, ecc.) |
| Spring Data JPA | `spring-boot-starter-data-jpa` | ORM (Object Relational Mapping): mappa classi Java → tabelle DB. Include Hibernate |
| H2 Database | `h2` (scope: runtime) | Database relazionale leggero. `runtime` = serve solo quando l'app gira, non in compilazione |
| Lombok | `lombok` (optional) | Genera automaticamente getter, setter, costruttori, toString a compile-time con annotazioni |
| Spring Cache | `spring-boot-starter-cache` | Sistema di cache: salva risultati in memoria per non rifare query ripetute |
| Spring Validation | `spring-boot-starter-validation` | Validazione automatica: @NotNull, @NotBlank, @Min, ecc. |
| SpringDoc OpenAPI | `springdoc-openapi-starter-webmvc-ui` | Genera documentazione interattiva Swagger UI su `/swagger-ui.html` |
| Spring Security | `spring-boot-starter-security` | Autenticazione (chi sei?) e autorizzazione (cosa puoi fare?) |
| Spring Test | `spring-boot-starter-test` (scope: test) | Librerie per i test unitari |

---

## 4. application.properties — Configurazione runtime

```properties
spring.application.name=pubflow
server.port=8080
```
- Il backend si avvia sulla **porta 8080** → URL base: `http://localhost:8080`

```properties
spring.datasource.url=jdbc:h2:file:./data/pubflowdb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE
spring.datasource.driverClassName=org.h2.Driver
spring.datasource.username=sa
spring.datasource.password=
```
- Database H2 **salvato su file** nella cartella `./data/pubflowdb`
- `DB_CLOSE_DELAY=-1` = il DB non si chiude quando l'ultima connessione si chiude
- Username `sa` (system admin), password vuota

```properties
spring.jpa.database-platform=org.hibernate.dialect.H2Dialect
spring.jpa.hibernate.ddl-auto=update
```
- `H2Dialect` = dice a Hibernate di generare SQL compatibile con H2
- `ddl-auto=update` = Hibernate **crea** le tabelle se non esistono, **aggiorna** la struttura se le Entity cambiano, ma **non cancella** i dati esistenti

```properties
spring.sql.init.mode=never
spring.jpa.defer-datasource-initialization=true
```
- `init.mode=never` = NON esegue il file `data.sql` all'avvio (i dati vengono caricati dal DataSeeder in Java)
- `defer-datasource-initialization=true` = assicura che le tabelle siano create prima di qualsiasi inizializzazione dati

```properties
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
```
- Mostra le query SQL generate da Hibernate nel terminale (utile per debug)

```properties
spring.h2.console.enabled=true
spring.h2.console.path=/h2-console
```
- Console web H2 accessibile su `http://localhost:8080/h2-console` per vedere le tabelle

```properties
spring.cache.type=simple
caching.spring.menuCacheTTL=30000
caching.spring.ordineCacheTTL=10000
caching.spring.prenotazioneCacheTTL=30000
```
- Cache in memoria (ConcurrentMapCache)
- TTL (Time To Live): ogni quanto la cache viene svuotata (in millisecondi)

---

## 5. PubflowApplication.java — Il punto di ingresso

```java
package com.pubflow;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;
import org.springframework.context.annotation.Bean;

@SpringBootApplication(scanBasePackages = "com.pubflow")
@EnableCaching
@EnableScheduling
public class PubflowApplication {

    public static void main(String[] args) {
        SpringApplication.run(PubflowApplication.class, args);
    }

    @Bean
    public LocalValidatorFactoryBean validator() {
        return new LocalValidatorFactoryBean();
    }
}
```

**Riga per riga:**

- `package com.pubflow;` → dichiara il pacchetto Java di questa classe
- `@SpringBootApplication(scanBasePackages = "com.pubflow")` → **3 annotazioni in 1**:
  - `@Configuration` → "questa classe contiene configurazioni Spring"
  - `@EnableAutoConfiguration` → "configura automaticamente Spring in base alle dipendenze nel pom.xml"
  - `@ComponentScan("com.pubflow")` → "scansiona tutti i sotto-pacchetti di `com.pubflow` cercando classi annotate con @Component, @Service, @Controller, @Repository, ecc."
- `@EnableCaching` → attiva il meccanismo di cache. Senza questa annotazione, `@Cacheable` non funzionerebbe
- `@EnableScheduling` → attiva i task schedulati. Senza questa annotazione, `@Scheduled` non funzionerebbe
- `main(String[] args)` → il metodo che Java esegue all'avvio. `SpringApplication.run(...)` avvia il server Spring Boot
- `@Bean` → dice a Spring: "il risultato di questo metodo è un oggetto che devi gestire tu (mettilo nel tuo container)". Qui crea il validatore per le annotazioni `@NotNull`, `@Valid` ecc.

---

## 6. CorsConfig.java

```java
package com.pubflow.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(@NonNull CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins(
                        "http://localhost:4200",
                        "http://localhost:4201",
                        "http://localhost:55061"
                )
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
```

**Cos'è CORS (Cross-Origin Resource Sharing)?**
Quando il frontend (http://localhost:4200) fa una richiesta al backend (http://localhost:8080), il browser la blocca perché provengono da **origini diverse** (porta diversa = origine diversa). CORS dice al browser quali origini sono autorizzate.

**Riga per riga:**
- `@Configuration` → classe di configurazione caricata automaticamente da Spring all'avvio
- `implements WebMvcConfigurer` → interfaccia di Spring MVC che permette di personalizzare il server web sovrascrivendo metodi specifici
- `@Override` → sovrascrive il metodo dell'interfaccia
- `@NonNull` → annotazione che dice "questo parametro non può essere null" (documentazione, non enforcement)
- `addMapping("/**")` → applica le regole CORS a **tutti** gli URL (`/**` = qualsiasi percorso)
- `allowedOrigins(...)` → lista degli URL frontend autorizzati a fare richieste
- `allowedMethods(...)` → metodi HTTP permessi (GET per leggere, POST per creare, PUT per aggiornare tutto, DELETE per cancellare, PATCH per aggiornare parzialmente, OPTIONS per preflight CORS)
- `allowedHeaders("*")` → qualsiasi header HTTP è permesso
- `allowCredentials(true)` → permette l'invio di credenziali (cookie, header Authorization)

---

## 7. SecurityConfig.java

```java
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(withDefaults())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                    "/v3/api-docs/**",
                    "/swagger-ui/**",
                    "/swagger-ui.html"
                ).permitAll()
                .requestMatchers(HttpMethod.GET, "/pubflow/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/pubflow/prenotazioni",
                    "/pubflow/ordini", "/pubflow/tavoli/login").permitAll()
                .requestMatchers("/pubflow/auth/**").authenticated()
                .anyRequest().authenticated()
            )
            .httpBasic(basic -> basic.authenticationEntryPoint(
                (request, response, authException) -> {
                    response.sendError(
                        HttpServletResponse.SC_UNAUTHORIZED,
                        authException.getMessage());
                }));
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```

**Riga per riga:**

- `@EnableMethodSecurity` → permette di usare `@PreAuthorize(...)` sui singoli metodi dei controller
- `@Bean public SecurityFilterChain` → definisce la **catena di filtri di sicurezza** che ogni richiesta HTTP attraversa

**Regole di accesso (in ordine di priorità):**

| Regola | Significato |
|---|---|
| `.csrf(csrf -> csrf.disable())` | Disabilita la protezione CSRF. CSRF serve per form HTML tradizionali; non serve per API REST che usano JSON |
| `.cors(withDefaults())` | Usa la configurazione CORS definita in CorsConfig |
| Swagger `.permitAll()` | La documentazione API è accessibile senza login |
| `GET /pubflow/**` → `permitAll()` | **Tutte le richieste GET sono pubbliche** (leggere menu, ordini, prenotazioni, tavoli) |
| `POST prenotazioni, ordini, tavoli/login` → `permitAll()` | Creare ordini, prenotazioni e fare login tavolo è pubblico (i clienti non hanno credenziali) |
| `/pubflow/auth/**` → `authenticated()` | L'endpoint di verifica credenziali richiede autenticazione |
| `anyRequest().authenticated()` | **Tutto il resto** (POST menu, PUT, DELETE, PATCH) richiede autenticazione → solo lo staff |
| `.httpBasic(...)` | Usa **HTTP Basic Authentication**: il frontend invia l'header `Authorization: Basic base64(user:pass)` |

**Da dove prende gli utenti?**
In passato il sistema usava un `InMemoryUserDetailsManager` con utenti fissi. Adesso la classe configurata si appoggia al `CustomUserDetailsService` (definito nel package `model/service`) che, trovando un tentativo di login HTTP Basic, **interroga dinamicamente il Database** tramite `UtenteRepository` per vedere se l'utente esiste e verificare le sue credenziali criptate.

`BCryptPasswordEncoder` → cripta le password con l'algoritmo BCrypt (standard sicuro, one-way hash). Ogni volta che viene salvato un nuovo cassiere, la sua password passa di qui.

---

## 8. DataSeeder.java

Inserisce i **dati iniziali** nel database all'avvio. Il metodo `seedData()` è annotato con `@Bean` e restituisce un `CommandLineRunner`: Spring esegue automaticamente il suo metodo `run()` dopo l'avvio.

**Cosa fa in ordine:**
1. **Popola il personale:** Se non esiste, crea l'utente "betcal" (ADMIN proprietaria Benedetta). Successivamente, se mancano "Mario Rossi", "Cristina Antonucci" e "Emanuele Bianchi" all'appello nella tabella Staff, li re-inserisce in automatico generando una password univoca, garantendo che le stazioni cassa abbiano sempre dipendenti attivi per i test o avvii da zero.
2. Cancella tutti gli ordini e prenotazioni (reset giornata).
3. Se non esistono tavoli → ne crea 9 con la configurazione del pub.
4. Se esistono già → li resetta tutti a "LIBERO".
5. Se il menu è vuoto → inserisce ~45 prodotti divisi per categoria.
6. Per ogni prodotto esistente: se il campo `custom` è null, lo calcola (base o custom).
7. Rimuove eventuali prodotti con nome "coc" (pulizia dati sporchi).

**I 9 tavoli del pub:**
- Tavoli 1-4: capienza **4** posti
- Tavoli 5-7: capienza **6** posti
- Tavoli 8-9: capienza **10** posti

**Le categorie del menu:** BIRRE, PANINI, FRITTI, BEVANDE, DOLCI

Il metodo helper `menuItem(nome, descrizione, prezzo, categoria, disponibile, quantitaDisponibile)` crea un singolo `MenuItemEntity` con `custom=false` (prodotto base del pub, non eliminabile dallo staff).

---

## 9. DataCleanupRunner.java

```java
@Component
@RequiredArgsConstructor
@Slf4j
public class DataCleanupRunner implements ApplicationRunner {

    private final OrdineRepository ordineRepository;
    private final PrenotazioneRepository prenotazioneRepository;
    private final TavoloRepository tavoloRepository;

    @Override
    public void run(ApplicationArguments args) {
        // 1. Elimina tutti gli ordini
        ordineRepository.deleteAll();
        // 2. Elimina tutte le prenotazioni
        prenotazioneRepository.deleteAll();
        // 3. Reset tavoli a LIBERO + rigenera codici segreti
        List<TavoloEntity> tavoli = tavoloRepository.findAll();
        Random random = new Random();
        for (TavoloEntity tavolo : tavoli) {
            tavolo.setStato("LIBERO");
            int code = 1000 + random.nextInt(9000); // 4 cifre: 1000-9999
            tavolo.setCodiceSegreto(String.valueOf(code));
        }
        tavoloRepository.saveAll(tavoli);
    }
}
```

**Annotazioni Lombok:**
- `@RequiredArgsConstructor` → Lombok genera: `public DataCleanupRunner(OrdineRepository ordineRepository, PrenotazioneRepository prenotazioneRepository, TavoloRepository tavoloRepository) { this.ordineRepository = ordineRepository; ... }`. I campi `final` sono obbligatori → Spring li inietta automaticamente nel costruttore (**Dependency Injection tramite costruttore**)
- `@Slf4j` → Lombok genera: `private static final Logger log = LoggerFactory.getLogger(DataCleanupRunner.class);`. Permette di scrivere `log.info("messaggio")` nel terminale

**Perché `implements ApplicationRunner`?** Il metodo `run()` viene eseguito **automaticamente** da Spring subito dopo l'avvio dell'applicazione. Serve per fare operazioni di inizializzazione.

**Il codice segreto**: ogni tavolo riceve un codice di 4 cifre (es. 3847) che lo staff comunica verbalmente al cliente. Il cliente lo inserisce per autenticarsi.

---

## 10. MapperConfig.java

```java
class MapperConfig {
}
```
Classe placeholder vuota. Serve solo per evitare errori di configurazione. Non contiene logica.

---

## 11. Le Entity — Tabelle del Database

### 11.1 MenuItemEntity.java → tabella `menu_item`

```java
@Entity
@Table(name = "menu_item")
@Data
public class MenuItemEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nome")
    private String nome;

    @Column(name = "descrizione")
    private String descrizione;

    @Column(name = "prezzo")
    private BigDecimal prezzo;

    @Column(name = "categoria")
    private String categoria;

    @Column(name = "disponibile")
    private boolean disponibile;

    @Column(name = "quantita_disponibile")
    private Integer quantitaDisponibile;

    @Column(name = "custom")
    private Boolean custom;
}
```

| Annotazione | Significato dettagliato |
|---|---|
| `@Entity` | Dice a JPA/Hibernate: "questa classe Java corrisponde a una tabella nel database" |
| `@Table(name = "menu_item")` | Il nome della tabella nel DB è `menu_item` |
| `@Data` | **(Lombok)** Genera AUTOMATICAMENTE: tutti i getter (`getNome()`), setter (`setNome(...)`), `toString()`, `equals()`, `hashCode()`. Senza Lombok dovremmo scrivere ~100 righe di codice |
| `@Id` | Questo campo è la **chiave primaria** (identificatore univoco) |
| `@GeneratedValue(strategy = GenerationType.IDENTITY)` | Il valore dell'ID viene generato automaticamente dal database con auto-increment (1, 2, 3, ...) |
| `@Column(name = "nome")` | Mappa questo campo Java alla colonna `nome` nella tabella SQL |
| `BigDecimal` | Tipo Java per numeri decimali precisi (meglio di `double` per i prezzi) |
| `Boolean custom` | `Boolean` (oggetto) invece di `boolean` (primitivo) perché può essere **null** |

**Questa tabella nel database diventa:**
```sql
CREATE TABLE menu_item (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255),
    descrizione VARCHAR(255),
    prezzo DECIMAL,
    categoria VARCHAR(255),
    disponibile BOOLEAN,
    quantita_disponibile INTEGER,
    custom BOOLEAN
);
```

### 11.2 OrdineEntity.java → tabella `ordine`

```java
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

    @Column(name = "nome_cliente")
    private String nomeCliente;

    @Column(name = "tipo_ordine")
    private String tipoOrdine;       // TAVOLO, ASPORTO, DOMICILIO

    @Column(name = "stato")
    private String stato;            // RICEVUTO → IN_PREPARAZIONE → PRONTO → IN_CONSEGNA → CONSEGNATO

    @Column(name = "totale")
    private BigDecimal totale;

    @Column(name = "telefono_cliente")
    private String telefonoCliente;

    @Column(name = "numero_tavolo")
    private Integer numeroTavolo;    // solo per tipo TAVOLO

    @Column(name = "indirizzo_consegna")
    private String indirizzoConsegna;  // solo per tipo DOMICILIO

    @OneToMany(mappedBy = "ordine", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrdineItemEntity> items;
}
```

**La relazione `@OneToMany`:**
- Un ordine ha **molti** items (1 → N). Esempio: Ordine #1 contiene "2x Birra" e "1x Panino"
- `mappedBy = "ordine"` → la foreign key è nel campo `ordine` di `OrdineItemEntity` (la tabella "figlia" mantiene il riferimento)
- `cascade = CascadeType.ALL` → **propagazione**: quando salvo/aggiorno/cancello un ordine, salvo/aggiorno/cancello anche tutti i suoi items automaticamente
- `orphanRemoval = true` → se un item viene rimosso dalla lista `items`, viene cancellato dal database

- `unique = true` su `numeroOrdine` → non possono esistere due ordini con lo stesso numero

### 11.3 OrdineItemEntity.java → tabella `ordine_item`

```java
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
```

**Le relazioni `@ManyToOne`:**
- `@ManyToOne` su `ordine` → molti OrdineItem appartengono a **un** Ordine
- `@JoinColumn(name = "ordine_id")` → nella tabella `ordine_item` ci sarà una colonna `ordine_id` che contiene la foreign key verso la tabella `ordine`
- Stessa cosa per `menuItem` → colonna `menu_item_id` che punta a `menu_item`

**In SQL questa tabella diventa:**
```sql
CREATE TABLE ordine_item (
    id BIGINT PRIMARY KEY,
    ordine_id BIGINT REFERENCES ordine(id),
    menu_item_id BIGINT REFERENCES menu_item(id),
    quantita INTEGER,
    note VARCHAR(255)
);
```

### 11.4 PrenotazioneEntity.java → tabella `prenotazione`

```java
@Entity
@Table(name = "prenotazione")
@Data
public class PrenotazioneEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
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
    private LocalDate data;       // Solo la data (2026-03-28)

    @Column(name = "ora")
    private LocalTime ora;        // Solo l'ora (20:30)

    @Column(name = "stato")
    private String stato;         // CONFERMATA, ANNULLATA, COMPLETATA
}
```

- `LocalDate` = solo data (senza ora). `LocalTime` = solo ora (senza data). Separati perché il pub potrebbe voler cercare "tutte le prenotazioni del 28 marzo" o "tutte le prenotazioni delle 20:30".

### 11.5 TavoloEntity.java → tabella `tavoli`

```java
@Entity
@Table(name = "tavoli")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TavoloEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Integer numero;

    @Column(nullable = false)
    private Integer capienza;

    @Column(nullable = false)
    private String stato;        // LIBERO, IN_ATTESA_CONFERMA, OCCUPATO

    @Column(name = "codice_segreto", unique = true)
    private String codiceSegreto;
}
```

**Perché qui usa @Getter/@Setter invece di @Data?** `@Data` genera anche `equals()` e `hashCode()` basati su tutti i campi. Per le entity con `@Id`, questo può causare problemi con Hibernate. Usando separatamente @Getter e @Setter si evita il problema.

| Annotazione Lombok | Cosa genera |
|---|---|
| `@Getter` | Un metodo `getXxx()` per ogni campo |
| `@Setter` | Un metodo `setXxx(valore)` per ogni campo |
| `@NoArgsConstructor` | `public TavoloEntity() {}` — costruttore vuoto (richiesto da JPA) |
| `@AllArgsConstructor` | `public TavoloEntity(Long id, Integer numero, Integer capienza, String stato, String codiceSegreto)` |
| `@Builder` | Permette la sintassi fluida: `TavoloEntity.builder().numero(1).capienza(4).stato("LIBERO").build()` |

- `nullable = false` → la colonna NON PUÒ essere null nel database (vincolo NOT NULL)
- `unique = true` → i valori devono essere univoci (non possono esserci due tavoli con lo stesso numero)

---

## 12. I DTO — Data Transfer Object

### 12.1 MenuItem.java (DTO)

```java
@Data
public class MenuItem {
    private Long id;

    @NotBlank
    private String nome;

    private String descrizione;

    @NotNull
    @DecimalMin(value = "0.0", inclusive = false)
    private BigDecimal prezzo;

    @NotBlank
    private String categoria;

    private boolean disponibile;

    @NotNull
    @Min(0)
    private Integer quantitaDisponibile;

    private Boolean custom;
}
```

**Annotazioni di validazione Jakarta:**
Queste annotazioni vengono controllate quando il controller riceve un DTO con `@Valid`. Se una regola non è rispettata, Spring lancia `MethodArgumentNotValidException` → il `RestExceptionHandler` la cattura e restituisce errore 400.

| Annotazione | Significato |
|---|---|
| `@NotBlank` | Non può essere null, non può essere stringa vuota `""`, non può essere solo spazi `"   "` |
| `@NotNull` | Non può essere null (ma può essere 0 o stringa vuota) |
| `@DecimalMin(value = "0.0", inclusive = false)` | Il valore deve essere > 0.0 (il prezzo non può essere zero o negativo) |
| `@Min(0)` | Il valore intero deve essere ≥ 0 |

### 12.2 Ordine.java (DTO)

```java
@Data
public class Ordine {
    private Long id;
    private Integer numeroOrdine;
    private LocalDateTime dataOra;
    private String nomeCliente;

    @NotNull
    private String tipoOrdine;

    private String stato;
    private BigDecimal totale;
    private String telefonoCliente;
    private Integer numeroTavolo;
    private String indirizzoConsegna;

    @NotNull @NotEmpty
    private List<OrdineItem> items;
}
```

- `@NotEmpty` su `items` → la lista non può essere vuota (deve contenere almeno un articolo)

### 12.3 OrdineItem.java (DTO)

```java
@Data
public class OrdineItem {
    private Long id;

    @NotNull
    private Long menuItemId;      // ID del prodotto nel menu

    private String menuItemNome;   // Nome del prodotto (per visualizzazione)

    @NotNull @Min(1)
    private Integer quantita;

    private String note;           // Es. "Senza pomodoro, senza lattuga"
}
```

- `menuItemId` è l'unico campo obbligatorio per il frontend: indica QUALE prodotto del menu è stato ordinato
- `menuItemNome` viene popolato dal backend nel mapper (toDto) per comodità del frontend

### 12.4 Prenotazione.java (DTO)

```java
@Data
public class Prenotazione {
    private Long id;
    private Integer numeroPrenotazione;

    @NotBlank private String nomeCliente;
    @NotBlank private String telefonoCliente;
    @NotNull @Min(1) private Integer numeroPersone;
    @NotNull private LocalDate data;
    @NotNull private LocalTime ora;
    private String stato;
}
```

### 12.5 Tavolo.java (DTO)

```java
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class Tavolo {
    private Long id;
    private Integer numero;
    private Integer capienza;
    private String stato;
    private String codiceSegreto;
}
```

---

## 13. I Mapper — Convertitori Entity ↔ DTO

### 13.1 MenuItemMapper.java

```java
@Component
public class MenuItemMapper {

    public MenuItem toDto(MenuItemEntity entity) {
        if (entity == null) return null;
        MenuItem dto = new MenuItem();
        dto.setId(entity.getId());
        dto.setNome(entity.getNome());
        dto.setDescrizione(entity.getDescrizione());
        dto.setPrezzo(entity.getPrezzo());
        dto.setCategoria(entity.getCategoria());
        dto.setDisponibile(entity.isDisponibile());
        dto.setQuantitaDisponibile(entity.getQuantitaDisponibile());
        dto.setCustom(entity.getCustom());
        return dto;
    }

    public MenuItemEntity toEntity(MenuItem dto) {
        if (dto == null) return null;
        MenuItemEntity entity = new MenuItemEntity();
        entity.setId(dto.getId());
        entity.setNome(dto.getNome());
        // ... copia tutti i campi nella direzione opposta
        return entity;
    }
}
```

- `@Component` → Spring crea un'istanza di questa classe e la rende disponibile per la **Dependency Injection**. Dovunque un'altra classe abbia `private final MenuItemMapper menuItemMapper;`, Spring la inietta automaticamente
- `toDto()` → prende un oggetto dal DATABASE (Entity) e lo converte in un oggetto da inviare al FRONTEND (DTO)
- `toEntity()` → prende un oggetto ricevuto dal FRONTEND (DTO) e lo converte in un oggetto da salvare nel DATABASE (Entity)

### 13.2 OrdineItemMapper.java — Caso speciale

```java
@Component
public class OrdineItemMapper {

    public OrdineItem toDto(OrdineItemEntity entity) {
        OrdineItem dto = new OrdineItem();
        dto.setId(entity.getId());
        if (entity.getMenuItem() != null) {
            dto.setMenuItemId(entity.getMenuItem().getId());
            dto.setMenuItemNome(entity.getMenuItem().getNome());
        }
        dto.setQuantita(entity.getQuantita());
        dto.setNote(entity.getNote());
        return dto;
    }
}
```

Qui il mapping non è 1:1. L'Entity ha un oggetto `MenuItemEntity menuItem` (relazione JPA), ma il DTO ha due campi piatti: `menuItemId` e `menuItemNome`. Il mapper "appiattisce" la relazione.

### 13.3 OrdineMapper.java — Usa un altro Mapper

```java
@Component
public class OrdineMapper {
    private final OrdineItemMapper ordineItemMapper;

    public OrdineMapper(OrdineItemMapper ordineItemMapper) {
        this.ordineItemMapper = ordineItemMapper;
    }

    public Ordine toDto(OrdineEntity entity) {
        Ordine dto = new Ordine();
        // ... copia i campi semplici ...
        if (entity.getItems() != null) {
            List<OrdineItem> items = entity.getItems().stream()
                    .map(ordineItemMapper::toDto)
                    .toList();
            dto.setItems(items);
        }
        return dto;
    }
}
```

- L'OrdineMapper ha bisogno dell'OrdineItemMapper per convertire la lista di items → **Dependency Injection tramite costruttore**
- `.stream().map(ordineItemMapper::toDto).toList()` → **Java Stream API**: prende la lista di Entity, applica `toDto()` a ciascun elemento, e raccoglie i risultati in una nuova lista di DTO

### 13.4 TavoloMapper.java — Usa il pattern Builder

```java
@Component
public class TavoloMapper {
    public Tavolo toDto(TavoloEntity entity) {
        if (entity == null) return null;
        return Tavolo.builder()
                .id(entity.getId())
                .numero(entity.getNumero())
                .capienza(entity.getCapienza())
                .stato(entity.getStato())
                .codiceSegreto(entity.getCodiceSegreto())
                .build();
    }

    public List<Tavolo> toDtoList(List<TavoloEntity> entities) {
        if (entities == null) return null;
        return entities.stream().map(this::toDto).collect(Collectors.toList());
    }
}
```

- `Tavolo.builder()...build()` → usa il pattern Builder generato da `@Builder` sulla classe Tavolo. Invece di creare l'oggetto e chiamare 5 setter, si concatenano le chiamate in modo leggibile
- `toDtoList()` → metodo comodo per convertire una lista intera, usando `this::toDto` come **method reference**

### 11.6 UtenteEntity.java → tabella `utenti`

```java
@Entity
@Table(name = "utenti")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class UtenteEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String nome;

    @Column(nullable = false, length = 50)
    private String cognome;

    @Column(nullable = false, unique = true, length = 20)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(name = "password_visibile", length = 20)
    private String passwordVisibile;

    @Column(nullable = false, length = 20)
    private String ruolo; // Es: "ROLE_ADMIN", "ROLE_STAFF"
}
```
**Perché memorizzare la password in chiaro?**
Generalmente una pratica da evitare su app pubbliche, nel caso di PubFlow la `passwordVisibile` serve all'Admin per recuperarla qualora lo Staff la dimentichi al volo durante un turno. Nel DB viaggia assieme alla vera password criptata con BCrypt, unendo la sicurezza infrastrutturale all'usabilità operativa del pub.

---

### 12.6 UtenteDto.java (DTO)

```java
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class UtenteDto {
    private Long id;
    private String nome;
    private String cognome;
    private String username;
    private String passwordVisibile;
    private String ruolo;
}
```

### 13.5 UtenteMapper.java

```java
@Component
public class UtenteMapper {
    public UtenteDto toDto(UtenteEntity entity) {
        if (entity == null) return null;
        return UtenteDto.builder()
                .id(entity.getId())
                .nome(entity.getNome())
                .cognome(entity.getCognome())
                .username(entity.getUsername())
                .passwordVisibile(entity.getPasswordVisibile())
                .ruolo(entity.getRuolo())
                .build();
    }
    public List<UtenteDto> toDtoList(List<UtenteEntity> entities) {
        if (entities == null) return null;
        return entities.stream().map(this::toDto).collect(Collectors.toList());
    }
}
```
