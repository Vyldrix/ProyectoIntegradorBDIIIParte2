***

## Checklist: Integración de Caché con Redis (Proyecto Integrador - Parte 3)

Esta sección detalla el progreso de la implementación de la capa de persistencia políglota utilizando Redis como almacén clave-valor en memoria.

### 1. Fase de Diseño y Selección
- [x] Identificamos 1 o 2 endpoints estratégicos para cachear (alta frecuencia de lectura, baja de escritura).
- [x] Listado de endpoints cacheados:
  - *Endpoint 1:* `/api/productos?page=X` (Catálogo paginado de productos).
  - *Endpoint 2:* `/api/carrito` (Estado actual del carrito de compras y gestión de sesión anónima).
- [x] Asegurar que el caso de uso soporta **consistencia eventual** (tolera desactualización de 1 o 2 minutos sin romper el sistema). *(El catálogo de productos en un e-commerce rara vez cambia a cada segundo. Si el usuario ve un nombre o descripción en caché, el sistema es 100% resiliente a esto).*

### 2. Configuración (Setup)
- [x] Instalamos el cliente de Redis en nuestro proyecto (`npm install redis`).
- [x] Establecemos conexión exitosa con el servidor de Redis (Cloud/Docker en `redis://localhost:6379`).
- [x] Implementamos **Manejo de Errores (Fallback)**: Si Redis se cae, la aplicación registra el error pero sigue funcionando, consultando directamente la base de datos principal mediante un Wrapper de seguridad `safeClient` que bloquea caídas de la App y realiza un **Cache MISS** forzado.

### 3. Implementación del Patrón Cache-Aside (Lazy Loading)
- [x] **Consulta a la Caché:** El endpoint verifica primero si la clave existe en Redis (`await redisClient.get(cacheKey)`).
- [x] **Cache HIT:** Si el dato existe, se retorna inmediatamente al cliente (se evita ir a la DB y parseamos el JSON).
- [x] **Cache MISS (Consulta a la DB):** Si el dato NO existe, el sistema realiza la consulta a la base de datos principal PostgreSQL.
- [x] **Población de la Caché:** Guardamos el resultado obtenido de la base de datos en Redis (`await redisClient.setEx(cacheKey, 3600, JSON.stringify(result))`).
- [x] Devolver la respuesta final al cliente en todos los flujos.

### 4. Buenas Prácticas Técnicas
- [x] **Nomenclatura (Namespacing):** Utilizamos el estándar de separación con dos puntos (`:`) para las claves. *(Ejemplos usados: `productos:page:1`, `cart:user:1`, `cart:guest:sess_xyz`)*.
- [x] **Asignación de TTL:** Toda clave guardada en Redis tiene un tiempo de vida (Time-To-Live) configurado. *(Ejemplo: al catálogo de productos se le asignó un TTL de 3600 segundos (1 hora), y a los carritos anónimos 7200 segundos (2 horas) usando el método `setEx` de Redis).*

***

<img width="1212" height="587" alt="Captura de pantalla 2026-06-08 162928" src="https://github.com/user-attachments/assets/722c5b82-1859-4a94-a0c0-86a4876e4e8d" />

