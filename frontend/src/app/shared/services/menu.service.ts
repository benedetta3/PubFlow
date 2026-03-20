import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { MenuItem } from '../models/menu-item';

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private readonly baseUrl = 'http://localhost:8080/pubflow/menu';

  constructor(private http: HttpClient) {}

  getAll(): Observable<MenuItem[]> {
    return this.http.get<MenuItem[]>(this.baseUrl);
  }

  update(id: number | undefined, item: MenuItem): Observable<MenuItem> {
    if (!id) throw new Error('Cannot update item without id');
    return this.http.put<MenuItem>(`${this.baseUrl}/${id}`, item);
  }
}
