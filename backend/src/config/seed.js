const fs = require('fs');
const path = require('path');
const db = require('./db');

const sqlScript = `
CREATE TABLE IF NOT EXISTS categoria (
  id_categoria SERIAL PRIMARY KEY,
  nombre VARCHAR(100),
  descripcion TEXT,
  id_padre INT
);

CREATE TABLE IF NOT EXISTS producto (
  id_producto SERIAL PRIMARY KEY,
  nombre_producto VARCHAR(100),
  descripcion_producto TEXT,
  precio_producto NUMERIC,
  stock_producto INT,
  marca_producto VARCHAR(50),
  id_categoria INT,
  FOREIGN KEY (id_categoria) REFERENCES categoria(id_categoria)
);

CREATE TABLE IF NOT EXISTS usuario (
  id_usuario SERIAL PRIMARY KEY,
  nombre VARCHAR(50),
  apellido VARCHAR(50),
  email VARCHAR(100),
  direccion VARCHAR(250),
  telefono VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS resena (
  id_resena SERIAL PRIMARY KEY,
  calificacion_resena INT,
  comentario TEXT,
  fecha_resena DATE,
  metadata JSONB,
  id_producto INT,
  id_usuario INT,
  FOREIGN KEY (id_producto) REFERENCES producto(id_producto),
  FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

CREATE TABLE IF NOT EXISTS carrito_compra (
  id_carrito SERIAL PRIMARY KEY,
  cantidad INT,
  id_usuario INT,
  id_producto INT,
  FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
  FOREIGN KEY (id_producto) REFERENCES producto(id_producto)
);

CREATE TABLE IF NOT EXISTS metodo_pago (
  id_pago SERIAL PRIMARY KEY,
  tipo_pago VARCHAR(50),
  description_pago TEXT
);

CREATE TABLE IF NOT EXISTS pedido (
  id_pedido SERIAL PRIMARY KEY,
  fecha_pedido DATE,
  total_pedido NUMERIC,
  estado VARCHAR(20),
  id_usuario INT,
  id_pago INT,
  FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
  FOREIGN KEY (id_pago) REFERENCES metodo_pago(id_pago)
);

CREATE TABLE IF NOT EXISTS detalle_pedido (
  id_detalle SERIAL PRIMARY KEY,
  cantidad INT,
  precio_unitario NUMERIC,
  id_pedido INT,
  id_producto INT,
  FOREIGN KEY (id_pedido) REFERENCES pedido(id_pedido),
  FOREIGN KEY (id_producto) REFERENCES producto(id_producto)
);
`;

async function seed() {
  try {
    console.log('Executing tables creation script...');
    await db.query(sqlScript);
    console.log('Tables created successfully.');

    // Check if products exist to avoid duplicate inserts on multiple runs
    const { rows } = await db.query('SELECT COUNT(*) FROM producto');
    if (parseInt(rows[0].count) === 0) {
      console.log('Inserting sample categories and products...');

      // Insert Categories
      await db.query(`
        INSERT INTO categoria (nombre, descripcion) VALUES
        ('Smartphones', 'Teléfonos móviles inteligentes'),
        ('Laptops', 'Computadoras portátiles de alto rendimiento'),
        ('Audio', 'Auriculares, parlantes y equipos de sonido'),
        ('Monitores', 'Monitores para PC y gaming')
      `);

      // Insert Products
      await db.query(`
        INSERT INTO producto (nombre_producto, descripcion_producto, precio_producto, stock_producto, marca_producto, id_categoria) VALUES
        ('Quantum X Pro Smartphone', 'Smartphone de última generación con pantalla OLED de 6.8" y cámara de 200MP.', 1199.99, 50, 'Quantum', 1),
        ('AeroBook Ultra 15', 'Laptop ultraligera para profesionales. Procesador M2, 32GB RAM, 1TB SSD.', 1999.50, 25, 'AeroTech', 2),
        ('SonicPulse Noise Cancelling Headphones', 'Auriculares inalámbricos con cancelación de ruido activa premium.', 349.00, 100, 'Sonic', 3),
        ('Nexus Vision 4K Monitor', 'Monitor curvo de 32 pulgadas 4K con tasa de refresco de 144Hz.', 599.99, 15, 'Nexus', 4)
      `);
      console.log('Sample data inserted successfully.');
    } else {
      console.log('Sample data already exists. Skipping insertion.');
    }

    console.log('Database seed completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
