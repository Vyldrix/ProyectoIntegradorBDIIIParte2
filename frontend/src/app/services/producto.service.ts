import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Producto, PaginatedProductos } from '../models/producto.model';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private apiUrl = 'http://localhost:3000/api/productos';

  constructor(private http: HttpClient) { }

  getProductos(page: number = 1): Observable<PaginatedProductos> {
    return this.http.get<PaginatedProductos>(`${this.apiUrl}?page=${page}`);
  }

  getProducto(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.apiUrl}/${id}`);
  }
}
