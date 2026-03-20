import { Component } from '@angular/core';
import { ClienteInfo, ClienteLoginData, TipoServizio, OrdineEffettuato } from './servizio/servizio.component';
import { OrdiniService } from './shared/services/ordini.service';
import { TavoliService } from './shared/services/tavoli.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
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

  // ─── NUOVO STATO: CONTO E ORDINI ───
  vistaAttiva: 'servizio' | 'conto' = 'servizio';
  ordiniEffettuati: OrdineEffettuato[] = [];
  contoPagato = false;
  codiceUscita = '';

  pollingIntervallo: any;

  constructor(private ordiniService: OrdiniService, private tavoliService: TavoliService) {}

  selezionaAccesso(tipo: 'staff' | 'cliente'): void {
    this.accesso = tipo;
    this.step = 'login';
  }

  resetAccesso(): void {
    if (this.pollingIntervallo) clearInterval(this.pollingIntervallo);
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
  }

  aggiornaCliente(info: ClienteInfo | null): void {
    this.clienteInfo = info;
  }

  confermaLoginStaff(loggato: boolean): void {
    this.step = loggato ? 'servizi' : 'login';
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

    this.impostaDatiCliente();

    if (this.clienteTipo === 'TAVOLO') {
      // Segna il tavolo come OCCUPATO e vai direttamente al menu
      this.tavoliService.aggiornaStato(this.clienteNumeroTavolo!, 'OCCUPATO').subscribe({
        next: () => {
          this.step = 'servizi';
        },
        error: (err) => {
           console.error('Errore richiesta tavolo', err);
           this.erroreLogin = 'Tavolo non trovato o già occupato.';
        }
      });
    } else {
      this.step = 'servizi';
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
  }

  // ─── LOGICA CONTO E ORDINI ───

  aggiungiOrdine(ordine: OrdineEffettuato): void {
    this.ordiniEffettuati.push(ordine);
  }

  totaleConto(): number {
    return this.ordiniEffettuati.reduce((acc, ord) => acc + ord.totale, 0);
  }
  
  apriConto(): void {
    this.vistaAttiva = 'conto';
  }

  tornaAlServizio(): void {
    this.vistaAttiva = 'servizio';
  }

  pagaConto(): void {
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
  }

  private finalizePagamento(): void {
    this.contoPagato = true;
    this.codiceUscita = 'PUB-' + Math.floor(1000 + Math.random() * 9000) + '-' + new Date().getFullYear();
  }
}
