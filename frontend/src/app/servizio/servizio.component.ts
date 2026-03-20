import { Component, EventEmitter, Output, Input, OnChanges, SimpleChanges } from '@angular/core';
import { MenuService } from '../shared/services/menu.service';
import { MenuItem } from '../shared/models/menu-item';
import { PrenotazioniService } from '../shared/services/prenotazioni.service';

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

@Component({
  selector: 'app-servizio',
  templateUrl: './servizio.component.html',
  styleUrls: ['./servizio.component.css']
})
export class ServizioComponent implements OnChanges {
  @Input() loginData: ClienteLoginData | null = null;
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

  constructor(
    private menuService: MenuService,
    private prenotazioniService: PrenotazioniService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['loginData'] && this.loginData) {
      this.prefillFromLogin(this.loginData);
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
      return;
    }

    if (this.tipo === 'TAVOLO') {
      if (!this.numeroTavolo) {
        this.errorMessage = 'Inserisci il numero del tavolo.';
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
  }

  rimuovi(item: MenuItem): void {
    // Trova l'ultimo inserito di questo prodotto
    const ids = this.carrello.map(c => c.item.id);
    const lastIdx = ids.lastIndexOf(item.id);
    if (lastIdx !== -1) {
      this.carrello.splice(lastIdx, 1);
    }
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
    this.ordineInviato = true;
    this.ordineCounter++;

    // Emetti l'ordine al componente padre
    const ordine: OrdineEffettuato = {
      id: this.ordineCounter,
      items: this.carrello.map(c => ({
        nome: c.item.nome,
        quantita: 1,
        prezzo: (c.item.prezzo ?? 0),
        note: this.getNotaIngredienti(c) || undefined
      })),
      totale: this.totale(),
      dataOra: new Date()
    };
    this.ordineInviatoEvent.emit(ordine);

    this.step = 'conferma';
  }

  ordinaAltro(): void {
    this.carrello = [];
    this.carrelloAperto = false;
    this.ordineInviato = false;
    this.errorMessage = '';
    this.step = 'menu';
  }

  toggleCarrello(): void {
    this.carrelloAperto = !this.carrelloAperto;
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
}
