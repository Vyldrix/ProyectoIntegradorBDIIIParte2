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

## Arquitecturas Híbridas e Integración (Proyecto Integrador - Parte 4)

Este módulo del proyecto comprende el desarrollo de la API REST para la gestión del catálogo de productos, la integración de una capa de persistencia en caché mediante **Redis** con estrategias de invalidación selectiva.

---

## 1. Operación CREATE (Método POST)
* **Misión:** Permitir el alta de un nuevo registro en la base de datos de manera segura.
* **Implementación:** Se desarrolló el endpoint `POST /api/productos` para registrar nuevos artículos. Los datos viajan en el cuerpo de la petición (`req.body`) en formato JSON. El servidor procesa la inserción en PostgreSQL y retorna un código de estado **201 Created** junto con el objeto completo del producto recientemente insertado (incluyendo su `id_producto` autogenerado por la secuencia).

<img width="933" height="548" alt="POST" src="https://github.com/user-attachments/assets/7a0bb199-a1d7-4938-b789-2cc50c7f4c9f" />

---

## 2. Operación UPDATE (Método PUT)
* **Misión:** Permitir la modificación parcial o total de los atributos de un registro existente.
* **Implementación:** Se implementó el endpoint `PUT /api/productos/:id`. El identificador del producto viaja como parámetro en la URL (`req.params.id`), mientras que los valores a modificar se envían en el Body. En el modelo se utilizó la función `COALESCE` de PostgreSQL para actualizar únicamente los campos provistos en la petición, manteniendo intactos los demás componentes del registro original.

<img width="933" height="479" alt="PUT" src="https://github.com/user-attachments/assets/d7868e38-fc65-4d8e-a138-3dfca2e41bc4" />

---

## 3. Operación DELETE (Baja Lógica)
* **Misión:** Eliminar un registro del sistema aplicando las mejores prácticas de la industria, evitando la pérdida física de datos y protegiendo la integridad referencial.
* **Implementación:** Se creó el endpoint `DELETE /api/productos/:id`. Siguiendo la regla estricta de arquitectura, **no se utiliza `DELETE FROM`**. En su lugar, se implementó un **Soft Delete** (Baja Lógica) mediante una sentencia `UPDATE` que modifica la columna booleana `activo`, estableciendo su valor en `false`. El registro permanece en la base de datos para auditoría, pero queda virtualmente removido de las consultas del catálogo público.

<img width="934" height="425" alt="DELETE" src="https://github.com/user-attachments/assets/da7b46f5-0466-43dc-a064-3aa3f254dff1" />

---

## 4. Invalidación Selectiva de Caché en Redis
* **Misión:** Garantizar la consistencia de los datos en tiempo real sin destruir información persistente de otros módulos (como sesiones de usuario).
* **Regla estricta cumplida:** Se evitó por completo el uso del comando masivo `redisClient.flushDb()`.
* **Solución aplicada:** En el controlador `productoController.js` se diseñó la función helper `invalidarCacheCatalogo()`. Cada vez que ocurren operaciones de escritura (`POST`, `PUT`, `DELETE`), el backend utiliza los comandos de Redis para buscar de forma selectiva las llaves que coincidan con el patrón del catálogo de productos (`producto*`) y proceder a su remoción individual (`del()`). Esto asegura que la siguiente petición `GET` consulte directo a PostgreSQL y refresque la caché de manera automática.

<img width="934" height="398" alt="GET 1" src="https://github.com/user-attachments/assets/0f834a1d-5ec2-4c30-a88d-f6a165ecfdc3" />

---

## 5. Funcionalidad Avanzada: Alta de Usuarios vía Stored Procedure y Auditoría
Como valor agregado a la arquitectura y robustez del sistema, se incorporó la lógica de negocios del registro de usuarios directamente en el motor de la base de datos mediante un **Procedimiento Almacenado** (`CALL registrar_usuario_web`).

* **Manejo de Excepciones y Auditoría:** El procedimiento cuenta con bloques estructurados de captura de errores (`EXCEPTION`). Si el usuario ingresa datos duplicados o con formatos no válidos, el sistema intercepta el error. En su lugar, el motor almacena y clasifica los eventos en una tabla centralizada de logs (`audit_logs`), capturando el código de estado SQL (`sql_state`), la operación y el mensaje descriptivo del motor.

### Evidencia de Registro Exitoso y Validaciones

* **Caso 1: Registro Exitoso de Usuario Estudiante** Se procesa de manera limpia la inserción completa de los datos en la tabla correspondiente.
*
  
<img width="933" height="498" alt="Creacion de U con el P(SEE)" src="https://github.com/user-attachments/assets/990bda3a-e1d2-46a0-a0a2-9b9249ccc593" />

* **Caso 2: Registro con Advertencia (Formato de Teléfono)** Petición que envía un formato de teléfono local sin el prefijo internacional correspondiente. El Procedure no corta la ejecución del servidor, sino que maneja la advertencia internamente.
*

<img width="935" height="498" alt="Creacion de U con el P(EE)" src="https://github.com/user-attachments/assets/2f09a58d-4c30-42bc-a6f3-6fd2a91644bd" />

### Consulta de la Tabla de Auditoría (`audit_logs`)
Al realizar la inspección directa en el manejador de base de datos (`pgAdmin` / consola), se puede verificar cómo el procedimiento almacenado interceptó, clasificó y registró los escenarios de control de forma transparente:

<img width="995" height="366" alt="Tabla auditoria" src="https://github.com/user-attachments/assets/52d2e89e-d026-455a-818b-a0be70891bd3" />

* **Fila 1 (`SQLSTATE 23505`):** Captura el error crítico de clave duplicada cuando un email ya existente intenta registrarse nuevamente.
* **Fila 2 (`SQLSTATE 01000`):** Almacena la advertencia de un usuario registrado con teléfono local sin validar, permitiendo el alta del cliente pero dejando el registro de auditoría para futuras validaciones de datos.
