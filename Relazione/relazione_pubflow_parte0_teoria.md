# 📘 Relazione PubFlow — Parte 0: TEORIA DEL CORSO → CODICE DEL PROGETTO

> **Questa sezione collega ogni concetto del programma d'esame (Orale.pdf) al codice effettivo del progetto PubFlow. Per ogni argomento troverai: cosa dice la teoria, dove lo abbiamo implementato, e perché.**

---

## 1. HTTP e Architettura REST

### Dalla teoria:
HTTP è un protocollo **stateless** (non mantiene lo stato tra le richieste). REST (Representational State Transfer) è uno stile architetturale che usa i metodi HTTP per operare sulle risorse.

### Nel progetto:
Ogni risorsa del pub (menu, ordini, prenotazioni, tavoli) è accessibile tramite un **URL** e operata con metodi HTTP:

| Metodo HTTP | Significato | Esempio nel progetto | Controller |
|---|---|---|---|
| **GET** | Leggere | `GET /pubflow/menu` → lista del menu | `MenuItemController.getAll()` |
| **POST** | Creare | `POST /pubflow/ordini` → crea un ordine | `OrdineController.create()` |
| **PUT** | Aggiornare tutto | `PUT /pubflow/menu/5` → aggiorna prodotto 5 | `MenuItemController.update()` |
| **PATCH** | Aggiornare parzialmente | `PATCH /pubflow/ordini/3/stato?stato=PRONTO` | `OrdineController.aggiornaStato()` |
| **DELETE** | Cancellare | `DELETE /pubflow/menu/5` → elimina prodotto 5 | `MenuItemController.delete()` |

I **codici di stato HTTP** usati (vedi `RestExceptionHandler.java` e i Controller):
- **200 OK** → risorsa trovata (`ResponseEntity.ok(...)`)
- **201 Created** → risorsa creata con successo (`HttpStatus.CREATED`)
- **204 No Content** → lista vuota o eliminazione riuscita (`ResponseEntity.noContent()`)
- **400 Bad Request** → dati di input non validi (`HttpStatus.BAD_REQUEST`)
- **401 Unauthorized** → credenziali mancanti o errate
- **403 Forbidden** → autenticato ma senza permessi
- **404 Not Found** → risorsa non trovata (`NotFoundException`)
- **500 Internal Server Error** → errore non previsto nel server

---

## 2. Servlet, JSP e il modello MVC — Background storico

### Dalla teoria:
Le **Servlet** sono classi Java che ricevono richieste HTTP e generano risposte. Le **JSP** permettono di mettere codice Java nell'HTML. Il pattern **MVC** separa Model (dati), View (presentazione), Controller (logica).

### Nel progetto:
Spring Boot **sostituisce** completamente Servlet e JSP con un approccio più moderno:
- **Non usiamo JSP** per le viste → il frontend Angular è un'applicazione separata
- **Non scriviamo Servlet manualmente** → Spring Boot le gestisce internamente tramite `DispatcherServlet`
- Il pattern **MVC** è presente ma diviso tra backend e frontend:

| Componente MVC | Cosa lo implementa nel progetto |
|---|---|
| **Model** | Le Entity (backend) e i Modelli TypeScript (frontend `shared/models/`) |
| **View** | I template HTML Angular (`*.component.html`) |
| **Controller (backend)** | I `@RestController` (`MenuItemController`, `OrdineController`, ecc.) |
| **Controller (frontend)** | Le classi TypeScript dei componenti (`*.component.ts`) |

Il **DispatcherServlet** di Spring (configurato automaticamente da Spring Boot) riceve TUTTE le richieste HTTP e le instrada verso il controller appropriato in base all'URL (`@RequestMapping`).

---

## 3. JPA e Persistenza (ORM)

### Dalla teoria:
JPA (Java Persistence API) mappa oggetti Java su tabelle del database. Le entità sono POJO con annotazioni. Un `EntityManager` gestisce il ciclo di vita delle entità (managed → detached).

### Nel progetto:

