# 📘 Relazione PubFlow — Parte 2: Repository, Service, Controller, Exception

---

## 1. I Repository — Accesso al Database

I Repository sono **interfacce** (non classi con codice!). Estendono `JpaRepository` e Spring genera automaticamente l'implementazione a runtime.

### 1.1 MenuItemRepository.java

```java
@Repository
public interface MenuItemRepository extends JpaRepository<MenuItemEntity, Long> {

    List<MenuItemEntity> findByCategoria(String categoria);

    List<MenuItemEntity> findByDisponibileTrue();

    List<MenuItemEntity> findByDisponibileTrueAndQuantitaDisponibileGreaterThan(int quantita);
}
```

| Elemento | Spiegazione |
|---|---|
| `@Repository` | Marca l'interfaccia come componente di accesso ai dati. Spring la rileva durante il component scanning |
| `extends JpaRepository<MenuItemEntity, Long>` | Eredita i metodi CRUD. Il primo parametro è il tipo Entity, il secondo è il tipo della chiave primaria. Metodi ereditati: `findAll()`, `findById(id)`, `save(entity)`, `deleteById(id)`, `deleteAll()`, `count()` |
| `findByCategoria(String categoria)` | **Derived Query Method**: Spring analizza il nome del metodo e genera la query: `SELECT * FROM menu_item WHERE categoria = ?` |
| `findByDisponibileTrue()` | Query: `SELECT * FROM menu_item WHERE disponibile = true` |
| `findByDisponibileTrueAndQuantitaDisponibileGreaterThan(int quantita)` | Query: `SELECT * FROM menu_item WHERE disponibile = true AND quantita_disponibile > ?`. I nomi dei metodi seguono una convenzione: `findBy` + NomeCampo + Condizione |

### 1.2 OrdineRepository.java

```java
@Repository
public interface OrdineRepository extends JpaRepository<OrdineEntity, Long> {

    Optional<OrdineEntity> findByNumeroOrdine(Integer numeroOrdine);

    List<OrdineEntity> findByTelefonoCliente(String telefonoCliente);

    List<OrdineEntity> findByStato(String stato);

    @Transactional
    @Modifying
    @Query("UPDATE OrdineEntity o SET o.stato = :stato WHERE o.id = :id")
    int updateStato(Long id, String stato);

    @Transactional
    @Modifying
    @Query("UPDATE OrdineEntity o SET o.stato = :nuovoStato WHERE o.numeroTavolo = :numeroTavolo AND o.stato != :nuovoStato")
    int updateStatoPerTavolo(Integer numeroTavolo, String nuovoStato);
}
```

| Elemento | Spiegazione |
|---|---|
| `Optional<OrdineEntity>` | Il risultato può essere presente o assente (evita `null`) |
| `@Query("UPDATE OrdineEntity o ...")` | **Query JPQL personalizzata** (Java Persistence Query Language). Simile a SQL ma usa i **nomi delle classi Java** (non delle tabelle) e i **nomi dei campi Java** (non delle colonne). `:stato` e `:id` sono parametri che corrispondono ai parametri del metodo |
| `@Modifying` | Indica che la query modifica dati (UPDATE/DELETE), non è una SELECT |
| `@Transactional` | Esegue in una transazione: se qualcosa va storto, tutte le modifiche vengono annullate (rollback) |
| `int updateStato(...)` | Restituisce il numero di righe aggiornate. Se restituisce 0 = nessun ordine trovato |
| `updateStatoPerTavolo(...)` | Aggiorna LO STATO DI TUTTI gli ordini di un tavolo in un colpo solo |

### 1.3 PrenotazioneRepository.java

```java
@Repository
public interface PrenotazioneRepository extends JpaRepository<PrenotazioneEntity, Long> {

    Optional<PrenotazioneEntity> findByNumeroPrenotazione(Integer numero);
    List<PrenotazioneEntity> findByTelefonoCliente(String telefono);
    List<PrenotazioneEntity> findByData(LocalDate data);
    List<PrenotazioneEntity> findAllByOrderByDataAscOraAsc();

    @Transactional @Modifying
    @Query("UPDATE PrenotazioneEntity p SET p.stato = :stato WHERE p.id = :id")
    int updateStato(Long id, String stato);
}
```

