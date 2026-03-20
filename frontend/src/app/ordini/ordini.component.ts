import { Component, Input } from '@angular/core';
import { OrdiniService } from '../shared/services/ordini.service';
import { Ordine } from '../shared/models/ordine';
import { ClienteInfo } from '../servizio/servizio.component';

@Component({
  selector: 'app-ordini',
  templateUrl: './ordini.component.html',
  styleUrls: ['./ordini.component.css']
})
export class OrdiniComponent {
  @Input() accesso: 'staff' | 'cliente' | '' = '';
  @Input() cliente: ClienteInfo | null = null;

  ordini: Ordine[] = [];
  loading = false;
  errorMessage = '';

  get ordiniFiltrati(): Ordine[] {
    if (this.accesso !== 'cliente' || !this.cliente) {
      return this.ordini;
    }
    const telefono = this.cliente.telefono?.trim();
    if (telefono) {
      return this.ordini.filter((o) => (o.telefonoCliente ?? '').includes(telefono));
    }
    if (this.cliente.numeroTavolo) {
      return this.ordini.filter((o) => o.numeroTavolo === this.cliente?.numeroTavolo);
    }
    return [];
  }

  constructor(private ordiniService: OrdiniService) {}

  loadOrdini(): void {
    this.loading = true;
    this.errorMessage = '';

    this.ordiniService.getAll().subscribe({
      next: (ordini) => {
        this.ordini = ordini ?? [];
        this.loading = false;
      },
      error: () => {
        this.ordini = [];
        this.errorMessage = 'Errore nel caricamento degli ordini.';
        this.loading = false;
      }
    });
  }
}