**Entity = POJO con annotazioni JPA** → package `com.pubflow.model.entity`
- `MenuItemEntity.java` → tabella `menu_item`
- `OrdineEntity.java` → tabella `ordine`
- `OrdineItemEntity.java` → tabella `ordine_item`
- `PrenotazioneEntity.java` → tabella `prenotazione`
- `TavoloEntity.java` → tabella `tavoli`

**Annotazioni JPA usate nel progetto (dal programma del prof):**

| Annotazione | Dalla teoria | Nel progetto |
|---|---|---|
| `@Entity` | Identifica una classe come entità persistente | Tutte le Entity |
| `@Table(name=...)` | Specifica il nome della tabella | `@Table(name = "menu_item")` in MenuItemEntity |
| `@Id` | Chiave primaria | `private Long id` in ogni Entity |
| `@GeneratedValue(IDENTITY)` | Auto-generazione ID con strategia IDENTITY (auto-increment) | Tutte le Entity |
| `@Column(name=..., unique, nullable)` | Mapping campo→colonna con vincoli | `@Column(nullable = false, unique = true)` su TavoloEntity.numero |
| `@OneToMany` | Relazione 1→N | `OrdineEntity.items` → un ordine ha molti item |
| `@ManyToOne` | Relazione N→1 | `OrdineItemEntity.ordine` → molti item appartengono a un ordine |
| `mappedBy` | Lato inverso della relazione | `@OneToMany(mappedBy = "ordine")` in OrdineEntity |
| `@JoinColumn` | Specifica la colonna foreign key | `@JoinColumn(name = "ordine_id")` in OrdineItemEntity |
| `cascade = CascadeType.ALL` | Propaga persist/merge/remove alle entità correlate | Se salvo un Ordine, salvo automaticamente i suoi Item |
| `orphanRemoval = true` | Se un Item viene rimosso dalla lista, viene cancellato dal DB | In OrdineEntity sugli items |

**Concetto EntityManager**: in Spring Data JPA NON usiamo direttamente l'EntityManager. I **Repository** (`JpaRepository`) lo wrappano. Internamente, `menuItemRepository.save(entity)` chiama `entityManager.persist(entity)` o `entityManager.merge(entity)`.

**Ciclo di vita delle entità nel progetto:**
- Quando chiamo `repository.save(entity)` → l'entity diventa **managed** (Hibernate traccia i cambiamenti)
- Quando il metodo del Service termina → l'entity diventa **detached**
- `@Transactional` mantiene l'entity managed per tutta la durata della transazione

**DDL Auto (da `persistence.xml` a `application.properties`):**
La teoria parla di `persistence.xml`. In Spring Boot usiamo `application.properties` con `spring.jpa.hibernate.ddl-auto=update` → Hibernate aggiorna le tabelle automaticamente senza perdere i dati.

---

## 4. Spring Framework — IoC e Dependency Injection

### Dalla teoria:
L'**IoC** (Inversion of Control) sposta il controllo della creazione degli oggetti dalla classe stessa a un container esterno (Spring). La **Dependency Injection** è la tecnica che implementa IoC: Spring "inietta" le dipendenze tramite costruttore o setter. "Hollywood Principle: Don't call me, I'll call you."

### Nel progetto:

**DI tramite costruttore** (il metodo raccomandato) — usato ovunque grazie a `@RequiredArgsConstructor` di Lombok:

```java
// In OrdineService.java:
@RequiredArgsConstructor  // Lombok genera il costruttore automaticamente
public class OrdineService {
    private final OrdineMapper ordineMapper;           // ← Spring inietta questa dipendenza
    private final OrdineRepository ordineRepository;   // ← e questa
    private final MenuItemRepository menuItemRepository; // ← e questa
    private final TavoloService tavoloService;          // ← e questa
}
```

Noi NON scriviamo mai `new OrdineRepository()`. È Spring che:
1. Scansiona il pacchetto `com.pubflow` all'avvio
2. Trova tutte le classi con `@Component`, `@Service`, `@Repository`, `@Controller`
3. Le istanzia come **Bean** (oggetti gestiti)
4. Le "inietta" dove servono, analizzando i parametri del costruttore

