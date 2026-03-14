// routes/customers.js
// Maneja todo lo relacionado a clientes

const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// ── GET /api/customers ─────────────────────────────────────────────────────────
// Devuelve todos los clientes con sus puntos, ordenados por puntos (mayor primero)
router.get("/", async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { totalPoints: "desc" }, // Los clientes más fieles primero
      include: {
        // Incluye el conteo de pedidos de cada cliente
        _count: { select: { orders: true } },
      },
    });

    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener clientes", detail: error.message });
  }
});

// ── GET /api/customers/:id ─────────────────────────────────────────────────────
// Devuelve un cliente específico con todo su historial de pedidos
router.get("/:id", async (req, res) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
      include: {
        orders: {
          orderBy: { createdAt: "desc" }, // Pedidos más recientes primero
        },
      },
    });

    // Si no existe el cliente, devolvemos 404
    if (!customer) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el cliente", detail: error.message });
  }
});

// ── PUT /api/customers/:id ─────────────────────────────────────────────────────
// Actualiza datos de un cliente (ej. suma o resta puntos de forma manual)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { totalPoints, name, phone } = req.body;

    const updatedCustomer = await prisma.customer.update({
      where: { id: id },
      data: {
        ...(totalPoints !== undefined && { totalPoints: parseInt(totalPoints) }),
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone })
      }
    });
    res.json(updatedCustomer);
  } catch (error) {
    console.error("Error actualizando cliente:", error);
    res.status(500).json({ error: "Error actualizando el cliente", detail: error.message });
  }
});

module.exports = router;
