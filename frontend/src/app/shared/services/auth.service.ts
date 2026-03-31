import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface AuthCredentials {
  username: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly storageKey = 'pubflow.auth';
  private credentials: AuthCredentials | null = null;

  constructor(private http: HttpClient) {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      this.credentials = JSON.parse(saved) as AuthCredentials;
    }
  }

  setCredentials(credentials: AuthCredentials): void {
    this.credentials = credentials;
    localStorage.setItem(this.storageKey, JSON.stringify(credentials));
  }

  clearCredentials(): void {
    this.credentials = null;
    localStorage.removeItem(this.storageKey);
  }

  logout(): void {
    this.clearCredentials();
  }

  getCredentials(): AuthCredentials | null {
    return this.credentials;
  }

  getAuthorizationHeader(): string | null {
    if (!this.credentials) {
      return null;
    }
    const token = btoa(`${this.credentials.username}:${this.credentials.password}`);
    return `Basic ${token}`;
  }

  verifyCredentials(credentials: AuthCredentials): Observable<boolean> {
    const token = btoa(`${credentials.username}:${credentials.password}`);
    const headers = new HttpHeaders({ Authorization: `Basic ${token}` });
    return this.http.get('http://localhost:8080/pubflow/auth/me', { headers, observe: 'response' })
      .pipe(map(response => response.status === 200));
  }
}
