import { Component, OnInit, OnDestroy } from '@angular/core';
import { TavoliService, Tavolo } from '../shared/services/tavoli.service';

@Component({
  selector: 'app-tavoli-staff',
  templateUrl: './tavoli-staff.component.html',
  styleUrls: ['./tavoli-staff.component.css']
})
export class TavoliStaffComponent implements OnInit, OnDestroy {
  tavoli: Tavolo[] = [];
  polling: any;

  constructor(private tavoliService: TavoliService) {}

  ngOnInit(): void {
    this.caricaTavoli();
    this.polling = setInterval(() => this.caricaTavoli(), 5000);
  }

  ngOnDestroy(): void {
    if (this.polling) clearInterval(this.polling);
  }

  caricaTavoli(): void {
    this.tavoliService.getAll().subscribe({
      next: (tavoli) => {
        this.tavoli = tavoli || [];
      },
      error: (err) => console.error('Errore recupero tavoli', err)
    });
  }

  isOccupato(tavolo: Tavolo): boolean {
    return tavolo.stato === 'OCCUPATO';
  }

  getTableSize(tavolo: Tavolo): string {
    if (tavolo.capienza <= 4) return 'small';
    if (tavolo.capienza <= 6) return 'medium';
    return 'large';
  }
}
