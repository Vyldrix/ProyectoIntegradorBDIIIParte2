const express = require('express');
const router = express.Router();
const carritoController = require('../controllers/carritoController');

router.get('/', carritoController.getCart);
router.post('/add', carritoController.addToCart);
router.delete('/remove/:id', carritoController.removeFromCart);
router.post('/merge', carritoController.mergeCart);

module.exports = router;