**Le annotazioni stereotipo (dal programma del prof):**

| Annotazione | Significato nella teoria | File nel progetto |
|---|---|---|
| `@Component` | Bean generico | MenuItemMapper, OrdineMapper, OrdineItemMapper, TavoloMapper, PrenotazioneMapper, DataCleanupRunner |
| `@Service` | Bean di logica di business | MenuItemService, OrdineService, PrenotazioneService, TavoloService |
| `@Repository` | Bean di accesso ai dati (DAO) | MenuItemRepository, OrdineRepository, PrenotazioneRepository, TavoloRepository |
| `@Controller` / `@RestController` | Controller HTTP MVC | MenuItemController, OrdineController, PrenotazioneController, TavoloController, AuthController, TestController |
| `@Configuration` | Classe di configurazione | CorsConfig, SecurityConfig, DataSeeder |

**Scope dei Bean (dalla teoria):** Nel progetto tutti i bean sono **singleton** (default di Spring): una sola istanza per tutta l'applicazione. Ad esempio, esiste un solo `OrdineService` condiviso da tutti i controller che lo richiedono.

---

## 5. Spring Web MVC e @RestController

### Dalla teoria:
Spring MVC usa un `DispatcherServlet` come front controller. Le richieste vengono instradate ai controller basandosi sull'URL. I controller restituiscono viste (HTML) o dati (JSON con `@ResponseBody`).

### Nel progetto:
Usiamo `@RestController` = `@Controller` + `@ResponseBody`. Ogni metodo restituisce direttamente oggetti Java che Spring converte automaticamente in **JSON** (tramite la libreria Jackson inclusa in `spring-boot-starter-web`).

```java
// MenuItemController.java:
@RestController                        // = @Controller + @ResponseBody
@RequestMapping("/pubflow/menu")       // URL base
public class MenuItemController {

    @GetMapping                        // GET /pubflow/menu
    public ResponseEntity<List<MenuItem>> getAll() { ... }

    @PostMapping                       // POST /pubflow/menu
    public ResponseEntity<MenuItem> create(@Valid @RequestBody MenuItem item) { ... }

    @PutMapping("/{id}")               // PUT /pubflow/menu/5
    public ResponseEntity<MenuItem> update(@PathVariable Long id, @Valid @RequestBody MenuItem item) { ... }

    @DeleteMapping("/{id}")            // DELETE /pubflow/menu/5
    public ResponseEntity<Void> delete(@PathVariable Long id) { ... }

    @GetMapping("/page")               // GET /pubflow/menu/page?page=0&size=10&sortField=nome&sortDirection=asc
    public ResponseEntity<Page<MenuItem>> getByPage(
        @RequestParam("page") int page, @RequestParam("size") int size, ...) { ... }
}
```

**`ResponseEntity<T>`** (dalla teoria): wrapper che include il body (dati) + status code HTTP + headers. Permette di controllare esattamente la risposta.

**Validazione (dalla teoria — Bean Validation):**
- `@Valid` su `@RequestBody` → attiva la validazione delle annotazioni Jakarta (`@NotNull`, `@NotBlank`, `@Min`, `@DecimalMin`)
- Se la validazione fallisce → Spring lancia `MethodArgumentNotValidException` → il nostro `RestExceptionHandler` la cattura

**Gestione eccezioni `@RestControllerAdvice`:**
È il `@ExceptionHandler` globale (dalla teoria: gestione centralizzata degli errori). Il file `RestExceptionHandler.java` intercetta tutte le eccezioni dai controller e restituisce risposte HTTP appropriate.

---

## 6. Spring Data JPA (Repository)

### Dalla teoria:
Spring Data JPA crea automaticamente l'implementazione dei repository. Le **Derived Query Methods** generano SQL dal nome del metodo. Le query JPQL sono simili a SQL ma usano nomi di classi Java.

