const db = require('../config/db');

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const { rows } = await db.query('SELECT * FROM usuario WHERE email = $1 AND password = $2', [email, password]);
    
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = rows[0];
    // Normally you'd generate a JWT here. For simplicity, returning user data.
    res.json({
      success: true,
      user: {
        id_usuario: user.id_usuario,
        nombre: user.nombre,
        email: user.email
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
