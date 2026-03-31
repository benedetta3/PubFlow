import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/** Definiamo l'interfaccia TypeScript per mappare UtenteDto */
export interface Utente {
  id?: number;
  nome: string;
  cognome: string;
  username?: string;
  passwordVisibile?: string;
  ruolo?: string;
  logged?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UtenteService {

  private apiUrl = 'http://localhost:8080/pubflow/admin/staff';

  constructor(private http: HttpClient) { }

  /**
   * Recupera tutti i membri dello staff (solo ADMIN può farlo)
   */
  getStaff(): Observable<Utente[]> {
    return this.http.get<Utente[]>(this.apiUrl);
  }

  /**
   * Assume un nuovo membo dello staff
   */
  assumiStaff(nome: string, cognome: string): Observable<Utente> {
    return this.http.post<Utente>(this.apiUrl, { nome, cognome });
  }

  /**
   * Licenzia un membro dello staff tramite ID
   */
  licenziaStaff(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Scollega (Forza Logout) un membro dello staff tramite ID
   */
  scollegaStaff(id: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/scollega`, {});
  }
}
