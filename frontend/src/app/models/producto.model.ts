export interface Producto {
  id_producto: number;
  nombre_producto: string;
  descripcion_producto: string;
  precio_producto: number;
  stock_producto: number;
  marca_producto: string;
  id_categoria: number;
}

export interface PaginatedProductos {
  data: Producto[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}
