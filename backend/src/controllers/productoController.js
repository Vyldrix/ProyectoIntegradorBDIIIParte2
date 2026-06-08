const Producto = require('../models/Producto');
const redisClient = require('../config/redis');

exports.getAllProductos = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    const cacheKey = `productos:page:${page}`;

    // Check if products are in Redis cache
    const cachedProducts = await redisClient.get(cacheKey);
    if (cachedProducts) {
      return res.json(JSON.parse(cachedProducts));
    }

    // If not in cache, get from DB
    const { data, total } = await Producto.findPaginated(limit, offset);
    const totalPages = Math.ceil(total / limit);

    const result = {
      data,
      total,
      page,
      totalPages,
      limit
    };

    // Store in cache for 1 hour (3600 seconds)
    await redisClient.setEx(cacheKey, 3600, JSON.stringify(result));

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.getProductoById = async (req, res) => {
  try {
    const id = req.params.id;
    const cacheKey = `producto:${id}`;

    // Check cache
    const cachedProduct = await redisClient.get(cacheKey);
    if (cachedProduct) {
      return res.json(JSON.parse(cachedProduct));
    }

    const producto = await Producto.findById(id);
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Cache product
    await redisClient.setEx(cacheKey, 3600, JSON.stringify(producto));

    res.json(producto);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
