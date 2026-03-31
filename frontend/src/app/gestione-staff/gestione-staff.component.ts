import { Component, OnInit } from '@angular/core';
import { Utente, UtenteService } from '../servizio/utente.service';

@Component({
  selector: 'app-gestione-staff',
  templateUrl: './gestione-staff.component.html',
  styleUrls: ['./gestione-staff.component.css']
})
export class GestioneStaffComponent implements OnInit {

  staffList: Utente[] = [];
  nuovoNome: string = '';
  nuovoCognome: string = '';
  loading: boolean = false;
  errore: string = '';

  constructor(private utenteService: UtenteService) { }

  ngOnInit(): void {
    this.caricaStaff();
  }

  caricaStaff(): void {
    this.utenteService.getStaff().subscribe({
      next: (data) => {
        this.staffList = data;
      },
      error: (err) => {
        console.error('Errore caricamento staff', err);
        this.errore = 'Errore nel caricamento del personale. Sei sicuro di essere ADMIN?';
      }
    });
  }

  assumi(): void {
    if (!this.nuovoNome.trim() || !this.nuovoCognome.trim()) {
      alert('Inserire Nome e Cognome validi');
      return;
    }
    this.loading = true;
    this.utenteService.assumiStaff(this.nuovoNome, this.nuovoCognome).subscribe({
      next: (nuovo) => {
        this.staffList.push(nuovo);
        this.nuovoNome = '';
        this.nuovoCognome = '';
        this.loading = false;
      },
      error: (err) => {
        console.error('Errore assunzione', err);
        alert('Errore durante un\'assunzione');
        this.loading = false;
      }
    });
  }

  licenzia(id?: number): void {
    if (!id) return;
    if (confirm('Sei sicuro di voler licenziare questo membro dello staff?')) {
      this.utenteService.licenziaStaff(id).subscribe({
        next: () => {
          this.staffList = this.staffList.filter(s => s.id !== id);
        },
        error: (err) => {
          console.error('Errore licenziamento', err);
          alert('Errore durante il licenziamento');
        }
      });
    }
  }
}
