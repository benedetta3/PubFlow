import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { OrdiniService } from '../shared/services/ordini.service';
import { Ordine } from '../shared/models/ordine';
import { ClienteInfo } from '../servizio/servizio.component';

@Component({
  selector: 'app-ordini',
  templateUrl: './ordini.component.html',
  styleUrls: ['./ordini.component.css']
})
export class OrdiniComponent implements OnInit, OnDestroy {
  @Input() accesso: 'staff' | 'cliente' | '' = '';
  @Input() cliente: ClienteInfo | null = null;
  @Input() autoRefresh = true;

  ordini: Ordine[] = [];
  loading = false;
  errorMessage = '';
  private updatingIds = new Set<number>();
  private refreshInterval: any;

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

  ngOnInit(): void {
    this.loadOrdini();
    if (this.autoRefresh) {
      this.refreshInterval = setInterval(() => this.loadOrdini(true), 5000);
    }
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  isStaff(): boolean {
    return this.accesso === 'staff';
  }

  getTotaleSerata(): number {
    return this.ordini
      .filter((ordine) => ordine.stato === 'PAGATO')
      .reduce((acc, ordine) => acc + (Number(ordine.totale) || 0), 0);
  }

  isPagato(ordine: Ordine): boolean {
    return ordine.stato === 'CONSEGNATO';
  }

  getStepList(ordine: Ordine): Array<{ stato: string; label: string }> {
    const steps = [
      { stato: 'IN_PREPARAZIONE', label: 'In preparazione' },
      { stato: 'PRONTO', label: 'Pronto' }
    ];
    if (ordine.tipoOrdine === 'DOMICILIO') {
      steps.push({ stato: 'IN_CONSEGNA', label: 'In consegna' });
    }
    steps.push({ stato: 'CONSEGNATO', label: 'Consegnato' });
    return steps;
  }

  canMoveTo(ordine: Ordine, target: string): boolean {
    if (ordine.tipoOrdine !== 'TAVOLO' && ordine.stato === 'RICEVUTO') {
      return false;
    }
    const steps = this.getStepList(ordine).map((s) => s.stato);
    const targetIndex = steps.indexOf(target);
    if (targetIndex === -1) {
      return false;
    }
    const currentIndex = steps.indexOf(ordine.stato);
    if (currentIndex === -1) {
      return targetIndex === 0;
    }
    return targetIndex === currentIndex + 1;
  }

  isStepCompleted(ordine: Ordine, target: string): boolean {
    const steps = this.getStepList(ordine).map((s) => s.stato);
    const targetIndex = steps.indexOf(target);
    const currentIndex = steps.indexOf(ordine.stato);
    if (targetIndex === -1 || currentIndex === -1) {
      return false;
    }
    return targetIndex <= currentIndex;
  }

  isUpdating(id?: number): boolean {
    return id !== undefined && this.updatingIds.has(id);
  }

  aggiornaStato(ordine: Ordine, target: string): void {
    if (!ordine.id || !this.canMoveTo(ordine, target) || this.isUpdating(ordine.id)) {
      return;
    }
    this.errorMessage = '';
    this.updatingIds.add(ordine.id);

    this.ordiniService.aggiornaStato(ordine.id, target).subscribe({
      next: () => {
        ordine.stato = target;
        this.updatingIds.delete(ordine.id!);
      },
      error: () => {
        this.errorMessage = 'Errore durante l\'aggiornamento dello stato ordine.';
        this.updatingIds.delete(ordine.id!);
      }
    });
  }

  loadOrdini(silent = false): void {
    if (!silent) {
      this.loading = true;
    }
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
