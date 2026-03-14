// routes/qr.js
// Ruta pública que usa el cliente al escanear el QR
// No requiere autenticación: cualquiera con el token puede ver los datos del pedido

const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// ── GET /api/qr/:token ─────────────────────────────────────────────────────────
// El cliente escanea el QR → abre la URL → el frontend llama a esta ruta
// Devuelve los datos del pedido para mostrarle al cliente sus puntos
router.get("/:token", async (req, res) => {
  try {
    const { token } = req.params;

    // Buscamos el pedido por su token único
    const order = await prisma.order.findUnique({
      where: { qrToken: token },
      include: {
        // Incluimos los datos del cliente para mostrar su nombre y puntos totales
        customer: {
          select: {
            name:        true,
            phone:       true,
            totalPoints: true,
          },
        },
        // Incluimos el restaurante para mostrar su nombre
        restaurant: {
          select: {
            name: true,
          },
        },
      },
    });

    // Si el token no existe (QR inválido o expirado)
    if (!order) {
      return res.status(404).json({ error: "QR inválido o no encontrado" });
    }

    // Marcamos el pedido como "escaneado" si todavía estaba "pending"
    if (order.status === "pending") {
      await prisma.order.update({
        where: { qrToken: token },
        data: { status: "scanned" },
      });
    }

    // Devolvemos todo lo que necesita la pantalla del cliente
    res.json({
      restaurantName: order.restaurant.name,
      customerName:   order.customer.name,
      amount:         order.amount,
      pointsEarned:   order.pointsEarned,
      totalPoints:    order.customer.totalPoints,
      createdAt:      order.createdAt,
    });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el QR", detail: error.message });
  }
});

module.exports = router;
