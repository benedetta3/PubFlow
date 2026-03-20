import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Prenotazione } from '../models/prenotazione';

@Injectable({
  providedIn: 'root'
})
export class PrenotazioniService {
  private readonly baseUrl = 'http://localhost:8080/pubflow/prenotazioni';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Prenotazione[]> {
    return this.http.get<Prenotazione[]>(this.baseUrl);
  }

  create(prenotazione: Prenotazione): Observable<Prenotazione> {
    return this.http.post<Prenotazione>(this.baseUrl, prenotazione);
  }
}