- `findAllByOrderByDataAscOraAsc()` → `SELECT * FROM prenotazione ORDER BY data ASC, ora ASC`. Le prenotazioni vengono ordinate per data e poi per ora (le più vicine prima)

### 1.4 TavoloRepository.java

```java
@Repository
public interface TavoloRepository extends JpaRepository<TavoloEntity, Long> {
    Optional<TavoloEntity> findByNumero(Integer numero);
    Optional<TavoloEntity> findByCodiceSegreto(String codiceSegreto);
    List<TavoloEntity> findByStato(String stato);

    @Transactional @Modifying
    @Query("UPDATE TavoloEntity t SET t.stato = :stato WHERE t.numero = :numeroTavolo")
    int updateStato(Integer numeroTavolo, String stato);
}
```

### 1.5 UtenteRepository.java

```java
@Repository
public interface UtenteRepository extends JpaRepository<UtenteEntity, Long> {
    Optional<UtenteEntity> findByUsername(String username);
}
```
- Fondamentale per Spring Security: permette di cercare un utente nel DB usando il suo `username` (necessario al momento del login).
- Ritorna un `Optional` perché l'username digitato potrebbe non esistere.


---

## 2. I Service — Logica di Business

### 2.1 MenuItemService.java

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class MenuItemService {

    private final MenuItemMapper menuItemMapper;
    private final MenuItemRepository menuItemRepository;
```

| Annotazione | Significato |
|---|---|
| `@Service` | Sottotipo di `@Component`. Indica che questa classe contiene logica di business. Spring la gestisce e la rende disponibile per l'iniezione |
| `@RequiredArgsConstructor` | (Lombok) Genera il costruttore con i campi `final` → Spring inietta `menuItemMapper` e `menuItemRepository` |
| `@Slf4j` | (Lombok) Genera il logger per scrivere log nel terminale |

**Metodi:**

```java
public List<MenuItem> getAll() {
    return menuItemRepository.findAll()
            .stream()
            .filter(item -> item.getQuantitaDisponibile() == null
                         || item.getQuantitaDisponibile() >= 0)
            .map(menuItemMapper::toDto)
            .toList();
}
```
Recupera tutti i prodotti, filtra quelli con quantità ≥ 0 (esclude i soft-deleted con -1), li converte in DTO.

```java
@Cacheable("menuCategoriaCache")
public List<MenuItem> getByCategoria(String categoria) { ... }
```
- `@Cacheable("menuCategoriaCache")` → la **prima** volta che qualcuno chiede "tutti i PANINI", Spring esegue la query e salva il risultato in cache con chiave "menuCategoriaCache". Le volte **successive** restituisce il risultato dalla cache senza toccare il database. Questo velocizza molto le risposte.

```java
public MenuItem save(MenuItem menuItem) {
    MenuItemEntity entity = menuItemMapper.toEntity(menuItem);
    entity.setCustom(true);              // I nuovi prodotti sono sempre custom
    normalizeDisponibilita(entity);       // Se quantità ≤ 0, metti disponibile = false
    return menuItemMapper.toDto(menuItemRepository.save(entity));
}
```

```java
public void delete(Long id) {
    try {
        menuItemRepository.deleteById(id);
    } catch (DataIntegrityViolationException e) {
        // Il prodotto è referenziato da ordini → non si può cancellare fisicamente
        // → Soft delete: lo rendiamo invisibile
        MenuItemEntity existing = menuItemRepository.findById(id).orElse(null);
        if (existing != null) {
            existing.setDisponibile(false);
            existing.setQuantitaDisponibile(-1);  // -1 = soft-deleted
            menuItemRepository.save(existing);
        }
    }
}
```
**Soft delete**: se un prodotto è stato ordinato in passato, non possiamo cancellarlo dal DB perché gli ordini hanno una foreign key che punta a lui. Invece di cancellarlo, lo "nascondiamo" mettendo disponibile=false e quantità=-1.

```java
@CacheEvict(value = "menuCategoriaCache", allEntries = true)
@Scheduled(fixedRateString = "${caching.spring.menuCacheTTL}")
public void emptyMenuCategoriaCache() {
    log.info("Svuotamento cache menuCategoriaCache");
}
```
- `@CacheEvict` → svuota la cache
- `@Scheduled(fixedRateString = "${caching.spring.menuCacheTTL}")` → esegue ogni X ms. `${...}` legge il valore da `application.properties` → 30000ms = 30 secondi

---

### 2.2 OrdineService.java

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class OrdineService {
    private final OrdineMapper ordineMapper;
    private final OrdineRepository ordineRepository;
    private final MenuItemRepository menuItemRepository;
    private final TavoloService tavoloService;
```

**Il metodo `save()` — creazione ordine (il più complesso):**

```java
public Ordine save(Ordine ordine) {
    OrdineEntity entity = new OrdineEntity();
    entity.setDataOra(LocalDateTime.now());        // Timestamp attuale
    entity.setNomeCliente(ordine.getNomeCliente());
    entity.setTipoOrdine(ordine.getTipoOrdine());
    entity.setStato("RICEVUTO");                   // Stato iniziale sempre RICEVUTO
    entity.setTelefonoCliente(ordine.getTelefonoCliente());
    entity.setNumeroTavolo(ordine.getNumeroTavolo());
    entity.setIndirizzoConsegna(ordine.getIndirizzoConsegna());

    // Se è un ordine al tavolo → segna il tavolo come OCCUPATO
    if ("TAVOLO".equalsIgnoreCase(ordine.getTipoOrdine())
        && ordine.getNumeroTavolo() != null) {
        tavoloService.aggiornaStato(ordine.getNumeroTavolo(), "OCCUPATO");
    }

    // Per ogni articolo nell'ordine:
    List<OrdineItemEntity> items = new ArrayList<>();
    BigDecimal totale = BigDecimal.ZERO;

    for (OrdineItem itemDto : ordine.getItems()) {
        // 1. Trova il prodotto nel menu
        MenuItemEntity menuItem = menuItemRepository.findById(itemDto.getMenuItemId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "MenuItem non trovato con id: " + itemDto.getMenuItemId()));

        // 2. Verifica che sia disponibile
        if (!menuItem.isDisponibile()) {
            throw new IllegalArgumentException(
                "Il prodotto " + menuItem.getNome() + " non è attualmente disponibile.");
        }

        // 3. Verifica le scorte e le decrementa
        if (menuItem.getQuantitaDisponibile() != null) {
            if (itemDto.getQuantita() > menuItem.getQuantitaDisponibile()) {
                throw new IllegalArgumentException("Quantità insufficiente per "
                    + menuItem.getNome() + ". Rimanenti: "
                    + menuItem.getQuantitaDisponibile());
            }
            menuItem.setQuantitaDisponibile(
                menuItem.getQuantitaDisponibile() - itemDto.getQuantita());
        }

        // 4. Crea l'item dell'ordine
        OrdineItemEntity itemEntity = new OrdineItemEntity();
        itemEntity.setOrdine(entity);     // Associa l'item all'ordine (foreign key)
        itemEntity.setMenuItem(menuItem); // Associa l'item al prodotto del menu
        itemEntity.setQuantita(itemDto.getQuantita());
        itemEntity.setNote(itemDto.getNote());
        items.add(itemEntity);

        // 5. Calcola il subtotale: prezzo × quantità
        totale = totale.add(menuItem.getPrezzo().multiply(
                BigDecimal.valueOf(itemDto.getQuantita())));
    }

    entity.setItems(items);
    entity.setTotale(totale);

    // Genera numero ordine progressivo
    long count = ordineRepository.count();
    entity.setNumeroOrdine((int) (count + 1));

    return ordineMapper.toDto(ordineRepository.save(entity));
}
```

**Il metodo `aggiornaStato()` — flusso degli stati:**

```java
@CacheEvict(value = "ordineNumeroCache", allEntries = true)
public int aggiornaStato(Long id, String nuovoStato) {
    OrdineEntity ordine = ordineRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Ordine non trovato"));

    if (!isTransizioneValida(ordine.getStato(), nuovoStato)) {
        throw new IllegalArgumentException(
            "Transizione non valida: " + ordine.getStato() + " -> " + nuovoStato);
    }
    return ordineRepository.updateStato(id, nuovoStato);
}

private boolean isTransizioneValida(String statoAttuale, String nuovoStato) {
    return switch (statoAttuale) {
        case "RICEVUTO"        -> "IN_PREPARAZIONE".equals(nuovoStato);
        case "IN_PREPARAZIONE" -> "PRONTO".equals(nuovoStato);
        case "PRONTO"          -> "IN_CONSEGNA".equals(nuovoStato)
                               || "CONSEGNATO".equals(nuovoStato);
        case "IN_CONSEGNA"     -> "CONSEGNATO".equals(nuovoStato);
        default -> false;  // CONSEGNATO è finale, non si può cambiare
    };
}
```

Il flusso obbligatorio è: **RICEVUTO → IN_PREPARAZIONE → PRONTO → (IN_CONSEGNA →) CONSEGNATO**. Da PRONTO si può andare direttamente a CONSEGNATO (per ordini al tavolo, senza IN_CONSEGNA).

**Il metodo `pagaOrdiniTavolo()`:**

```java
@CacheEvict(value = "ordineNumeroCache", allEntries = true)
public int pagaOrdiniTavolo(Integer numeroTavolo) {
    tavoloService.aggiornaStato(numeroTavolo, "LIBERO");  // Libera il tavolo
    return ordineRepository.updateStatoPerTavolo(numeroTavolo, "PAGATO");  // Segna tutti come PAGATO
}
```

---

### 2.3 PrenotazioneService.java

```java
public Prenotazione save(Prenotazione prenotazione) {
    // 1. Prende tutte le prenotazioni confermata per quel giorno
    List<PrenotazioneEntity> occupateValide = prenotazioneRepository
        .findByData(prenotazione.getData()).stream()
        .filter(p -> "CONFERMATA".equals(p.getStato()) || "RICEVUTA".equals(p.getStato()))
        .toList();

    // 2. Raccoglie il numero di persone di ogni gruppo
    List<Integer> groups = new ArrayList<>();
    for (PrenotazioneEntity p : occupateValide) {
        groups.add(p.getNumeroPersone());
    }
    groups.add(prenotazione.getNumeroPersone()); // Aggiunge il nuovo gruppo

    // 3. Verifica che TUTTI i gruppi possano essere seduti ai tavoli disponibili
    if (!canSatisfyAll(groups)) {
        throw new IllegalArgumentException("Nessun tavolo disponibile...");
    }

    // 4. Salva la prenotazione
    PrenotazioneEntity entity = prenotazioneMapper.toEntity(prenotazione);
    entity.setStato("CONFERMATA");
    entity.setNumeroPrenotazione((int)(prenotazioneRepository.count() + 1));
    return prenotazioneMapper.toDto(prenotazioneRepository.save(entity));
}
```

**L'algoritmo di backtracking (`canSatisfyAll`):**

Questo è l'algoritmo più complesso del progetto. Il problema è: dati N gruppi di persone e 9 tavoli di varie capienze, è possibile assegnare a ciascun gruppo uno o più tavoli?

```java
private boolean canSatisfyAll(List<Integer> groups) {
    groups.sort(Collections.reverseOrder()); // Ordina i gruppi dal più grande al più piccolo
    List<Integer> availableTables = tavoloRepository.findAll().stream()
            .map(t -> t.getCapienza())
            .collect(Collectors.toList());
    return assignBacktrack(groups, 0, availableTables);
}
```

```java
private boolean assignBacktrack(List<Integer> groups, int groupIndex, List<Integer> tables) {
    if (groupIndex == groups.size()) return true; // Tutti i gruppi sono stati assegnati!

    int currentGroupSize = groups.get(groupIndex);

    // Trova tutte le combinazioni di tavoli che possono ospitare questo gruppo
    List<List<Integer>> validCombos = findValidTableCombos(currentGroupSize, tables);

    for (List<Integer> combo : validCombos) {
        // Prova questa combinazione: rimuovi i tavoli usati
        for (Integer t : combo) tables.remove(t);

        // Prova ricorsivamente ad assegnare i gruppi rimanenti
        if (assignBacktrack(groups, groupIndex + 1, tables)) {
            return true; // Funziona!
        }

        // Non funziona → BACKTRACK: rimetti i tavoli e prova un'altra combinazione
        tables.addAll(combo);
        tables.sort(Collections.reverseOrder());
    }
    return false; // Nessuna combinazione funziona
}
```

Esempio: 3 gruppi (8 persone, 5 persone, 3 persone), tavoli disponibili: [10, 6, 6, 4, 4, 4, 4].
L'algoritmo prova: gruppo da 8 → tavolo da 10 ✓, gruppo da 5 → tavolo da 6 ✓, gruppo da 3 → tavolo da 4 ✓. Tutti soddisfatti!

---

### 2.4 TavoloService.java

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class TavoloService {
    private final TavoloRepository tavoloRepository;
    private final TavoloMapper tavoloMapper;

    public List<Tavolo> getAll() {
        return tavoloMapper.toDtoList(tavoloRepository.findAll());
    }

    public Tavolo getByNumero(Integer numero) {
        return tavoloRepository.findByNumero(numero)
                .map(tavoloMapper::toDto)     // Se trovato, converti in DTO
                .orElse(null);                 // Se non trovato, restituisci null
    }

    public boolean aggiornaStato(Integer numeroTavolo, String nuovoStato) {
        int updated = tavoloRepository.updateStato(numeroTavolo, nuovoStato);
        return updated > 0;   // true se almeno un tavolo è stato aggiornato
    }

    public Tavolo loginByCodice(String codice) {
        TavoloEntity tavolo = tavoloRepository.findByCodiceSegreto(codice)
                .orElseThrow(() -> new IllegalArgumentException("Codice segreto non valido"));

        if ("OCCUPATO".equalsIgnoreCase(tavolo.getStato())) {
            throw new IllegalArgumentException("Il tavolo è già occupato");
        }

        tavolo.setStato("OCCUPATO");
        tavoloRepository.save(tavolo);
        return tavoloMapper.toDto(tavolo);
    }
}
```

Il metodo `loginByCodice()`: il cliente inserisce il codice a 4 cifre → il sistema cerca il tavolo con quel codice → verifica che non sia già occupato → lo segna come OCCUPATO → restituisce i dati del tavolo (numero, capienza, ecc.) al frontend.

### 2.5 UtenteService.java e CustomUserDetailsService.java

**UtenteService.java** gestisce il CRUD (creazione, lettura, eliminazione) del personale da parte dell'Admin:
- **`save(UtenteDto)`**: Oltre a salvare l'UtenteEntity, usa il `PasswordEncoder` per creare un hash della password prima di salvarla, ma salva anche la `passwordVisibile` in chiaro in modo che l'admin possa consultarla in futuro.

**CustomUserDetailsService.java** implementa `UserDetailsService` di Spring Security. 
- Il suo unico metodo `loadUserByUsername()` interroga l'`UtenteRepository` per trovare l'utente. Se esiste, lo converte in un oggetto `UserDetails` per confermare l'identità a Spring Security.


---

## 3. I Controller — Endpoint REST

### 3.1 AuthController.java

```java
@RestController
@RequestMapping("/pubflow/auth")
public class AuthController {

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getMe(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }
        Map<String, Object> userInfo = new HashMap<>();
        userInfo.put("username", authentication.getName());
        List<String> roles = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());
        userInfo.put("roles", roles);
        return ResponseEntity.ok(userInfo);
    }
}
```

- `Authentication authentication` → Spring inietta automaticamente l'oggetto di autenticazione (contenente username e ruoli) se l'utente ha fornito credenziali valide nell'header HTTP
- Restituisce JSON: `{"username": "admin", "roles": ["ROLE_ADMIN"]}`
- Questo endpoint viene chiamato dal frontend per **verificare** che le credenziali siano valide

### 3.2 MenuItemController.java

```java
@RestController
@Slf4j
@RequestMapping("/pubflow/menu")
@RequiredArgsConstructor
public class MenuItemController {
    private final MenuItemService menuItemService;

