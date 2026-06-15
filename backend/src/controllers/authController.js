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

exports.register = async (req, res) => {
  const { nombre, apellido, email, direccion, telefono, password } = req.body;

  if (!nombre || !apellido || !email || !direccion || !telefono) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }

  try {
    // Nota: El procedure registrar_usuario_web no recibe password. 
    // Si tu tabla requiere password, deberías agregarlo al procedure en la base de datos 
    // y aquí abajo pasarlo como un argumento más ($6).
    await db.query(
      'CALL registrar_usuario_web($1, $2, $3, $4, $5)',
      [nombre, apellido, email, direccion, telefono]
    );
    
    res.status(201).json({ success: true, message: 'Usuario registrado exitosamente (via PROCEDURE)' });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    // Si el procedure tira un RAISE EXCEPTION, lo capturamos acá.
    res.status(500).json({ error: 'Ocurrió un error al registrar el usuario', details: error.message });
  }
};
