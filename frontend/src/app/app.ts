import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ProductoService } from './services/producto.service';
import { CarritoService } from './services/carrito.service';
import { AuthService, User } from './services/auth.service';
import { Producto, PaginatedProductos } from './models/producto.model';
import { CarritoItem } from './models/carrito.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('ElectroMark - Premium Electronics');
  productos = signal<Producto[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);
  
  // Cart state
  cartItems = signal<CarritoItem[]>([]);
  isCartOpen = signal<boolean>(false);
  
  // Favorites state
  favorites = signal<number[]>([]);
  isFavsOpen = signal<boolean>(false);
  
  // Auth state
  isLoginOpen = signal<boolean>(false);
  currentUser = signal<User | null>(null);
  loginError = signal<string | null>(null);
  
  get totalCartItems() {
    return this.cartItems().reduce((acc, item) => acc + item.cantidad, 0);
  }

  get cartTotal() {
    return this.cartItems().reduce((acc, item) => acc + (item.precio_producto * item.cantidad), 0);
  }

  constructor(
    private productoService: ProductoService,
    private carritoService: CarritoService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUser.set(this.authService.getUser());
    this.loadPage(1);
    this.loadCart();
    
    // Load favorites from local storage
    const savedFavs = localStorage.getItem('favorites');
    if (savedFavs) {
      this.favorites.set(JSON.parse(savedFavs));
    }
  }

  loadCart(): void {
    this.carritoService.getCart().subscribe({
      next: (items) => this.cartItems.set(items),
      error: (err) => console.error('Error loading cart', err)
    });
  }

  addToCart(producto: Producto): void {
    this.carritoService.addToCart(producto.id_producto, 1).subscribe({
      next: () => {
        this.loadCart();
        this.isCartOpen.set(true);
      },
      error: (err) => console.error('Error adding to cart', err)
    });
  }

  removeFromCart(id_producto: number): void {
    this.carritoService.removeFromCart(id_producto).subscribe({
      next: () => this.loadCart(),
      error: (err) => console.error('Error removing from cart', err)
    });
  }

  toggleCart(): void {
    this.isCartOpen.set(!this.isCartOpen());
    if (this.isCartOpen()) this.isFavsOpen.set(false);
  }

  toggleFavs(): void {
    this.isFavsOpen.set(!this.isFavsOpen());
    if (this.isFavsOpen()) this.isCartOpen.set(false);
  }

  toggleFavorite(id_producto: number): void {
    const currentFavs = this.favorites();
    if (currentFavs.includes(id_producto)) {
      this.favorites.set(currentFavs.filter(id => id !== id_producto));
    } else {
      this.favorites.set([...currentFavs, id_producto]);
    }
    localStorage.setItem('favorites', JSON.stringify(this.favorites()));
  }

  isFavorite(id_producto: number): boolean {
    return this.favorites().includes(id_producto);
  }

  getFavoriteProducts(): Producto[] {
    return this.productos().filter(p => this.favorites().includes(p.id_producto));
  }

  toggleLogin(): void {
    this.isLoginOpen.set(!this.isLoginOpen());
    this.loginError.set(null);
  }

  login(event: Event, emailInput: HTMLInputElement, passInput: HTMLInputElement): void {
    event.preventDefault();
    this.authService.login(emailInput.value, passInput.value).subscribe({
      next: () => {
        this.currentUser.set(this.authService.getUser());
        this.isLoginOpen.set(false);
        this.loadCart(); // Reload cart to fetch merged items
      },
      error: () => {
        this.loginError.set('Credenciales inválidas');
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.currentUser.set(null);
    this.cartItems.set([]); // Clear cart or reload guest cart
    this.loadCart();
  }

  loadPage(page: number): void {
    if (page < 1 || (this.totalPages() > 0 && page > this.totalPages())) return;
    
    this.loading.set(true);
    this.error.set(null);
    this.currentPage.set(page);

    this.productoService.getProductos(page).subscribe({
      next: (response) => {
        this.productos.set(response.data);
        this.totalPages.set(response.totalPages);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error fetching products:', err);
        this.error.set('No se pudieron cargar los productos. Asegúrate de que el backend esté corriendo.');
        this.loading.set(false);
        this.totalPages.set(1);
        this.productos.set([]);
      }
    });
  }

  getPagesArray(): number[] {
    const pages = [];
    for (let i = 1; i <= this.totalPages(); i++) {
      pages.push(i);
    }
    return pages;
  }

  getProductImage(id_categoria: number): string {
    switch (id_categoria) {
      case 1: case 6: case 7: // Processors
        return 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=800&auto=format&fit=crop';
      case 2: case 8: case 9: // Graphics
        return 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&auto=format&fit=crop';
      case 3: case 10: case 11: case 12: // Storage
        return 'https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=800&auto=format&fit=crop';
      case 4: case 13: case 14: // Motherboards
        return 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop';
      case 5: case 15: case 16: // RAM
        return 'https://images.unsplash.com/photo-1562976540-1502c2145186?w=800&auto=format&fit=crop';
      case 17: // Smartphones
        return 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop';
      case 18: // Laptops
        return 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&auto=format&fit=crop';
      case 19: // Audio
        return 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop';
      case 20: // Monitors
        return 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop';
      default:
        return 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800&auto=format&fit=crop';
    }
  }
}