    @GetMapping
    public ResponseEntity<List<MenuItem>> getAll() {
        List<MenuItem> items = menuItemService.getAll();
        return items.isEmpty()
            ? ResponseEntity.noContent().build()   // 204 No Content
            : ResponseEntity.ok(items);             // 200 OK + JSON
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<MenuItem> create(
            @jakarta.validation.Valid @RequestBody MenuItem menuItem) {
        MenuItem created = menuItemService.save(menuItem);
        return ResponseEntity.status(HttpStatus.CREATED).body(created); // 201 Created
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        MenuItem existing = menuItemService.getById(id);
        if (existing == null) {
            throw new NotFoundException("MenuItem con id " + id);
        }
        if (existing.getCustom() == null || !existing.getCustom()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build(); // 403
        }
        menuItemService.delete(id);
        return ResponseEntity.noContent().build(); // 204
    }

    @GetMapping("/page")
    public ResponseEntity<Page<MenuItem>> getByPage(
            @RequestParam("page") int page,
            @RequestParam("size") int size,
            @RequestParam("sortField") String sortField,
            @RequestParam("sortDirection") String sortDirection) {
        Pageable pageable = PageRequest.of(page, size,
            Sort.by(sortDirection.equalsIgnoreCase("desc")
                ? Sort.Direction.DESC : Sort.Direction.ASC, sortField));
        return ResponseEntity.ok(menuItemService.getByPage(pageable));
    }
}
```

**Annotazioni dei Controller:**

| Annotazione | Significato |
|---|---|
| `@RestController` | Ogni metodo restituisce direttamente dati (JSON), non una pagina HTML |
| `@RequestMapping("/pubflow/menu")` | URL base: tutti gli endpoint iniziano con `/pubflow/menu` |
| `@GetMapping` | Risponde a `GET /pubflow/menu` |
| `@GetMapping("/{id}")` | Risponde a `GET /pubflow/menu/5` dove 5 è l'id |
| `@PostMapping` | Risponde a `POST /pubflow/menu` (crea nuovo) |
| `@PutMapping("/{id}")` | Risponde a `PUT /pubflow/menu/5` (aggiorna completamente) |
| `@DeleteMapping("/{id}")` | Risponde a `DELETE /pubflow/menu/5` (cancella) |
| `@PatchMapping("/{id}/stato")` | Risponde a `PATCH /pubflow/ordini/5/stato` (aggiornamento parziale) |
| `@PathVariable Long id` | Estrae `5` da `/menu/5` |
| `@RequestParam String stato` | Estrae `PRONTO` da `?stato=PRONTO` |
| `@RequestBody MenuItem menuItem` | Converte il JSON nel body della richiesta in oggetto Java |
| `@Valid` | Attiva la validazione (@NotNull, @NotBlank, ecc.) |
| `@PreAuthorize("hasRole('ADMIN')")` | Solo utenti con quel ruolo possono accedere |

**Codici HTTP usati:**

| Codice | Significato | Quando |
|---|---|---|
| 200 OK | Successo | Risorsa trovata e restituita |
| 201 Created | Creato | Nuova risorsa creata con successo |
| 204 No Content | Nessun contenuto | Lista vuota o eliminazione riuscita |
| 400 Bad Request | Richiesta errata | Validazione fallita o input sbagliato |
| 401 Unauthorized | Non autenticato | Credenziali mancanti o errate |
| 403 Forbidden | Vietato | Autenticato ma senza permessi (es. eliminare prodotto base) |
| 404 Not Found | Non trovato | Risorsa inesistente |
| 409 Conflict | Conflitto | Conflitto di dati |
| 500 Internal Error | Errore server | Bug o errore non previsto |

### 3.3 TestController.java

```java
@RestController
public class TestController {
    @GetMapping("/api/test")
    public String test() {
        return "Backend PubFlow attivo";
    }
}
```

Endpoint di test minimale: visitando `http://localhost:8080/api/test` nel browser si vede la scritta "Backend PubFlow attivo". Utile per verificare che il server sia avviato.

### 3.4 UtenteController.java

```java
@RestController
@RequestMapping("/pubflow/utenti")
@RequiredArgsConstructor
public class UtenteController {

    private final UtenteService utenteService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UtenteDto>> getStaff() {
        return ResponseEntity.ok(utenteService.getStaffUsers());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UtenteDto> aggiungiStaff(@RequestBody UtenteDto dto) {
        return ResponseEntity.ok(utenteService.save(dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> licenziaStaff(@PathVariable Long id) {
        utenteService.delete(id);
        return ResponseEntity.ok().build();
    }
}
```
Mette a disposizione tre endpoint protetti rigidamente dalla clausola `@PreAuthorize("hasRole('ADMIN')")`. Questa è la materializzazione del concetto di **Controllo degli Accessi Basato sui Ruoli (RBAC)**: se un cameriere (STAFF) o peggio un cliente tenta di licenziare qualcuno effettuando una richiesta `DELETE /pubflow/utenti/5`, Spring Security lo blocca e risponde con l'errore `403 Forbidden` ancor prima che la richiesta entri nel controller aziendale!


---

## 4. Le Eccezioni Custom

### 4.1 NotFoundException.java

```java
public class NotFoundException extends RuntimeException {
    public NotFoundException(String message) {
        super(message);
    }
}
```

`extends RuntimeException` → è un'eccezione **unchecked** (non obbliga il chiamante a gestirla con try-catch). Viene lanciata nei controller quando una risorsa non esiste (es. `throw new NotFoundException("Ordine con id 5")`).

Stessa struttura per `BadRequestException` e `ConflictException`.

### 4.2 RestExceptionHandler.java

```java
@Slf4j
@RestControllerAdvice
public class RestExceptionHandler {

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<String> handleNotFound(NotFoundException ex) {
        log.warn("Risorsa non trovata: {}", ex.getMessage());
        return new ResponseEntity<>("Risorsa non trovata: " + ex.getMessage(),
                                    HttpStatus.NOT_FOUND);  // 404
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidation(
            MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            errors.put(error.getField(), error.getDefaultMessage());
        }
        return new ResponseEntity<>(errors, HttpStatus.BAD_REQUEST);  // 400
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<String> handleIllegalArgument(IllegalArgumentException ex) {
        return new ResponseEntity<>("Input non valido: " + ex.getMessage(),
                                    HttpStatus.BAD_REQUEST);  // 400
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<String> handleGlobal(Exception ex) {
        log.error("Errore non gestito: {}", ex.getMessage());
        return new ResponseEntity<>("Errore: " + ex.getMessage(),
                                    HttpStatus.INTERNAL_SERVER_ERROR);  // 500
    }
}
```

| Annotazione | Significato |
|---|---|
| `@RestControllerAdvice` | Classe "sentinella" globale. Intercetta tutte le eccezioni lanciate in qualsiasi Controller e le gestisce centralmente. Senza questo, Spring restituirebbe errori HTML di default |
| `@ExceptionHandler(Type.class)` | "Quando viene lanciata un'eccezione di questo tipo, esegui questo metodo" |

**handleValidation**: quando `@Valid` fallisce (es. nome vuoto, prezzo negativo), Spring lancia `MethodArgumentNotValidException` con la lista dei campi non validi. Questo handler la trasforma in un JSON tipo: `{"nome": "must not be blank", "prezzo": "must be greater than 0.0"}`

L'ultimo `@ExceptionHandler(Exception.class)` è il **catch-all**: cattura qualsiasi eccezione non gestita dagli handler precedenti e restituisce 500.
