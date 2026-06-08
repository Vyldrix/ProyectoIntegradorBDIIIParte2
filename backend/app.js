const express = require('express');
const cors = require('cors');
require('dotenv').config();

const productoRoutes = require('./src/routes/productoRoutes');
const carritoRoutes = require('./src/routes/carritoRoutes');
const authRoutes = require('./src/routes/authRoutes');

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-session-id', 'x-user-id']
}));
app.use(express.json());

// Routes
app.use('/api/productos', productoRoutes);
app.use('/api/carrito', carritoRoutes);
app.use('/api/auth', authRoutes);

// Test route
app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to ElectroMark API' });
});

module.exports = app;
