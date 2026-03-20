import { Component, Input } from '@angular/core';
import { PrenotazioniService } from '../shared/services/prenotazioni.service';
import { Prenotazione } from '../shared/models/prenotazione';
import { ClienteInfo } from '../servizio/servizio.component';

@Component({
  selector: 'app-prenotazioni',
  templateUrl: './prenotazioni.component.html',
  styleUrls: ['./prenotazioni.component.css']
})
export class PrenotazioniComponent {
  @Input() accesso: 'staff' | 'cliente' | '' = '';
  @Input() cliente: ClienteInfo | null = null;

  prenotazioni: Prenotazione[] = [];
  loading = false;
  errorMessage = '';

  get prenotazioniFiltrate(): Prenotazione[] {
    if (this.accesso !== 'cliente' || !this.cliente) {
      return this.prenotazioni;
    }
    const nome = this.cliente.nome.toLowerCase();
    const cognome = this.cliente.cognome.toLowerCase();
    return this.prenotazioni.filter((p) => {
      const nomeCliente = p.nomeCliente.toLowerCase();
      return nomeCliente.includes(nome) || nomeCliente.includes(cognome);
    });
  }

  constructor(private prenotazioniService: PrenotazioniService) {}

  loadPrenotazioni(): void {
    this.loading = true;
    this.errorMessage = '';

    this.prenotazioniService.getAll().subscribe({
      next: (prenotazioni) => {
        this.prenotazioni = prenotazioni ?? [];
        this.loading = false;
      },
      error: () => {
        this.prenotazioni = [];
        this.errorMessage = 'Errore nel caricamento delle prenotazioni.';
        this.loading = false;
      }
    });
  }
}
