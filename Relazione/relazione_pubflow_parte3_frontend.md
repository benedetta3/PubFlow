# 📘 Relazione PubFlow — Parte 3: FRONTEND (Angular)

---

## 1. Cos'è Angular e come funziona

Angular è un **framework** per costruire interfacce web interattive. Il codice si scrive in **TypeScript** (JavaScript con i tipi).

L'app è composta da **componenti**. Ogni componente ha 3 file:

| File | Contenuto |
|---|---|
| `nome.component.ts` | **Logica**: variabili, metodi, chiamate API |
| `nome.component.html` | **Template**: l'HTML che l'utente vede nel browser |
| `nome.component.css` | **Stile**: come appare (colori, dimensioni, layout) |

---

## 2. Guida completa all'HTML

HTML (HyperText Markup Language) descrive la **struttura** della pagina con **tag**:

```html
<tag attributo="valore">contenuto testuale o altri tag</tag>
```

### Tag principali usati nel progetto:

| Tag | Cosa rappresenta | Esempio |
|---|---|---|
| `<div>` | Contenitore generico (blocco, va a capo) | `<div class="card">...contenuto...</div>` |
| `<span>` | Contenitore generico (inline, resta sulla stessa riga) | `<span class="badge">PRONTO</span>` |
| `<h1>` ... `<h4>` | Titoli (h1=grande, h4=piccolo) | `<h1>The Cave Pub</h1>` |
| `<p>` | Paragrafo di testo | `<p>Seleziona gli articoli</p>` |
| `<a href="URL">` | Link cliccabile | `<a href="javascript:void(0)">Accesso Staff</a>` |
| `<img src="..." alt="...">` | Immagine. `alt` = testo alternativo se l'immagine non carica | `<img src="assets/pub.jpg" alt="Pub">` |
| `<button type="button">` | Pulsante cliccabile | `<button (click)="salva()">Salva</button>` |
| `<input type="text">` | Campo di testo | `<input [(ngModel)]="nome" placeholder="Mario">` |
| `<input type="number">` | Campo numerico (con frecce ± nel browser) | `<input [(ngModel)]="persone" min="1">` |
| `<input type="date">` | Selettore data (calendario del browser) | `<input [(ngModel)]="data">` |
| `<input type="time">` | Selettore orario | `<input [(ngModel)]="ora" min="19:30" max="23:00">` |
| `<input type="password">` | Campo password (testo nascosto con •••) | `<input [(ngModel)]="password">` |
| `<select>` + `<option>` | Menu a tendina (dropdown) | Vedi sotto |
| `<label>` | Etichetta per un campo input | `<label>Nome <input ...></label>` |
| `<section>` | Sezione logica della pagina | `<section class="card">...</section>` |
| `<article>` | Contenuto autonomo ripetibile | `<article class="order">...</article>` |
| `<header>` | Intestazione/barra superiore | `<header class="dash-header">...</header>` |
| `<main>` | Contenuto principale della pagina | `<main class="dash-content">...</main>` |
| `<nav>` | Navigazione (bottoni, link) | `<nav class="dash-nav">...</nav>` |
| `<aside>` | Contenuto laterale/secondario | `<aside class="cart">...</aside>` (carrello) |
| `<details>` + `<summary>` | Accordion (sezione espandibile) | Click su `<summary>` apre/chiude il contenuto |
| `<ul>` + `<li>` | Lista puntata (non ordinata) | `<ul><li>Birra x2</li><li>Panino x1</li></ul>` |

**Esempio di `<select>`:**
```html
<select [(ngModel)]="clienteTipo">
  <option value="">Tipo servizio...</option>      <!-- Opzione vuota di default -->
  <option value="TAVOLO">Ordine al tavolo</option>
  <option value="ASPORTO">Asporto</option>
</select>
```
Quando l'utente seleziona "Asporto", la variabile `clienteTipo` diventa `"ASPORTO"`.

