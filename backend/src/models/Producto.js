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
}

module.exports = Producto;
