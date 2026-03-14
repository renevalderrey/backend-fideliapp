// routes/orders.js
// Maneja la creación de pedidos desde el carrito del cliente

const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// ── POST /api/orders ───────────────────────────────────────────────────────────
// Crea un nuevo pedido con los items del carrito
// Se suman 1 punto por compra fija (demo)
router.post("/", async (req, res) => {
  const { customerPhone, customerName, items, orderType, restaurantId } = req.body;

  // Validación
  if (!customerPhone || !items || !items.length || !restaurantId) {
    return res.status(400).json({ error: "Faltan datos obligatorios (phone, items, restaurantId)" });
  }

  // Calculamos el total verificando los precios en la BD para evitar fraudes
  try {
    const productIds = items.map(i => i.productId);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } }
    });

    let totalAmount = 0;
    const orderItemsData = items.map(item => {
      const dbProduct = dbProducts.find(p => p.id === item.productId);
      if (!dbProduct) throw new Error(`Producto ${item.productId} no encontrado`);
      
      // Para el MVP Confiamos en el cálculo de opciones del frontend (`optionsTotal`) para simplificar y acelerar
      const itemPrice = dbProduct.price + (item.optionsTotal || 0);
      const itemTotal = itemPrice * item.quantity;
      totalAmount += itemTotal;
      
      return {
        productId: item.productId,
        quantity: item.quantity,
        price: itemPrice, // guardamos el precio congelado
        selectedOptions: item.selectedOptionsText || null
      };
    });

    // Puntos fijos: 1 punto por pedido.
    const pointsEarned = 1;

    // Buscamos/actualizamos cliente
    const customer = await prisma.customer.upsert({
      where: {
        phone_restaurantId: { phone: customerPhone, restaurantId: restaurantId },
      },
      update: {
        totalPoints: { increment: pointsEarned },
        ...(customerName && { name: customerName }),
      },
      create: {
        phone: customerPhone,
        name: customerName || "Cliente",
        totalPoints: pointsEarned,
        restaurantId: restaurantId,
      },
    });

    // Creamos pedido y sus items en una transacción (anidado)
    const order = await prisma.order.create({
      data: {
        amount: totalAmount,
        pointsEarned,
        orderType: orderType || "delivery",
        customerId: customer.id,
        restaurantId: restaurantId,
        items: {
          create: orderItemsData
        }
      },
      include: {
        items: true
      }
    });

    res.status(201).json({
      order,
      customer: {
        id: customer.id,
        name: customer.name,
        totalPoints: customer.totalPoints,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Error al crear el pedido", detail: error.message });
  }
});

// ── GET /api/orders ────────────────────────────────────────────────────────────
// Lista todos los pedidos (para el dashboard del admin)
router.get("/", async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { name: true, phone: true } },
        items: {
          include: { product: { select: { name: true } } }
        }
      },
    });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener pedidos", detail: error.message });
  }
});

module.exports = router;
