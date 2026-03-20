import { Component, EventEmitter, Output, Input, OnChanges, SimpleChanges } from '@angular/core';
import { MenuService } from '../shared/services/menu.service';
import { MenuItem } from '../shared/models/menu-item';
import { PrenotazioniService } from '../shared/services/prenotazioni.service';
import { OrdiniService } from '../shared/services/ordini.service';

export type TipoServizio = 'TAVOLO' | 'PRENOTAZIONE' | 'ASPORTO' | 'DOMICILIO' | '';

interface CarrelloItem {
  idLocale: number;
  item: MenuItem;
  quantita: number;
  ingredientiDisponibili: string[];   // tutti gli ingredienti del panino
  ingredientiEsclusi: string[];       // ingredienti tolti dal cliente
}

export interface OrdineEffettuato {
  id: number;
  items: Array<{ nome: string; quantita: number; prezzo: number; note?: string }>;
  totale: number;
  dataOra: Date;
}

export interface ClienteInfo {
  nome: string;
  cognome: string;
  telefono?: string;
  numeroTavolo?: number | null;
}

export interface ClienteLoginData {
  nome: string;
  cognome: string;
  tipo: TipoServizio;
  numeroTavolo?: number | null;
  prenotazionePersone?: number | null;
  prenotazioneData?: string;
  prenotazioneOra?: string;
  telefono?: string;
  indirizzo?: string;
  comune?: string;
  provincia?: string;
}

interface CarrelloRecoveryItem {
  menuItemId: number;
  ingredientiEsclusi: string[];
}

@Component({
  selector: 'app-servizio',
  templateUrl: './servizio.component.html',
  styleUrls: ['./servizio.component.css']
})
export class ServizioComponent implements OnChanges {
  @Input() loginData: ClienteLoginData | null = null;
  @Input() contoPagato = false;
  @Output() clienteChange = new EventEmitter<ClienteInfo | null>();
  @Output() ordineInviatoEvent = new EventEmitter<OrdineEffettuato>();

  nome = '';
  cognome = '';
  tipo: TipoServizio = '';

  numeroTavolo: number | null = null;
  prenotazionePersone: number | null = null;
  prenotazioneData = '';
  prenotazioneOra = '';
  prenotazioneConfermata = false;

  telefono = '';
  indirizzo = '';
  comune = '';
  provincia = '';

  step: 'dati' | 'menu' | 'conferma' | 'risultato' = 'dati';
  menu: MenuItem[] = [];
  menuRaggruppato: Array<{ categoria: string; items: MenuItem[] }> = [];
  menuLoading = false;
  errorMessage = '';

  carrello: CarrelloItem[] = [];
  carrelloAperto = false;
  ordineInviato = false;

  // Pannello ingredienti
  // (rimosso: lista sempre visibile per i panini)

  private ordineCounter = 0;
  private readonly aperturaOra = '19:30';
  private readonly chiusuraOra = '23:00';
  private readonly recoveryKey = 'pubflow_cart_recovery';
  private readonly recoveryTtlMs = 2 * 60 * 60 * 1000;

