const db = require('../config/db');

class Carrito {
  static async getCartByUserId(userId) {
    const query = `
      SELECT c.id_carrito, c.cantidad, c.id_producto, p.nombre_producto, p.precio_producto, p.marca_producto
      FROM carrito_compra c
      JOIN producto p ON c.id_producto = p.id_producto
      WHERE c.id_usuario = $1
    `;
    const { rows } = await db.query(query, [userId]);
    return rows;
  }

  static async addItem(userId, productoId, cantidad = 1) {
    // Check if it already exists
    const checkQuery = 'SELECT id_carrito, cantidad FROM carrito_compra WHERE id_usuario = $1 AND id_producto = $2';
    const checkResult = await db.query(checkQuery, [userId, productoId]);

    if (checkResult.rows.length > 0) {
      // Update quantity
      const newQuantity = checkResult.rows[0].cantidad + cantidad;
      const updateQuery = 'UPDATE carrito_compra SET cantidad = $1 WHERE id_usuario = $2 AND id_producto = $3 RETURNING *';
      const { rows } = await db.query(updateQuery, [newQuantity, userId, productoId]);
      return rows[0];
    } else {
      // Insert new item
      const insertQuery = 'INSERT INTO carrito_compra (id_usuario, id_producto, cantidad) VALUES ($1, $2, $3) RETURNING *';
      const { rows } = await db.query(insertQuery, [userId, productoId, cantidad]);
      return rows[0];
    }
  }

  static async removeItem(userId, productoId) {
    const deleteQuery = 'DELETE FROM carrito_compra WHERE id_usuario = $1 AND id_producto = $2 RETURNING *';
    const { rows } = await db.query(deleteQuery, [userId, productoId]);
    return rows[0];
  }
}

module.exports = Carrito;
