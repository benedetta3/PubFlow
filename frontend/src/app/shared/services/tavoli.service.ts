import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Tavolo {
  id?: number;
  numero: number;
  capienza: number;
  stato: 'LIBERO' | 'IN_ATTESA_CONFERMA' | 'OCCUPATO';
  codiceSegreto?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TavoliService {
  private readonly baseUrl = 'http://localhost:8080/pubflow/tavoli';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Tavolo[]> {
    return this.http.get<Tavolo[]>(this.baseUrl);
  }

  getByNumero(numero: number): Observable<Tavolo> {
    return this.http.get<Tavolo>(`${this.baseUrl}/${numero}`);
  }

  getByStato(stato: string): Observable<Tavolo[]> {
    return this.http.get<Tavolo[]>(`${this.baseUrl}/stato/${stato}`);
  }

  aggiornaStato(numero: number, stato: string): Observable<boolean> {
    return this.http.patch<boolean>(`${this.baseUrl}/${numero}/stato?stato=${stato}`, {});
  }

  loginCliente(codice: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/login?codice=${codice}`, {});
  }
}
