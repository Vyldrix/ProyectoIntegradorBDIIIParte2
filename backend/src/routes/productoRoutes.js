const express = require('express');
const router = express.Router();
const productoController = require('../controllers/productoController');

router.get('/', productoController.getAllProductos);
router.get('/:id', productoController.getProductoById);

module.exports = router;
