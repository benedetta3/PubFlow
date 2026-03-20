import { Component, OnInit } from '@angular/core';
import { ClienteInfo, ClienteLoginData, TipoServizio, OrdineEffettuato } from './servizio/servizio.component';
import { OrdiniService } from './shared/services/ordini.service';
import { forkJoin, of } from 'rxjs';
import { Ordine } from './shared/models/ordine';
import { TavoliService } from './shared/services/tavoli.service';
import { PrenotazioniComponent } from './prenotazioni/prenotazioni.component';
import { OrdiniComponent } from './ordini/ordini.component';
import { TavoliStaffComponent } from './tavoli-staff/tavoli-staff.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'frontend';
  accesso: 'staff' | 'cliente' | '' = 'cliente';
  clienteInfo: ClienteInfo | null = null;
  clienteLoginData: ClienteLoginData | null = null;
  step: 'scelta' | 'login' | 'attesa_tavolo' | 'servizi' = 'login';

  clienteNome = '';
  clienteCognome = '';
  clienteTipo: TipoServizio = '';
  clienteNumeroTavolo: number | null = null;
  clientePrenotazionePersone: number | null = null;
  clientePrenotazioneData = '';
  clientePrenotazioneOra = '';
  clienteTelefono = '';
  clienteIndirizzo = '';
  clienteComune = '';
  clienteProvincia = '';
  
  erroreLogin = '';

  private readonly aperturaOra = '19:30';
  private readonly chiusuraOra = '23:00';

  // ─── NUOVO STATO: CONTO E ORDINI ───
  vistaAttiva: 'servizio' | 'conto' = 'servizio';
  ordiniEffettuati: OrdineEffettuato[] = [];
  contoPagato = false;
  codiceUscita = '';

  private ordinePollingInterval: any;
  private readonly ordinePollingMs = 5000;

  private readonly sessionKey = 'pubflow_session';
  private readonly recoveryKey = 'pubflow_recovery';

  constructor(private ordiniService: OrdiniService, private tavoliService: TavoliService) {}

  ngOnInit(): void {
    this.startOrdiniPolling();
  }

  selezionaAccesso(tipo: 'staff' | 'cliente'): void {
    this.accesso = tipo;
    this.step = 'login';
  }

  resetAccesso(): void {
    this.stopOrdiniPolling();
    this.accesso = 'cliente';
    this.clienteInfo = null;
    this.clienteLoginData = null;
    this.step = 'login';
    this.clienteNome = '';
    this.clienteCognome = '';
    this.clienteTipo = '';
    this.clienteNumeroTavolo = null;
    this.clientePrenotazionePersone = null;
    this.clientePrenotazioneData = '';
    this.clientePrenotazioneOra = '';
    this.clienteTelefono = '';
    this.clienteIndirizzo = '';
    this.clienteComune = '';
    this.clienteProvincia = '';
    
    // Reset conto state
    this.vistaAttiva = 'servizio';
    this.ordiniEffettuati = [];
    this.contoPagato = false;
    this.codiceUscita = '';

    this.clearSession();
  }

  aggiornaCliente(info: ClienteInfo | null): void {
    this.clienteInfo = info;
  }

  confermaLoginStaff(loggato: boolean): void {
    this.step = loggato ? 'servizi' : 'login';
    if (loggato) {
      this.saveSession();
      this.saveRecoveryData();
    }
  }

  confermaLoginCliente(): void {
    this.erroreLogin = '';

    if (!this.clienteNome.trim() || !this.clienteCognome.trim() || !this.clienteTipo) {
      this.erroreLogin = 'Compila Nome, Cognome e Tipo Servizio.';
      return;
    }
    if (this.clienteTipo === 'TAVOLO' && !this.clienteNumeroTavolo) {
      this.erroreLogin = 'Inserisci il Numero del Tavolo.';
      return;
    }
    if (
      this.clienteTipo === 'PRENOTAZIONE' &&
      (!this.clientePrenotazionePersone ||
        !this.clientePrenotazioneData ||
        !this.clientePrenotazioneOra ||
        !this.clienteTelefono.trim())
    ) {
      this.erroreLogin = 'Compila numero persone, telefono, data e ora per la prenotazione.';
      return;
    }
    if (this.clienteTipo === 'PRENOTAZIONE' && !/^\d{10}$/.test(this.clienteTelefono.trim())) {
      this.erroreLogin = 'Il numero di telefono deve contenere esattamente 10 cifre.';
      return;
    }
    if (this.clienteTipo === 'PRENOTAZIONE') {
      if (!this.isDataAnnoCorrente(this.clientePrenotazioneData)) {
        this.erroreLogin = "La prenotazione è disponibile solo per l'anno corrente.";
        return;
      }
      if (!this.isDataNonPassata(this.clientePrenotazioneData)) {
        this.erroreLogin = 'La data della prenotazione deve essere oggi o futura.';
        return;
      }
      if (!this.isOrarioApertura(this.clientePrenotazioneOra)) {
        this.erroreLogin = 'Orario di apertura: 19:30 - 23:00.';
        return;
      }
    }
    if (this.clienteTipo === 'DOMICILIO') {
      if (
        !this.clienteTelefono.trim() ||
        !this.clienteIndirizzo.trim() ||
        !this.clienteComune.trim() ||
        !this.clienteProvincia.trim()
      ) {
        this.erroreLogin = 'Compila telefono e indirizzo completo.';
        return;
      }
      if (!/^\d{10}$/.test(this.clienteTelefono.trim())) {
        this.erroreLogin = 'Il numero di telefono deve contenere esattamente 10 cifre.';
        return;
      }
      const comune = this.clienteComune.trim().toLowerCase();
      if (comune !== 'rende') {
        this.erroreLogin = 'Consegniamo solo a Rende.';
        return;
      }
      const provincia = this.clienteProvincia.trim().toLowerCase();
      if (provincia !== 'cs' && provincia !== 'cosenza') {
        this.erroreLogin = 'La provincia deve essere Cosenza (CS).';
        return;
      }
    }

    if (this.clienteTipo === 'ASPORTO') {
      if (!this.clienteTelefono.trim()) {
        this.erroreLogin = 'Inserisci il numero di telefono per l\'asporto.';
        return;
      }
      if (!/^\d{10}$/.test(this.clienteTelefono.trim())) {
        this.erroreLogin = 'Il numero di telefono deve contenere esattamente 10 cifre.';
        return;
      }
    }

    this.impostaDatiCliente();

    if (this.clienteTipo === 'TAVOLO') {
      const numeroTavolo = Number(this.clienteNumeroTavolo);
      if (!numeroTavolo || Number.isNaN(numeroTavolo)) {
        this.erroreLogin = 'Inserisci un numero tavolo valido.';
        return;
      }

      this.tavoliService.getByNumero(numeroTavolo).subscribe({
        next: (tavolo) => {
          if (tavolo.stato !== 'LIBERO') {
            this.erroreLogin = 'Tavolo già occupato.';
            return;
          }
          // Segna il tavolo come OCCUPATO e vai direttamente al menu
          this.tavoliService.aggiornaStato(numeroTavolo, 'OCCUPATO').subscribe({
            next: () => {
              this.step = 'servizi';
              this.startOrdiniPolling();
              this.saveSession();
              this.saveRecoveryData();
            },
            error: (err) => {
              console.error('Errore aggiornamento tavolo', err);
              this.erroreLogin = 'Impossibile aggiornare lo stato del tavolo.';
            }
          });
        },
        error: (err) => {
          console.error('Errore richiesta tavolo', err);
          this.erroreLogin = 'Tavolo non trovato.';
        }
      });
    } else {
      this.step = 'servizi';
      this.startOrdiniPolling();
      this.saveSession();
      this.saveRecoveryData();
    }
  }

  private impostaDatiCliente(): void {
    this.clienteInfo = {
      nome: this.clienteNome.trim(),
      cognome: this.clienteCognome.trim(),
      telefono: this.clienteTelefono.trim() || undefined,
      numeroTavolo: this.clienteNumeroTavolo
    };
    this.clienteLoginData = {
      nome: this.clienteNome.trim(),
      cognome: this.clienteCognome.trim(),
      tipo: this.clienteTipo,
      numeroTavolo: this.clienteNumeroTavolo,
      prenotazionePersone: this.clientePrenotazionePersone,
      prenotazioneData: this.clientePrenotazioneData,
      prenotazioneOra: this.clientePrenotazioneOra,
      telefono: this.clienteTelefono.trim() || undefined,
      indirizzo: this.clienteIndirizzo.trim() || undefined,
      comune: this.clienteComune.trim() || undefined,
      provincia: this.clienteProvincia.trim() || undefined
    };
    this.saveSession();
  }

  get prenotazioneMinDate(): string {
    const year = new Date().getFullYear();
    return `${year}-01-01`;
  }

  get prenotazioneMaxDate(): string {
    const year = new Date().getFullYear();
    return `${year}-12-31`;
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

  // ─── LOGICA CONTO E ORDINI ───

  aggiungiOrdine(ordine: OrdineEffettuato): void {
    this.ordiniEffettuati.push(ordine);
    this.loadClientOrders();
    this.saveSession();
  }

  totaleConto(): number {
    if (this.clientOrders.length > 0) {
      return this.clientOrders.reduce((acc, ord) => acc + (Number(ord.totale) || 0), 0);
    }
    return this.ordiniEffettuati.reduce((acc, ord) => acc + ord.totale, 0);
  }

  get clientOrders(): Ordine[] {
    return this._clientOrders;
  }

  private _clientOrders: Ordine[] = [];

  canPay(): boolean {
    if (!this.clientOrders.length) {
      return false;
    }
    if (this.clienteTipo === 'TAVOLO') {
      return this.clientOrders.every((ordine) => ordine.stato === 'CONSEGNATO');
    }
    return true;
  }

  formatStatoOrdine(stato?: string): string {
    if (!stato) {
      return '';
    }
    const mapping: Record<string, string> = {
      RICEVUTO: 'Ricevuto',
      IN_PREPARAZIONE: 'In preparazione',
      PRONTO: 'Pronto',
      IN_CONSEGNA: 'In consegna',
      CONSEGNATO: 'Consegnato',
      PAGATO: 'Pagato'
    };
    return mapping[stato] ?? stato.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  }
  
  apriConto(): void {
    this.vistaAttiva = 'conto';
    this.saveSession();
  }

  tornaAlServizio(): void {
    this.vistaAttiva = 'servizio';
    this.saveSession();
  }

  pagaConto(): void {
    if (!this.canPay()) {
      return;
    }
    if (this.clienteTipo === 'TAVOLO') {
      if (this.clienteInfo?.numeroTavolo) {
        this.ordiniService.pagaOrdiniTavolo(this.clienteInfo.numeroTavolo).subscribe({
          next: () => this.finalizePagamento(),
          error: (err) => {
            console.error("Errore durante il pagamento ordini tavolo", err);
            this.finalizePagamento(); // Procediamo comunque per UX
          }
        });
      } else {
        this.finalizePagamento();
      }
      return;
    }
    this.avviaPreparazioneOrdini();
  }

  private avviaPreparazioneOrdini(): void {
    if (!this.clientOrders.length) {
      this.finalizePagamento();
      return;
    }
    const updates = this.clientOrders
      .filter((ordine) => ordine.id && ordine.stato !== 'IN_PREPARAZIONE')
      .map((ordine) => this.ordiniService.aggiornaStato(ordine.id!, 'IN_PREPARAZIONE'));

    if (!updates.length) {
      this.finalizePagamento();
      return;
    }

    forkJoin(updates).subscribe({
      next: () => this.finalizePagamento(),
      error: (err) => {
        console.error('Errore durante l\'avvio preparazione', err);
        this.finalizePagamento();
      }
    });
  }

  private finalizePagamento(): void {
    this.contoPagato = true;
    if (this.clienteTipo === 'TAVOLO') {
      this.codiceUscita = 'PUB-' + Math.floor(1000 + Math.random() * 9000) + '-' + new Date().getFullYear();
    } else {
      this.codiceUscita = '';
    }
    this.saveSession();
    this.clearRecoveryData();
  }

  private startOrdiniPolling(): void {
    if (this.accesso !== 'cliente' || this.step !== 'servizi') {
      return;
    }
    if (this.ordinePollingInterval) {
      clearInterval(this.ordinePollingInterval);
    }
    this.loadClientOrders();
    this.ordinePollingInterval = setInterval(() => this.loadClientOrders(), this.ordinePollingMs);
  }

  private stopOrdiniPolling(): void {
    if (this.ordinePollingInterval) {
      clearInterval(this.ordinePollingInterval);
      this.ordinePollingInterval = null;
    }
  }

  private loadClientOrders(): void {
    const cliente = this.clienteInfo;
    if (this.accesso !== 'cliente' || !cliente) {
      this._clientOrders = [];
      return;
    }
    this.ordiniService.getAll().subscribe({
      next: (ordini) => {
        const lista = ordini ?? [];
        this._clientOrders = this.filterClientOrders(lista, cliente);
      },
      error: () => {
        this._clientOrders = [];
      }
    });
  }

  private filterClientOrders(ordini: Ordine[], cliente: ClienteInfo): Ordine[] {
    const telefono = cliente.telefono?.trim();
    if (telefono) {
      return ordini.filter((o) => (o.telefonoCliente ?? '').includes(telefono));
    }
    if (cliente.numeroTavolo) {
      return ordini.filter((o) => o.numeroTavolo === cliente.numeroTavolo);
    }
    return [];
  }

  onPrenotazioniToggle(event: Event, component: PrenotazioniComponent): void {
    const details = event.target as HTMLDetailsElement | null;
    if (details?.open) {
      component.loadPrenotazioni();
    }
  }

  onOrdiniToggle(event: Event, component: OrdiniComponent): void {
    const details = event.target as HTMLDetailsElement | null;
    if (details?.open) {
      component.loadOrdini();
    }
  }

  onTavoliToggle(event: Event, component: TavoliStaffComponent): void {
    const details = event.target as HTMLDetailsElement | null;
    if (details?.open) {
      component.caricaTavoli();
    }
  }

  private saveSession(): void {
    // memoria disattivata su richiesta
  }

  private saveRecoveryData(): void {
    // memoria disattivata su richiesta
  }

  private restoreSession(): void {
    // memoria disattivata su richiesta
  }

  private clearSession(): void {
    // memoria disattivata su richiesta
  }

  private clearRecoveryData(): void {
    // memoria disattivata su richiesta
  }

  private isSameClienteLogin(saved: ClienteLoginData): boolean {
    return saved.tipo === this.clienteTipo
      && (saved.nome ?? '').trim().toLowerCase() === this.clienteNome.trim().toLowerCase()
      && (saved.cognome ?? '').trim().toLowerCase() === this.clienteCognome.trim().toLowerCase()
      && (saved.numeroTavolo ?? null) === this.clienteNumeroTavolo
      && (saved.prenotazionePersone ?? null) === this.clientePrenotazionePersone
      && (saved.prenotazioneData ?? '') === this.clientePrenotazioneData
      && (saved.prenotazioneOra ?? '') === this.clientePrenotazioneOra
      && (saved.telefono ?? '').trim() === this.clienteTelefono.trim()
      && (saved.indirizzo ?? '').trim() === this.clienteIndirizzo.trim()
      && (saved.comune ?? '').trim().toLowerCase() === this.clienteComune.trim().toLowerCase()
      && (saved.provincia ?? '').trim().toLowerCase() === this.clienteProvincia.trim().toLowerCase();
  }
}
