const db = require('../config/db');

class Producto {
  static async findAll() {
    const query = 'SELECT * FROM producto';
    const { rows } = await db.query(query);
    return rows;
  }

  static async findPaginated(limit, offset) {
    const query = 'SELECT * FROM producto ORDER BY id_producto ASC LIMIT $1 OFFSET $2';
    const { rows } = await db.query(query, [limit, offset]);
    
    const countQuery = 'SELECT COUNT(*) FROM producto';
    const countResult = await db.query(countQuery);
    const total = parseInt(countResult.rows[0].count);
    
    return { data: rows, total };
  }

  static async findById(id) {
    const query = 'SELECT * FROM producto WHERE id_producto = $1';
    const { rows } = await db.query(query, [id]);
    return rows[0];
  }

  // Add more methods as needed (create, update, delete)
  static async create(data) {
    const { nombre_producto, descripcion_producto, precio_producto, stock_producto, marca_producto, id_categoria } = data;
    const query = `
      INSERT INTO producto (nombre_producto, descripcion_producto, precio_producto, stock_producto, marca_producto, id_categoria)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [nombre_producto, descripcion_producto, precio_producto, stock_producto, marca_producto, id_categoria];
    const { rows } = await db.query(query, values);
    return rows[0];
  }

  static async update(id, data) {
    const { nombre_producto, descripcion_producto, precio_producto, stock_producto, marca_producto, id_categoria } = data;
    const query = `
      UPDATE producto
      SET nombre_producto = COALESCE($1, nombre_producto),
          descripcion_producto = COALESCE($2, descripcion_producto),
          precio_producto = COALESCE($3, precio_producto),
          stock_producto = COALESCE($4, stock_producto),
          marca_producto = COALESCE($5, marca_producto),
          id_categoria = COALESCE($6, id_categoria)
      WHERE id_producto = $7
      RETURNING *
    `;
    const values = [nombre_producto, descripcion_producto, precio_producto, stock_producto, marca_producto, id_categoria, id];
    const { rows } = await db.query(query, values);
    return rows[0];
  }

  static async softDelete(id) {
    // Aseguramos que la columna exista primero por si no fue creada
    await db.query(`ALTER TABLE producto ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;`);
    const query = 'UPDATE producto SET activo = false WHERE id_producto = $1 RETURNING *';
    const { rows } = await db.query(query, [id]);
    return rows[0];
  }
}

module.exports = Producto;
