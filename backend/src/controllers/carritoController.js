const Carrito = require('../models/Carrito');
const Producto = require('../models/Producto');
const redisClient = require('../config/redis');

exports.getCart = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const sessionId = req.headers['x-session-id'];

    if (userId) {
      // Logged in user
      const cacheKey = `cart:user:${userId}`;
      const cachedCart = await redisClient.get(cacheKey);
      if (cachedCart) return res.json(JSON.parse(cachedCart));

      const items = await Carrito.getCartByUserId(userId);
      await redisClient.setEx(cacheKey, 600, JSON.stringify(items));
      return res.json(items);
    } else if (sessionId) {
      // Guest user
      const cacheKey = `cart:guest:${sessionId}`;
      const cachedCart = await redisClient.get(cacheKey);
      return res.json(cachedCart ? JSON.parse(cachedCart) : []);
    } else {
      return res.status(400).json({ error: 'Falta identificador de usuario o sesión' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.addToCart = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const sessionId = req.headers['x-session-id'];
    const { id_producto, cantidad } = req.body;

    if (!id_producto) return res.status(400).json({ error: 'id_producto es requerido' });

    if (userId) {
      const item = await Carrito.addItem(userId, id_producto, cantidad || 1);
      await redisClient.del(`cart:user:${userId}`);
      return res.json(item);
    } else if (sessionId) {
      const cacheKey = `cart:guest:${sessionId}`;
      let cart = await redisClient.get(cacheKey);
      cart = cart ? JSON.parse(cart) : [];

      const existing = cart.find(i => i.id_producto === id_producto);
      if (existing) {
        existing.cantidad += (cantidad || 1);
      } else {
        // Need to fetch product details to store in Redis
        const pResult = await require('../config/db').query('SELECT * FROM producto WHERE id_producto = $1', [id_producto]);
        if (pResult.rows.length > 0) {
          const p = pResult.rows[0];
          cart.push({
            id_carrito: Date.now(), // dummy id
            id_producto: p.id_producto,
            cantidad: cantidad || 1,
            nombre_producto: p.nombre_producto,
            precio_producto: p.precio_producto,
            marca_producto: p.marca_producto
          });
        }
      }
      await redisClient.setEx(cacheKey, 7200, JSON.stringify(cart)); // 2 horas
      return res.json(cart);
    } else {
      return res.status(400).json({ error: 'Falta identificador' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.removeFromCart = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const sessionId = req.headers['x-session-id'];
    const id_producto = parseInt(req.params.id);

    if (userId) {
      await Carrito.removeItem(userId, id_producto);
      await redisClient.del(`cart:user:${userId}`);
      return res.json({ success: true });
    } else if (sessionId) {
      const cacheKey = `cart:guest:${sessionId}`;
      let cart = await redisClient.get(cacheKey);
      if (cart) {
        cart = JSON.parse(cart).filter(i => i.id_producto !== id_producto);
        await redisClient.setEx(cacheKey, 86400, JSON.stringify(cart));
      }
      return res.json({ success: true });
    } else {
      return res.status(400).json({ error: 'Falta identificador' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.mergeCart = async (req, res) => {
  try {
    const { userId, sessionId } = req.body;
    if (!userId || !sessionId) return res.status(400).json({ error: 'Faltan datos' });

    const cacheKey = `cart:guest:${sessionId}`;
    let cart = await redisClient.get(cacheKey);
    if (cart) {
      cart = JSON.parse(cart);
      for (const item of cart) {
        await Carrito.addItem(userId, item.id_producto, item.cantidad);
      }
      // Clear guest cart
      await redisClient.del(cacheKey);
      await redisClient.del(`cart:user:${userId}`);
    }
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
