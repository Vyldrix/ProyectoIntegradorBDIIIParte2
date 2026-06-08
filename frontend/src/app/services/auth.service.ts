import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { CarritoService } from './carrito.service';

export interface User {
  id_usuario: number;
  nombre: string;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth';
  private currentUser: User | null = null;

  constructor(private http: HttpClient, private carritoService: CarritoService) {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      this.currentUser = JSON.parse(savedUser);
      this.carritoService.setUserId(this.currentUser!.id_usuario);
    }
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { email, password }).pipe(
      tap((res: any) => {
        if (res.success) {
          this.currentUser = res.user;
          localStorage.setItem('user', JSON.stringify(this.currentUser));
          
          // Set user ID and merge cart
          this.carritoService.setUserId(this.currentUser!.id_usuario);
          this.carritoService.mergeCart().subscribe();
        }
      })
    );
  }

  logout(): void {
    this.currentUser = null;
    localStorage.removeItem('user');
    this.carritoService.setUserId(null);
  }

  getUser(): User | null {
    return this.currentUser;
  }
}
