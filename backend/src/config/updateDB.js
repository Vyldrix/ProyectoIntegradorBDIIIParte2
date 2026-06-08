const db = require('./db');

async function updateDB() {
  try {
    await db.query('ALTER TABLE usuario ADD COLUMN IF NOT EXISTS password VARCHAR(255)');
    await db.query("UPDATE usuario SET password = '123456' WHERE email = 'test@test.com'");
    console.log('Database updated for login.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

updateDB();