  constructor(
    private menuService: MenuService,
    private prenotazioniService: PrenotazioniService,
    private ordiniService: OrdiniService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['loginData'] && this.loginData) {
      this.prefillFromLogin(this.loginData);
    }
    if (changes['contoPagato'] && this.contoPagato) {
      this.clearRecoveryState();
    }
  }

  avvia(): void {
    this.errorMessage = '';
    this.prenotazioneConfermata = false;

    if (!this.nome.trim() || !this.cognome.trim() || !this.tipo) {
      this.errorMessage = 'Inserisci nome, cognome e scegli il servizio.';
      return;
    }

    if (this.tipo === 'PRENOTAZIONE') {
      if (!this.prenotazionePersone || !this.prenotazioneData || !this.prenotazioneOra || !this.telefono.trim()) {
        this.errorMessage = 'Compila numero persone, data, ora e telefono.';
        return;
      }
      if (!/^\d{10}$/.test(this.telefono.trim())) {
        this.errorMessage = 'Il numero di telefono deve contenere esattamente 10 cifre.';
        return;
      }
      const prenotazioneError = this.validaPrenotazione();
      if (prenotazioneError) {
        this.errorMessage = prenotazioneError;
        return;
      }
      return;
    }

    if (this.tipo === 'TAVOLO') {
      if (!this.numeroTavolo) {
        this.errorMessage = 'Inserisci il numero del tavolo.';
        return;
      }
    }

    if (this.tipo === 'ASPORTO') {
      if (!this.telefono.trim()) {
        this.errorMessage = 'Inserisci il numero di telefono per l\'asporto.';
        return;
      }
      if (!/^\d{10}$/.test(this.telefono.trim())) {
        this.errorMessage = 'Il numero di telefono deve contenere esattamente 10 cifre.';
        return;
      }
    }

    if (this.tipo === 'DOMICILIO') {
      if (!this.telefono.trim() || !this.indirizzo.trim() || !this.comune.trim() || !this.provincia.trim()) {
        this.errorMessage = 'Compila telefono, indirizzo, comune e provincia.';
        return;
      }
      if (!/^\d{10}$/.test(this.telefono.trim())) {
        this.errorMessage = 'Il numero di telefono deve contenere esattamente 10 cifre.';
        return;
      }
      if (this.comune.trim().toLowerCase() !== 'rende') {
        this.errorMessage = 'Consegniamo solo nel comune di Rende.';
        return;
      }
      const provinciaNorm = this.provincia.trim().toLowerCase();
      if (provinciaNorm !== 'cs' && provinciaNorm !== 'cosenza') {
        this.errorMessage = 'La provincia deve essere Cosenza (CS).';
        return;
      }
    }

    this.emitClienteInfo();
    this.apriMenu();
  }

  verificaDisponibilita(): string {
    if (!this.prenotazioneOra) {
      return '';
    }
    if (!this.isOrarioApertura(this.prenotazioneOra)) {
      return 'Orario di apertura: 19:30 - 23:00.';
    }
    const ora = this.prenotazioneOra.slice(0, 2);
    const oraNum = Number(ora);
    if (oraNum >= 20 && oraNum <= 21 && (this.prenotazionePersone ?? 0) > 200) {
      return 'Pieno per quell\'ora (troppi posti occupati).';
    }
    return 'Disponibile';
  }

  confermaPrenotazione(): void {
    if (!this.nome.trim() || !this.cognome.trim() || !this.prenotazionePersone || !this.prenotazioneData || !this.prenotazioneOra || !this.telefono.trim()) {
      this.errorMessage = 'Compila tutti i campi prima di confermare la prenotazione.';
      return;
    }

    if (!/^\d{10}$/.test(this.telefono.trim())) {
      this.errorMessage = 'Il numero di telefono deve contenere esattamente 10 cifre.';
      return;
    }

    const prenotazioneError = this.validaPrenotazione();
    if (prenotazioneError) {
      this.errorMessage = prenotazioneError;
      return;
    }

    if (this.verificaDisponibilita() !== 'Disponibile') {
      this.errorMessage = 'Non disponibile per l\'orario selezionato.';
      return;
    }

    const nuovaPrenotazione = {
      nomeCliente: `${this.nome} ${this.cognome}`,
      telefonoCliente: this.telefono,
      data: this.prenotazioneData,
      ora: this.prenotazioneOra,
      numeroPersone: this.prenotazionePersone || 1,
      numeroPrenotazione: 0 // Assegnato dal backend
    };

    this.prenotazioniService.create(nuovaPrenotazione as any).subscribe({
      next: (res: any) => {
        this.prenotazioneConfermata = true;
        this.emitClienteInfo();
        this.step = 'risultato';
        this.saveRecoveryState();
      },
      error: (err: any) => {
        this.errorMessage = err.error?.error || 'Errore durante la creazione della prenotazione.';
      }
    });
  }

  apriMenu(): void {
    this.step = 'menu';
    this.menuLoading = true;
    this.menuService.getAll().subscribe({
      next: (menu) => {
        this.menu = menu ?? [];
        this.menuRaggruppato = this.buildMenuRaggruppato(this.menu);
        this.menuLoading = false;
        this.saveRecoveryState();
      },
      error: () => {
        this.errorMessage = 'Errore nel caricamento del menu.';
        this.menu = [];
        this.menuLoading = false;
      }
    });
  }

  // ─── INGREDIENTI ──────────────────────────────────────────
  parseIngredienti(item: MenuItem): string[] {
    if (!item.descrizione || item.categoria?.toUpperCase() !== 'PANINI') {
      return [];
    }
    // La descrizione dei panini è tipo: "Panino al sesamo, hamburger 200gr, cheddar, pomodoro, ..."
    return item.descrizione
      .split(',')
      .map(s => {
        const trimmed = s.trim();
        if (trimmed.length === 0) return '';
        return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
      })
      .filter(s => s.length > 0);
  }

  isPanino(item: MenuItem): boolean {
    return item.categoria?.toUpperCase() === 'PANINI';
  }

  // (rimossa togglePannelloIngredienti perché non serve più)

  toggleIngrediente(carrelloItem: CarrelloItem, ingrediente: string): void {
    const idx = carrelloItem.ingredientiEsclusi.indexOf(ingrediente);
    if (idx >= 0) {
      carrelloItem.ingredientiEsclusi.splice(idx, 1);
    } else {
      carrelloItem.ingredientiEsclusi.push(ingrediente);
    }
    this.saveRecoveryState();
  }

  isIngredienteEscluso(carrelloItem: CarrelloItem, ingrediente: string): boolean {
    return carrelloItem.ingredientiEsclusi.includes(ingrediente);
  }

  getNotaIngredienti(carrelloItem: CarrelloItem): string {
    if (carrelloItem.ingredientiEsclusi.length === 0) return '';
    return 'Senza: ' + carrelloItem.ingredientiEsclusi.join(', ');
  }

  // ─── CARRELLO ──────────────────────────────────────────────
  aggiungi(item: MenuItem): void {
    if (!this.isDisponibile(item)) {
      this.errorMessage = 'Prodotto non disponibile al momento.';
      return;
    }
    this.carrello.push({
      idLocale: Date.now() + Math.random(),
      item,
      quantita: 1,
      ingredientiDisponibili: this.parseIngredienti(item),
      ingredientiEsclusi: []
    });
    // Se è un panino, apri automaticamente il pannello ingredienti
    if (this.isPanino(item) && item.id) {
      // La lista ingredienti è già visibile per impostazione HTML
    }
    this.saveRecoveryState();
  }

  rimuovi(item: MenuItem): void {
    // Trova l'ultimo inserito di questo prodotto
    const ids = this.carrello.map(c => c.item.id);
    const lastIdx = ids.lastIndexOf(item.id);
    if (lastIdx !== -1) {
      this.carrello.splice(lastIdx, 1);
    }
    this.saveRecoveryState();
  }

  isDisponibile(item: MenuItem): boolean {
    return item.disponibile && (item.quantitaDisponibile ?? 0) > 0;
  }

  quantitaSelezionata(item: MenuItem): number {
    // Conta quanti ce ne sono nel carrello
    return this.carrello.filter((c) => c.item.id === item.id).length;
  }

  getCarrelloItemsOf(item: MenuItem): CarrelloItem[] {
    return this.carrello.filter(c => c.item.id === item.id);
  }

  private buildMenuRaggruppato(menu: MenuItem[]): Array<{ categoria: string; items: MenuItem[] }> {
    const ordine = ['BEVANDE', 'BIRRE', 'FRITTI', 'PANINI', 'DOLCI'];
    const mappa = new Map<string, MenuItem[]>();
    menu.forEach((item) => {
      const categoria = item.categoria?.toUpperCase() || 'ALTRO';
      const list = mappa.get(categoria) ?? [];
      list.push(item);
      mappa.set(categoria, list);
    });
    const ordinati: Array<{ categoria: string; items: MenuItem[] }> = [];
    ordine.forEach((categoria) => {
      const items = mappa.get(categoria);
      if (items && items.length > 0) {
        ordinati.push({ categoria, items });
        mappa.delete(categoria);
      }
    });
    [...mappa.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([categoria, items]) => {
        ordinati.push({ categoria, items });
      });
    return ordinati;
  }

  trackByCategoria(index: number, gruppo: { categoria: string }): string {
    return gruppo.categoria;
  }

  trackByItem(index: number, item: MenuItem): number | undefined {
    return item.id;
  }

  totale(): number {
    return this.carrello.reduce((acc, c) => acc + (c.item.prezzo ?? 0), 0);
  }

  // ─── INVIO ORDINE ─────────────────────────────────────────
  inviaInCucina(): void {
    if (this.carrello.length === 0) {
      this.errorMessage = 'Seleziona almeno un articolo.';
      return;
    }
    this.errorMessage = '';

    const itemsPayload = this.carrello.map((c) => ({
      menuItemId: c.item.id as number,
      quantita: c.quantita,
      note: this.getNotaIngredienti(c) || undefined
    }));

    if (itemsPayload.some((item) => !item.menuItemId)) {
      this.errorMessage = 'Impossibile inviare l\'ordine: articolo non valido.';
      return;
    }

    const payload = {
      tipoOrdine: this.tipo,
      telefonoCliente: this.telefono.trim() || undefined,
      numeroTavolo: this.numeroTavolo ?? undefined,
      indirizzoConsegna: this.indirizzo.trim() || undefined,
      items: itemsPayload
    };

    this.ordiniService.create(payload).subscribe({
      next: (created) => {
        this.ordineInviato = true;
        const ordineId = created?.numeroOrdine ?? ++this.ordineCounter;
        this.ordineCounter = Math.max(this.ordineCounter, ordineId);

        const ordine: OrdineEffettuato = {
          id: ordineId,
          items: this.carrello.map((c) => ({
            nome: c.item.nome,
            quantita: c.quantita,
            prezzo: (c.item.prezzo ?? 0),
            note: this.getNotaIngredienti(c) || undefined
          })),
          totale: this.totale(),
          dataOra: new Date()
        };
        this.ordineInviatoEvent.emit(ordine);

        this.step = 'conferma';
        this.saveRecoveryState();
      },
      error: (err) => {
        this.errorMessage = err?.error?.error || 'Errore durante l\'invio dell\'ordine.';
      }
    });
  }

  ordinaAltro(): void {
    this.carrello = [];
    this.carrelloAperto = false;
    this.ordineInviato = false;
    this.errorMessage = '';
    this.step = 'menu';
    this.saveRecoveryState();
  }

  toggleCarrello(): void {
    this.carrelloAperto = !this.carrelloAperto;
    this.saveRecoveryState();
  }

  reset(): void {
    this.nome = '';
    this.cognome = '';
    this.tipo = '';
    this.numeroTavolo = null;
    this.prenotazionePersone = null;
    this.prenotazioneData = '';
    this.prenotazioneOra = '';
    this.prenotazioneConfermata = false;
    this.telefono = '';
    this.indirizzo = '';
    this.comune = '';
    this.provincia = '';
    this.step = 'dati';
    this.menu = [];
    this.menuLoading = false;
    this.errorMessage = '';
    this.carrello = [];
    this.carrelloAperto = false;
    this.ordineInviato = false;
    this.clienteChange.emit(null);
    this.clearRecoveryState();
  }

  private emitClienteInfo(): void {
    this.clienteChange.emit({
      nome: this.nome.trim(),
      cognome: this.cognome.trim(),
      telefono: this.telefono.trim() || undefined,
      numeroTavolo: this.numeroTavolo
    });
  }

  private prefillFromLogin(data: ClienteLoginData): void {
    this.nome = data.nome;
    this.cognome = data.cognome;
    this.tipo = data.tipo;
    this.numeroTavolo = data.numeroTavolo ?? null;
    this.prenotazionePersone = data.prenotazionePersone ?? null;
    this.prenotazioneData = data.prenotazioneData ?? '';
    this.prenotazioneOra = data.prenotazioneOra ?? '';
    this.telefono = data.telefono ?? '';
    this.indirizzo = data.indirizzo ?? '';
    this.comune = data.comune ?? '';
    this.provincia = data.provincia ?? '';
    this.errorMessage = '';
    if (this.step === 'dati' && this.tipo && this.nome.trim() && this.cognome.trim()) {
      if (this.tipo !== 'PRENOTAZIONE') {
        this.avvia();
      }
    }
  }

  get prenotazioneMinDate(): string {
    const year = new Date().getFullYear();
    return `${year}-01-01`;
  }

  get prenotazioneMaxDate(): string {
    const year = new Date().getFullYear();
    return `${year}-12-31`;
  }

  private validaPrenotazione(): string | null {
    if (!this.isDataAnnoCorrente(this.prenotazioneData)) {
      return "La prenotazione è disponibile solo per l'anno corrente.";
    }
    if (!this.isDataNonPassata(this.prenotazioneData)) {
      return 'La data della prenotazione deve essere oggi o futura.';
    }
    if (!this.isOrarioApertura(this.prenotazioneOra)) {
      return 'Orario di apertura: 19:30 - 23:00.';
    }
    return null;
  }

  private isDataAnnoCorrente(data: string): boolean {
    if (!data) {
      return false;
    }
    const year = Number(data.split('-')[0]);
    return year === new Date().getFullYear();
  }

  private isDataNonPassata(data: string): boolean {
    if (!data) {
      return false;
    }
    const [year, month, day] = data.split('-').map(Number);
    if (!year || !month || !day) {
      return false;
    }
    const inputDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return inputDate.getTime() >= today.getTime();
  }

  private isOrarioApertura(ora: string): boolean {
    if (!ora) {
      return false;
    }
    return this.toMinutes(ora) >= this.toMinutes(this.aperturaOra)
      && this.toMinutes(ora) <= this.toMinutes(this.chiusuraOra);
  }

  private toMinutes(ora: string): number {
    const [hh, mm] = ora.split(':').map(Number);
    return hh * 60 + mm;
  }

  private saveRecoveryState(): void {
    // memoria disattivata su richiesta
  }

  private tryRestoreRecovery(): boolean {
    return false;
  }

  private buildCarrelloFromRecovery(items: CarrelloRecoveryItem[]): CarrelloItem[] {
    const result: CarrelloItem[] = [];
    items.forEach((item) => {
      const menuItem = this.menu.find((m) => m.id === item.menuItemId);
      if (!menuItem) {
        return;
      }
      result.push({
        idLocale: Date.now() + Math.random(),
        item: menuItem,
        quantita: 1,
        ingredientiDisponibili: this.parseIngredienti(menuItem),
        ingredientiEsclusi: item.ingredientiEsclusi ?? []
      });
    });
    return result;
  }

  private isSameLoginData(saved: ClienteLoginData): boolean {
    if (!this.loginData) {
      return false;
    }
    return saved.tipo === this.loginData.tipo
      && (saved.nome ?? '').trim().toLowerCase() === (this.loginData.nome ?? '').trim().toLowerCase()
      && (saved.cognome ?? '').trim().toLowerCase() === (this.loginData.cognome ?? '').trim().toLowerCase()
      && (saved.numeroTavolo ?? null) === (this.loginData.numeroTavolo ?? null)
      && (saved.prenotazionePersone ?? null) === (this.loginData.prenotazionePersone ?? null)
      && (saved.prenotazioneData ?? '') === (this.loginData.prenotazioneData ?? '')
      && (saved.prenotazioneOra ?? '') === (this.loginData.prenotazioneOra ?? '')
      && (saved.telefono ?? '').trim() === (this.loginData.telefono ?? '').trim()
      && (saved.indirizzo ?? '').trim() === (this.loginData.indirizzo ?? '').trim()
      && (saved.comune ?? '').trim().toLowerCase() === (this.loginData.comune ?? '').trim().toLowerCase()
      && (saved.provincia ?? '').trim().toLowerCase() === (this.loginData.provincia ?? '').trim().toLowerCase();
  }

  private clearRecoveryState(): void {
    // memoria disattivata su richiesta
  }
}
