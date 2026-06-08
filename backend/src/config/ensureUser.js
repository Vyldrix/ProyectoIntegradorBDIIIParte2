const db = require('./db');

async function ensureUser() {
  try {
    const res = await db.query('SELECT * FROM usuario WHERE id_usuario = 1');
    if (res.rows.length === 0) {
      console.log('User 1 not found. Inserting default user...');
      await db.query(`
        INSERT INTO usuario (id_usuario, nombre, apellido, email) 
        VALUES (1, 'Test', 'User', 'test@test.com')
      `);
      console.log('User inserted.');
    } else {
      console.log('User 1 already exists.');
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

ensureUser();
