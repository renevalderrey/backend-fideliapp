// app.js: el punto de entrada del servidor
// Configura Express y conecta todas las rutas

require("dotenv").config(); // Carga las variables del archivo .env
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middlewares ────────────────────────────────────────────────────────────────

// CORS: permite que el frontend (React) pueda llamar a esta API
// En producción conviene restringir origins, pero para el demo abrimos todo
app.use(cors());

// Permite recibir JSON en el body de los requests
app.use(express.json());

// ── Rutas ─────────────────────────────────────────────────────────────────────

// Importamos los archivos de rutas
const customersRouter   = require("./routes/customers");
const ordersRouter      = require("./routes/orders");
const qrRouter          = require("./routes/qr");
const productsRouter    = require("./routes/products");
const restaurantsRouter = require("./routes/restaurants");

// Montamos las rutas bajo el prefijo /api
app.use("/api/customers",   customersRouter);
app.use("/api/orders",      ordersRouter);
app.use("/api/qr",          qrRouter);
app.use("/api/products",    productsRouter);
app.use("/api/restaurants", restaurantsRouter);

// ── Ruta de salud: para verificar que el server está corriendo ─────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "FideliResto API funcionando 🍽️" });
});

// ── Manejo global de errores ───────────────────────────────────────────────────
// Cualquier error no capturado llega aquí
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.message);
  res.status(500).json({ error: "Error interno del servidor", detail: err.message });
});

// ── Iniciar servidor ──────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🍽️  FideliResto API corriendo en http://localhost:${PORT}`);
  console.log(`📋 Rutas disponibles:`);
  console.log(`   GET  /health`);
  console.log(`   GET  /api/customers`);
  console.log(`   POST /api/orders`);
  console.log(`   GET  /api/qr/:token`);
});
