import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CarritoItem } from '../models/carrito.model';

@Injectable({
  providedIn: 'root'
})
export class CarritoService {
  private apiUrl = 'http://localhost:3000/api/carrito';
  private sessionId: string;
  private userId: number | null = null;

  constructor(private http: HttpClient) { 
    this.sessionId = localStorage.getItem('session_id') || '';
    if (!this.sessionId) {
      this.sessionId = 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('session_id', this.sessionId);
    }
  }

  setUserId(id: number | null) {
    this.userId = id;
  }

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders().set('x-session-id', this.sessionId);
    if (this.userId) {
      headers = headers.set('x-user-id', this.userId.toString());
    }
    return headers;
  }

  getCart(): Observable<CarritoItem[]> {
    return this.http.get<CarritoItem[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  addToCart(id_producto: number, cantidad: number = 1): Observable<any> {
    return this.http.post(`${this.apiUrl}/add`, { id_producto, cantidad }, { headers: this.getHeaders() });
  }

  removeFromCart(id_producto: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/remove/${id_producto}`, { headers: this.getHeaders() });
  }

  mergeCart(): Observable<any> {
    return this.http.post(`${this.apiUrl}/merge`, { userId: this.userId, sessionId: this.sessionId });
  }
}
