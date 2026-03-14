const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// ── GET /api/restaurants ────────────────────────────────────────────────────────
// Devuelve la lista de sucursales disponibles
router.get("/", async (req, res) => {
  try {
    const restaurants = await prisma.restaurant.findMany({
      orderBy: { name: "asc" }
    });
    res.json(restaurants);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener restaurantes", detail: error.message });
  }
});
// ── GET /api/restaurants/:id ──────────────────────────────────────────────────
// Devuelve una sucursal en específico (útil para checkout)
router.get("/:id", async (req, res) => {
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: req.params.id }
    });
    if (!restaurant) return res.status(404).json({ error: "Restaurante no encontrado" });
    res.json(restaurant);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener restaurante", detail: error.message });
  }
});

// ── PUT /api/restaurants/:id ──────────────────────────────────────────────────
// Actualiza configuración de la sucursal (medios de pago, etc)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { acceptsCash, acceptsTransfer, acceptsMercadoPago } = req.body;

    const updated = await prisma.restaurant.update({
      where: { id },
      data: {
        ...(acceptsCash !== undefined && { acceptsCash }),
        ...(acceptsTransfer !== undefined && { acceptsTransfer }),
        ...(acceptsMercadoPago !== undefined && { acceptsMercadoPago }),
      }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar restaurante", detail: error.message });
  }
});

module.exports = router;