### Nel progetto:

**Derived Query Methods** (il nome del metodo DIVENTA la query SQL):
```java
// MenuItemRepository.java:
List<MenuItemEntity> findByCategoria(String categoria);
// → SELECT * FROM menu_item WHERE categoria = ?

List<MenuItemEntity> findByDisponibileTrueAndQuantitaDisponibileGreaterThan(int q);
// → SELECT * FROM menu_item WHERE disponibile = true AND quantita_disponibile > ?

// PrenotazioneRepository.java:
List<PrenotazioneEntity> findAllByOrderByDataAscOraAsc();
// → SELECT * FROM prenotazione ORDER BY data ASC, ora ASC
```

**Query JPQL personalizzate** (dalla teoria: EJB QL è il predecessore di JPQL):
```java
// OrdineRepository.java:
@Query("UPDATE OrdineEntity o SET o.stato = :stato WHERE o.id = :id")
int updateStato(Long id, String stato);
```
JPQL usa i **nomi delle classi Java** (OrdineEntity), non i nomi delle tabelle SQL (ordine).

**Paginazione** (dalla teoria: `setFirstResult()` e `setMaxResults()`):
```java
// MenuItemService.java:
public Page<MenuItem> getByPage(Pageable pageable) {
    return menuItemRepository.findAll(pageable).map(menuItemMapper::toDto);
}
// Il parametro Pageable contiene page, size, sort → Spring genera LIMIT e OFFSET automaticamente
```

---

## 7. Spring Cache (@Cacheable, @Scheduled)

### Dalla teoria:
La cache evita query ripetitive al database memorizzando i risultati in memoria.

### Nel progetto:
Attivata con `@EnableCaching` in `PubflowApplication.java`.

```java
// MenuItemService.java:
@Cacheable("menuCategoriaCache")                        // SALVA il risultato in cache
public List<MenuItem> getByCategoria(String categoria) { ... }

@CacheEvict(value = "menuCategoriaCache", allEntries = true)  // SVUOTA la cache
@Scheduled(fixedRateString = "${caching.spring.menuCacheTTL}") // ogni 30 secondi
public void emptyMenuCategoriaCache() { ... }
```

Flusso: 1ª chiamata `getByCategoria("PANINI")` → query al DB → risultato salvato in cache. 2ª chiamata → risultato dalla cache (niente DB). Dopo 30 secondi → cache svuotata → prossima chiamata va al DB.

---

## 8. Spring Security

### Dalla teoria:
Spring Security fornisce autenticazione (chi sei?) e autorizzazione (cosa puoi fare?) tramite una catena di filtri.

### Nel progetto — `SecurityConfig.java`:

**Autenticazione HTTP Basic**: il frontend invia `Authorization: Basic base64(user:pass)` nell'header HTTP. Spring decodifica e verifica le credenziali.

**Utenti in-memory** (non da database):
- `admin` / `admin123` → ruolo ADMIN
- `staff` / `staff123` → ruolo STAFF

**Autorizzazione basata su URL e ruoli:**
- GET → pubblici (clienti possono leggere menu, ordini)
- POST ordini/prenotazioni/login → pubblici (clienti senza login)
- PUT/PATCH/DELETE → richiedono autenticazione (`@PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")`)

`BCryptPasswordEncoder` → le password sono criptate con BCrypt (hash one-way, non reversibile).

---

## 9. Angular — Componenti, Moduli, DI

### Dalla teoria:
Angular è un framework basato su **componenti** organizzati in **moduli** (NgModule). Ogni componente ha template (View), classe TypeScript (Controller) e servizio (Model). Angular usa il suo sistema di **Dependency Injection**.

### Nel progetto:

**Il modulo principale** → `app.module.ts`:
- `declarations`: tutti i 7 componenti
- `imports`: `BrowserModule`, `HttpClientModule`, `FormsModule`
- `providers`: `AuthInterceptor`
- `bootstrap`: `AppComponent`

**I componenti e il loro ruolo MVC:**