**Attributi importanti:**
- `class="nome"` → associa una classe CSS per lo stile
- `placeholder="testo"` → testo grigio suggerito dentro un input vuoto
- `min="1"` / `max="10"` → valori minimi/massimi per input numerici
- `maxlength="4"` → massimo 4 caratteri (usato per il codice segreto)
- `disabled` → rende l'elemento non cliccabile/modificabile
- `style="..."` → stile CSS inline (direttamente sull'elemento)

---

## 3. Concetti Angular usati nei template

### 3.1 Data binding

| Sintassi | Nome | Direzione | Esempio |
|---|---|---|---|
| `{{ variabile }}` | Interpolazione | TS→HTML | `{{ clienteNome }}` — mostra il valore della variabile nel testo |
| `[attributo]="expr"` | Property binding | TS→HTML | `[disabled]="!canPay()"` — il bottone è disabilitato se canPay() è false |
| `(evento)="metodo()"` | Event binding | HTML→TS | `(click)="aggiungi(item)"` — al click, chiama il metodo `aggiungi` |
| `[(ngModel)]="var"` | Two-way binding | TS↔HTML | `[(ngModel)]="clienteNome"` — quando l'utente scrive nel campo, la variabile si aggiorna; e viceversa |

### 3.2 Direttive strutturali

```html
<!-- *ngIf: mostra l'elemento SOLO SE la condizione è vera -->
<div *ngIf="step === 'login'">
  Questo blocco è visibile solo durante il login
</div>

<!-- *ngFor: ripete l'elemento per ogni item della lista -->
<article *ngFor="let ordine of ordini; let i = index">
  <h3>Ordine #{{ ordine.numeroOrdine || (i + 1) }}</h3>
</article>

<!-- Classi CSS condizionali -->
<div [class.occupato]="t.stato === 'OCCUPATO'">
  Se il tavolo è occupato, aggiunge la classe CSS "occupato" (colore rosso)
</div>

<!-- Stile dinamico -->
<div [style.grid-area]="'t' + t.numero">
  Imposta grid-area a "t1", "t2", ecc. in base al numero del tavolo
</div>
```

### 3.3 Pipe (trasformazioni)

```html
{{ prezzo | number:'1.2-2' }}    <!-- Formatta: 5.5 → 5.50 -->
{{ categoria | lowercase }}       <!-- Converte: PANINI → panini -->
```

### 3.4 Decoratori Angular

| Decoratore | Dove | Significato |
|---|---|---|
| `@Component({selector, templateUrl, styleUrls})` | Classe | "Questa classe è un componente con questo selector HTML, template e stile" |
| `@NgModule({declarations, imports, providers, bootstrap})` | Classe | "Questo è un modulo Angular che raggruppa componenti e servizi" |
| `@Injectable({providedIn: 'root'})` | Classe Service | "Questa classe è un servizio singleton (una sola istanza per tutta l'app)" |
| `@Input()` | Proprietà | "Questa proprietà riceve dati dal componente padre" |
| `@Output()` | EventEmitter | "Questa proprietà emette eventi verso il componente padre" |

### 3.5 Lifecycle hooks

| Metodo | Quando viene chiamato |
|---|---|
| `ngOnInit()` | Una volta, quando il componente viene creato (utile per caricare dati iniziali) |
| `ngOnChanges(changes)` | Ogni volta che un `@Input()` cambia valore |
| `ngOnDestroy()` | Quando il componente viene distrutto (utile per fermare timer, polling) |

---

## 4. app.module.ts — Il modulo principale

```typescript
@NgModule({
  declarations: [          // TUTTI i componenti dell'app
    AppComponent,          // Orchestratore principale
    MenuComponent,         // Gestione menu (staff)
    OrdiniComponent,       // Lista ordini con avanzamento stati
    PrenotazioniComponent, // Lista prenotazioni
    AuthComponent,         // Form login staff
    ServizioComponent,     // Vista cliente (menu, carrello, ordini)
    TavoliStaffComponent,  // Planimetria del locale
    GestioneStaffComponent // Dashboard amministratore per assunzioni
  ],
  imports: [               // Moduli Angular necessari
    BrowserModule,         // Funzionalità base del browser
    HttpClientModule,      // Per fare chiamate HTTP (HttpClient)
    FormsModule            // Per usare [(ngModel)] nei form
  ],
  providers: [             // Servizi e configurazioni
    {
      provide: HTTP_INTERCEPTORS,   // Registra l'interceptor
      useClass: AuthInterceptor,     // che aggiunge l'header Authorization
      multi: true                    // "può coesistere con altri interceptor"
    }
  ],
  bootstrap: [AppComponent]  // Il primo componente caricato
})
export class AppModule { }
```

---

## 5. I Modelli TypeScript (shared/models/)

```typescript
// menu-item.ts
export interface MenuItem {
  id?: number;            // ? = opzionale (può essere undefined)
  nome: string;
  descrizione?: string;
  prezzo: number;
  categoria: string;
  disponibile: boolean;
  quantitaDisponibile: number;
  custom?: boolean;
}

// ordine.ts
export interface Ordine {
  id?: number;
  numeroOrdine: number;
  dataOra?: string;
  tipoOrdine: string;
  nomeCliente?: string;
  stato: string;
  totale: number;
  telefonoCliente?: string;
  numeroTavolo?: number | null;      // number oppure null
  indirizzoConsegna?: string | null;
  items?: OrdineItem[];
}

// ordine-item.ts
export interface OrdineItem {
  id?: number;
  menuItemId: number;
  menuItemNome?: string;
  quantita: number;
  note?: string;
}

// prenotazione.ts
export interface Prenotazione {
  id?: number;
  numeroPrenotazione: number;
  nomeCliente: string;
  telefonoCliente?: string;
  numeroPersone: number;
  data: string;
  ora: string;
  stato: string;
}
```

`interface` in TypeScript definisce solo la **struttura** dei dati (quali campi ci sono e di che tipo). Non contiene codice. Sono l'equivalente frontend dei DTO Java.

---

## 6. I Servizi (shared/services/)

### 6.1 AuthService.ts

```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  private credentials: AuthCredentials | null = null;

  constructor(private http: HttpClient) {
    // Al caricamento, controlla se ci sono credenziali salvate nel browser
    const saved = localStorage.getItem('pubflow.auth');
    if (saved) this.credentials = JSON.parse(saved);
  }

  setCredentials(cred: AuthCredentials): void {
    this.credentials = cred;
    localStorage.setItem('pubflow.auth', JSON.stringify(cred));
  }

  getAuthorizationHeader(): string | null {
    if (!this.credentials) return null;
    // Codifica "username:password" in Base64 per HTTP Basic Auth
    const token = btoa(`${this.credentials.username}:${this.credentials.password}`);
    return `Basic ${token}`;
  }

  verifyCredentials(cred: AuthCredentials): Observable<boolean> {
    const token = btoa(`${cred.username}:${cred.password}`);
    const headers = new HttpHeaders({ Authorization: `Basic ${token}` });
    return this.http.get('http://localhost:8080/pubflow/auth/me',
                         { headers, observe: 'response' })
      .pipe(map(response => response.status === 200));
  }
}
```

- `localStorage` → memoria persistente del browser. I dati restano anche chiudendo il tab
- `btoa()` → codifica una stringa in Base64 (es. `admin:admin123` → `YWRtaW46YWRtaW4xMjM=`)
- `Observable<boolean>` → un "futuro valore" di tipo boolean. La chiamata HTTP è asincrona
- `.pipe(map(...))` → trasforma il risultato dell'Observable: dall'intera risposta HTTP estrae solo se lo status è 200

### 6.2 AuthInterceptor.ts

```typescript
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const authHeader = this.authService.getAuthorizationHeader();
    if (!authHeader) {
      return next.handle(req);  // Nessuna credenziale → passa la richiesta così com'è
    }
    // Clona la richiesta aggiungendo l'header Authorization
    const clone = req.clone({
      setHeaders: { Authorization: authHeader }
    });
    return next.handle(clone);  // Passa la richiesta modificata
  }
}
```

L'interceptor è un **middleware**: si mette "in mezzo" tra il codice dell'app e il server. **Ogni** richiesta HTTP passa di qui. Se l'utente è loggato come staff, aggiunge automaticamente `Authorization: Basic YWRtaW46YWRtaW4xMjM=` all'header, così il backend sa chi sta facendo la richiesta.

### 6.3 MenuService, OrdiniService, PrenotazioniService, TavoliService

Tutti seguono lo stesso pattern:

```typescript
@Injectable({ providedIn: 'root' })
export class OrdiniService {
  private readonly baseUrl = 'http://localhost:8080/pubflow/ordini';
  constructor(private http: HttpClient) {}

  getAll(): Observable<Ordine[]> {
    return this.http.get<Ordine[]>(this.baseUrl);
    // → GET http://localhost:8080/pubflow/ordini
  }

  create(ordine: Partial<Ordine>): Observable<Ordine> {
    return this.http.post<Ordine>(this.baseUrl, ordine);
    // → POST http://localhost:8080/pubflow/ordini con body JSON
  }

  aggiornaStato(id: number, stato: string): Observable<number> {
    return this.http.patch<number>(`${this.baseUrl}/${id}/stato`, null, {
      params: { stato }
    });
    // → PATCH http://localhost:8080/pubflow/ordini/5/stato?stato=PRONTO
  }

  pagaOrdiniTavolo(numeroTavolo: number): Observable<number> {
    return this.http.post<number>(`${this.baseUrl}/tavolo/${numeroTavolo}/paga`, {});
    // → POST http://localhost:8080/pubflow/ordini/tavolo/3/paga
  }
}
```

**Il TavoliService ha anche:**
```typescript
loginCliente(codice: string): Observable<any> {
  return this.http.post<any>(`${this.baseUrl}/login?codice=${codice}`, {});
  // → POST http://localhost:8080/pubflow/tavoli/login?codice=1234
}
```

---

## 7. AppComponent — L'orchestratore

### 7.1 app.component.ts (logica)

Variabili di stato principali e cosa controllano:

| Variabile | Valori | Controlla |
|---|---|---|
| `accesso` | `'staff'`, `'cliente'` | Chi sta usando l'app |
| `step` | `'login'`, `'servizi'` | Login oppure dashboard |
| `clienteTipo` | `'TAVOLO'`, `'PRENOTAZIONE'`, `'ASPORTO'`, `'DOMICILIO'`, `''` | Tipo di servizio scelto |
| `vistaAttiva` | `'servizio'`, `'conto'` | Menu o vista conto |
| `contoPagato` | `true/false` | Se ha già pagato |

**`confermaLoginCliente()`** — il metodo di validazione più lungo:
1. Controlla che nome, cognome e tipo siano compilati
2. Per **TAVOLO**: verifica che il codice segreto sia 4 caratteri, chiama `tavoliService.loginCliente(codice)` per verificarlo con il backend
3. Per **PRENOTAZIONE**: verifica telefono (10 cifre), data (non passata, entro 3 mesi), ora (19:30 - 23:00)
4. Per **DOMICILIO**: verifica telefono, indirizzo, comune (solo Rende), provincia (CS/Cosenza)
5. Per **ASPORTO**: verifica telefono
6. Se tutto OK → `step = 'servizi'` (mostra la dashboard)

### 7.2 app.component.html (template)

**Struttura ad alto livello con `*ngIf`:**

```
<div class="app-shell">

  <!-- HERO con immagine: visibile solo durante il login -->
  <div *ngIf="step !== 'servizi'">  ...immagine pub...  </div>

  <!-- FORM LOGIN: visibile solo durante il login -->
  <div *ngIf="step === 'login'">
    <!-- Se accesso='staff' → mostra AuthComponent -->
    <app-auth *ngIf="accesso === 'staff'" (loginChange)="confermaLoginStaff($event)">
    </app-auth>

    <!-- Se accesso='cliente' → mostra form con campi dinamici -->
    <section *ngIf="accesso === 'cliente'">
      ... campi nome, cognome, tipo ...
      <div *ngIf="clienteTipo === 'TAVOLO'">  ...campo codice segreto...  </div>
      <div *ngIf="clienteTipo === 'PRENOTAZIONE'">  ...campi data, ora...  </div>
      <div *ngIf="clienteTipo === 'DOMICILIO'">  ...campi indirizzo...  </div>
      <button (click)="confermaLoginCliente()">Accedi</button>
    </section>
  </div>

  <!-- DASHBOARD STAFF: visibile dopo login staff -->
  <div *ngIf="step === 'servizi' && accesso === 'staff'">
    <details><summary>Planimetria</summary>
      <app-tavoli-staff #tavoliComp></app-tavoli-staff>
    </details>
    <details><summary>Prenotazioni</summary>
      <app-prenotazioni [accesso]="accesso" [cliente]="clienteInfo">
      </app-prenotazioni>
    </details>
    <details><summary>Ordini</summary>
      <app-ordini [accesso]="accesso" [cliente]="clienteInfo">
      </app-ordini>
    </details>
    <details><summary>Gestione Menu</summary>
      <app-menu></app-menu>
    </details>
  </div>

  <!-- DASHBOARD CLIENTE: visibile dopo login cliente -->
  <div *ngIf="step === 'servizi' && accesso === 'cliente'">
    <app-servizio [loginData]="clienteLoginData"
                  (ordineInviatoEvent)="aggiungiOrdine($event)">
    </app-servizio>

    <!-- VISTA CONTO -->
    <section *ngIf="vistaAttiva === 'conto'">
      <div *ngFor="let ord of clientOrders">
        ...dettagli ordine, stato, totale...
      </div>
      <button (click)="pagaConto()" [disabled]="!canPay()">Paga</button>
      <div *ngIf="contoPagato">  ...codice a barre per uscita...  </div>
    </section>
  </div>
</div>
```

**Comunicazione padre → figlio (`@Input`):**
```html
<app-ordini [accesso]="accesso" [cliente]="clienteInfo"></app-ordini>
```
Passa le variabili `accesso` e `clienteInfo` di AppComponent al componente OrdiniComponent tramite `@Input()`.

**Comunicazione figlio → padre (`@Output`):**
```html
<app-auth (loginChange)="confermaLoginStaff($event)"></app-auth>
```
Quando AuthComponent emette l'evento `loginChange`, AppComponent esegue `confermaLoginStaff()` con il valore emesso (`$event` = true/false).

---

## 8. ServizioComponent — Vista completa del cliente

Lo step iniziale (`dati`) normalmente non si vede perché AppComponent precompila i dati tramite `@Input() loginData` e chiama direttamente `avvia()`.

**Il carrello** (`CarrelloItem[]`):
```typescript
interface CarrelloItem {
  idLocale: number;                // ID univoco locale (non del DB)
  item: MenuItem;                   // Il prodotto del menu
  quantita: number;                 // Sempre 1 (ogni articolo è un'istanza separata)
  ingredientiDisponibili: string[]; // Lista ingredienti del panino
  ingredientiEsclusi: string[];     // Ingredienti rimossi dal cliente
}
```

Per i **panini**, la descrizione viene splittata per virgola per estrarre gli ingredienti:
```typescript
parseIngredienti(item: MenuItem): string[] {
  if (item.categoria !== 'PANINI') return [];
  return item.descrizione.split(',').map(s => s.trim());
  // "Panino, hamburger, cheddar, pomodoro" → ["Panino", "Hamburger", "Cheddar", "Pomodoro"]
}
```

**`inviaInCucina()`** — costruisce il JSON e lo invia:
```typescript
const payload = {
  tipoOrdine: this.tipo,           // "TAVOLO"
  nomeCliente: "Mario Rossi",
  telefonoCliente: "3331234567",
  numeroTavolo: 3,
  items: [
    { menuItemId: 5, quantita: 1, note: "Senza pomodoro" },
    { menuItemId: 12, quantita: 1 }
  ]
};
this.ordiniService.create(payload).subscribe({
  next: (created) => { this.step = 'conferma'; },
  error: (err) => { this.errorMessage = err.error?.error; }
});
```

---

## 9. OrdiniComponent — Gestione ordini (staff)

**Auto-refresh**: si aggiorna ogni 5 secondi con `setInterval(() => this.loadOrdini(true), 5000)`. Il parametro `silent=true` evita di mostrare "Caricamento..." durante il refresh automatico.

**Il flusso degli stati con bottoni:**
```html
<button *ngFor="let step of getStepList(ordine)"
        [class.done]="isStepCompleted(ordine, step.stato)"
        [disabled]="!canMoveTo(ordine, step.stato)"
        (click)="aggiornaStato(ordine, step.stato)">
  {{ step.label }}
</button>
```

Per ogni ordine, mostra i bottoni: "In preparazione" → "Pronto" → "Consegnato". Il bottone attivo è solo il **prossimo** nella sequenza. Quelli già completati hanno la classe `done` (stile diverso). `canMoveTo()` verifica che la transizione sia valida (stessa logica del backend).

**`getTotaleSerata()`**: somma i totali di tutti gli ordini pagati + asporto + domicilio.

---

## 10. MenuComponent — Gestione menu (staff)

**Batch update con `forkJoin`:**
```typescript
saveChanges(): void {
  const updates = Array.from(this.pendingUpdates.values());
  forkJoin(
    updates.map(item => this.menuService.update(item.id, item))
  ).subscribe({ next: (results) => { ... } });
}
```
`forkJoin` è un operatore RxJS che esegue **tutte le chiamate HTTP in parallelo** e aspetta che **tutte** siano completate prima di eseguire il callback `next`. Così le 10 modifiche di quantità vengono inviate al backend con un solo "salva".

---

## 11. TavoliStaffComponent — Planimetria

```html
<div class="floor-container">
  <div class="wall-label entrata">ENTRATA</div>
  <div class="wall-label cucina">CUCINA</div>
  <div class="wall-label cassa">CASSA</div>

  <div *ngFor="let t of tavoli"
       class="tavolo"
       [class.t4]="t.capienza === 4"
       [class.t6]="t.capienza === 6"
       [class.t10]="t.capienza === 10"
       [class.occupato]="t.stato === 'OCCUPATO'"
       [style.grid-area]="'t' + t.numero">
    <span class="t-num">{{ t.numero }}</span>
    <span class="t-code">{{ t.codiceSegreto }}</span>
  </div>
</div>
```

Questa è una **planimetria grafica** del locale costruita con **CSS Grid**. Ogni tavolo è posizionato in un'area specifica della griglia. I colori indicano: verde = libero, rosso = occupato. La dimensione del cerchio indica la capienza (small/medium/large). Il codice segreto è visibile sotto il numero del tavolo.

Polling ogni 5 secondi: `ngOnInit() { this.polling = setInterval(() => this.caricaTavoli(), 5000); }`. Viene fermato con `ngOnDestroy() { clearInterval(this.polling); }`.

---

## 12. GestioneStaffComponent — Gestione Risorse Umane (Admin)

Pensato unicamente per colui che si è loggato con ruolo `ADMIN` (cioè la proprietaria "betcal"). Mostra a video una tabella moderna che riepiloga tutto lo staff presente nel database.
Il componente sfrutta un form reattivo per "assumere" nuovi cassieri/dipendenti:
- Basta inserire nome e cognome.
- La generazione dell'**username** (`prime 3 lettere del nome + prime 3 del cognome`) aiuta la standardizzazione aziendale (es. Emanuele Bianchi = `emabian`).
- È previsto un pulsante **"Licenzia"** che lancia una `DELETE` al backend, destituendo irrevocabilmente le credenziali di default associate alla persona.

---

## 13. Schema completo dei collegamenti

```
                    ┌──────────────────────────────────────────┐
                    │            AppComponent                   │
                    │  (orchestratore, gestisce step e login)   │
                    └──┬───────┬──────────┬──────────┬─────────┘
                       │       │          │          │
            [loginData]│  (loginChange)   │[accesso] │[accesso]
                       │       │          │[cliente] │[cliente]
                       ▼       ▼          ▼          ▼
              ┌──────────┐ ┌──────┐ ┌─────────┐ ┌─────────┐ ┌──────────┐
              │Servizio  │ │ Auth │ │ Ordini  │ │Prenot.  │ │TavoliStaff│
              │Component │ │Comp. │ │Component│ │Component│ │Component │
              └────┬─────┘ └──────┘ └────┬────┘ └────┬────┘ └────┬─────┘
                   │                     │           │            │
                   ▼                     ▼           ▼            ▼
              ┌─────────┐          ┌─────────┐ ┌─────────┐  ┌─────────┐
              │Menu     │          │Ordini   │ │Prenot.  │  │Tavoli   │
              │Service  │          │Service  │ │Service  │  │Service  │
              └────┬────┘          └────┬────┘ └────┬────┘  └────┬────┘
                   │                    │           │             │
                   ▼ HTTP              ▼ HTTP      ▼ HTTP       ▼ HTTP
        ┌────────────────────────────────────────────────────────────────┐
        │                    BACKEND (porta 8080)                        │
        │  MenuItemController  OrdineController  Prenotaz.  Tavolo      │
        │       ↓                    ↓              ↓          ↓        │
        │  MenuItemService    OrdineService   Prenot.Service TavoloServ │
        │       ↓                    ↓              ↓          ↓        │
        │  MenuItemRepository OrdineRepository  Prenot.Repo TavoloRepo │
        │       ↓                    ↓              ↓          ↓        │
        │                     DATABASE H2                               │
        └────────────────────────────────────────────────────────────────┘
```

`[...]` = `@Input` (dato passato dal padre al figlio)
`(...)` = `@Output` (evento emesso dal figlio al padre)
`→ HTTP` = chiamata REST al backend
