import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Ordine } from '../models/ordine';

@Injectable({
  providedIn: 'root'
})
export class OrdiniService {
  private readonly baseUrl = 'http://localhost:8080/pubflow/ordini';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Ordine[]> {
    return this.http.get<Ordine[]>(this.baseUrl);
  }

  pagaOrdiniTavolo(numeroTavolo: number): Observable<number> {
    return this.http.post<number>(`${this.baseUrl}/tavolo/${numeroTavolo}/paga`, {});
  }
}