| Componente | View (.html) | Controller (.ts) | Selettore |
|---|---|---|---|
| AppComponent | app.component.html | app.component.ts | `app-root` (root component) |
| AuthComponent | auth.component.html | auth.component.ts | `app-auth` |
| ServizioComponent | servizio.component.html | servizio.component.ts | `app-servizio` |
| MenuComponent | menu.component.html | menu.component.ts | `app-menu` |
| OrdiniComponent | ordini.component.html | ordini.component.ts | `app-ordini` |
| PrenotazioniComponent | prenotazioni.component.html | prenotazioni.component.ts | `app-prenotazioni` |
| TavoliStaffComponent | tavoli-staff.component.html | tavoli-staff.component.ts | `app-tavoli-staff` |

**DI in Angular** — i servizi sono iniettati tramite costruttore (esattamente come Spring!):
```typescript
// Angular:
constructor(private ordiniService: OrdiniService) {}
// Spring:
public OrdineController(OrdineService ordineService) {}
```

**`@Injectable({providedIn: 'root'})`** → il servizio è un **singleton** (dalla teoria: una sola istanza per tutta l'app), esattamente come lo scope singleton di Spring.

---

## 10. Data Binding e Direttive Angular

### Dalla teoria:
Angular arricchisce l'HTML con: Interpolazione `{{ }}`, Property Binding `[ ]`, Event Binding `( )`, Two-Way Binding `[(ngModel)]`. Le direttive strutturali (*ngIf, *ngFor) modificano il DOM.

### Nel progetto — esempi reali:

```html
<!-- INTERPOLAZIONE: mostra il valore della variabile nel testo -->
<span>{{ clienteNome }} {{ clienteCognome }}</span>
<div>€ {{ ordine.totale | number:'1.2-2' }}</div>

<!-- PROPERTY BINDING: il valore dell'attributo dipende da una variabile TypeScript -->
<button [disabled]="!canPay()">Paga</button>
<input [attr.min]="prenotazioneMinDate" [attr.max]="prenotazioneMaxDate">
<div [hidden]="vistaAttiva !== 'servizio'">

<!-- EVENT BINDING: al click, chiama un metodo TypeScript -->
<button (click)="aggiungi(item)">+</button>
<button (click)="pagaConto()">Paga Subito</button>
<details (toggle)="onTavoliToggle($event, tavoliComp)">

<!-- TWO-WAY BINDING: l'input e la variabile sono sincronizzati -->
<input [(ngModel)]="clienteNome">     <!-- l'utente scrive → clienteNome si aggiorna -->
<select [(ngModel)]="clienteTipo">    <!-- l'utente seleziona → clienteTipo cambia -->

<!-- *ngIf: mostra/nasconde elementi -->
<div *ngIf="step === 'login'">...visibile solo al login...</div>
<div *ngIf="clienteTipo === 'TAVOLO'">...visibile solo per TAVOLO...</div>
<p *ngIf="erroreLogin">{{ erroreLogin }}</p>

<!-- *ngFor: ripete per ogni elemento -->
<article *ngFor="let ordine of ordini; let i = index">
  <h3>Ordine #{{ ordine.numeroOrdine || (i + 1) }}</h3>
</article>
<li *ngFor="let item of ordine.items">{{ item.menuItemNome }}</li>
```

---

## 11. Comunicazione @Input/@Output

### Dalla teoria:
`@Input()` per passare dati dal padre al figlio. `@Output()` con `EventEmitter` per emettere eventi dal figlio al padre.

### Nel progetto:

**@Input (padre → figlio):**
```html
<!-- In app.component.html (padre): -->
<app-ordini [accesso]="accesso" [cliente]="clienteInfo"></app-ordini>
```
```typescript
// In ordini.component.ts (figlio):
@Input() accesso: 'staff' | 'cliente' | '' = '';
@Input() cliente: ClienteInfo | null = null;
```

**@Output (figlio → padre):**
```typescript
// In auth.component.ts (figlio):
@Output() loginChange = new EventEmitter<boolean>();
// Quando il login va a buon fine:
this.loginChange.emit(true);
```
```html
<!-- In app.component.html (padre): -->
<app-auth (loginChange)="confermaLoginStaff($event)"></app-auth>
<!-- $event contiene il valore emesso (true/false) -->
```

---

## 12. Observable, HttpClient e Interceptor (RxJS)

### Dalla teoria:
`HttpClient` restituisce **Observable** (flussi asincroni). Gli Observable emettono valori nel tempo e sono cancellabili. Gli **Interceptor** intercettano globalmente le richieste/risposte HTTP.

### Nel progetto:

**Observable e subscribe** (in ogni servizio):
```typescript
this.ordiniService.getAll().subscribe({
  next: (ordini) => { this.ordini = ordini; },  // Successo: elabora i dati
  error: (err) => { this.errorMessage = 'Errore'; }  // Errore: mostra messaggio
});
```
`.subscribe()` è il momento in cui la richiesta HTTP viene effettivamente inviata. Senza subscribe, la richiesta non parte mai.

**forkJoin** (dalla teoria sugli Observable: combinare più flussi):
```typescript
// menu.component.ts — salva tutte le modifiche in parallelo:
forkJoin(
  updates.map(item => this.menuService.update(item.id, item))
).subscribe({ next: (results) => { /* tutte le risposte sono arrivate */ } });
```

**Interceptor** → `auth.interceptor.ts`:
```typescript
intercept(req, next) {
  const authHeader = this.authService.getAuthorizationHeader();
  if (!authHeader) return next.handle(req);     // Nessuna credenziale → passa così com'è
  const clone = req.clone({ setHeaders: { Authorization: authHeader } });
  return next.handle(clone);                     // Aggiunge header e passa
}
```
Registrato in `app.module.ts` come `HTTP_INTERCEPTORS`. **Ogni** richiesta HTTP dell'app attraversa questo interceptor.

---

## 13. Pipe (Trasformazione dati)

### Dalla teoria:
Le Pipe trasformano i dati nel template senza modificare il valore originale. Pipe built-in: `uppercase`, `lowercase`, `date`, `number`.

### Nel progetto:
```html
{{ item.prezzo | number:'1.2-2' }}         <!-- 5.5 → "5.50" -->
{{ gruppo.categoria | lowercase }}          <!-- "PANINI" → "panini" -->
{{ ordine.totale | number:'1.2-2' }}       <!-- 12.345 → "12.35" -->
```

---

## 14. Lifecycle Hooks

### Dalla teoria:
Angular offre metodi del ciclo di vita: `ngOnInit()`, `ngOnChanges()`, `ngOnDestroy()`.

### Nel progetto:
```typescript
// ordini.component.ts:
ngOnInit(): void {
  this.loadOrdini();                                          // Carica dati all'avvio
  this.refreshInterval = setInterval(() => this.loadOrdini(true), 5000); // Polling
}
ngOnDestroy(): void {
  clearInterval(this.refreshInterval);                         // Ferma il polling
}

// servizio.component.ts:
ngOnChanges(changes: SimpleChanges): void {
  if (changes['loginData']) { this.prefillFromLogin(...); }    // Reagisce ai cambi di @Input
}
```

---

## 15. Form Template-driven

### Dalla teoria:
I form Template-driven usano `ngModel` nel template. Angular traccia lo stato dei campi (touched/dirty/valid).

### Nel progetto:
Usiamo `FormsModule` e `[(ngModel)]` per tutti i form (login cliente, login staff, prenotazione, ecc.):
```html
<input type="text" [(ngModel)]="clienteNome" placeholder="Nome">
<select [(ngModel)]="clienteTipo">
  <option value="TAVOLO">Ordine al tavolo</option>
</select>
```
La validazione è fatta **manualmente** in TypeScript (nel metodo `confermaLoginCliente()`) con if/else, non con i validatori Angular built-in. Questa è una scelta architetturale per semplicità.
