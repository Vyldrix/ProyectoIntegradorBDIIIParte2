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

// Helper function for Selective Invalidation
const invalidarCacheCatalogo = async () => {
  try {
    // Usamos .original.keys porque keys no se expuso en el safe wrapper (config/redis.js)
    if (!redisClient.original.isOpen) return;
    const keys = await redisClient.original.keys('producto*'); // Cubre productos:page:* y producto:*
    
    if (keys.length > 0) {
      await redisClient.del(keys); // del() soporta borrar multiples llaves
      console.log(`Cache invalidado para las llaves: ${keys.join(', ')}`);
    }
  } catch (error) {
    console.error('Error al invalidar cache del catalogo:', error);
  }
};

exports.createProducto = async (req, res) => {
  try {
    const newProduct = await Producto.create(req.body);
    await invalidarCacheCatalogo();
    res.status(201).json(newProduct);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.updateProducto = async (req, res) => {
  try {
    const id = req.params.id;
    const updatedProduct = await Producto.update(id, req.body);
    if (!updatedProduct) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    await invalidarCacheCatalogo();
    res.json(updatedProduct);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.deleteProducto = async (req, res) => {
  try {
    const id = req.params.id;
    const deletedProduct = await Producto.softDelete(id);
    if (!deletedProduct) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    await invalidarCacheCatalogo();
    res.json({ message: 'Producto desactivado exitosamente', producto: deletedProduct });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
