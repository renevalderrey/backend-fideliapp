const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// ── GET /api/products ────────────────────────────────────────────────────────
// Devuelve los productos, opcionalmente filtrados por sucursal ?restaurantId=...
router.get("/", async (req, res) => {
  try {
    const filter = req.query.restaurantId ? { restaurantId: String(req.query.restaurantId) } : {};
    
    // Obtenemos todos los productos. En un caso real, por paginación o categoría.
    const products = await prisma.product.findMany({
      where: filter,
      orderBy: { name: "asc" },
      include: {
        optionGroups: {
          include: { choices: true }
        }
      }
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener productos", detail: error.message });
  }
});

// ── POST /api/products ───────────────────────────────────────────────────────
// Crea un producto nuevo (para el panel de admin)
router.post("/", async (req, res) => {
  try {
    const { name, description, price, imageUrl, restaurantId, optionGroups } = req.body;
    
    if (!name || !price || !restaurantId) {
      return res.status(400).json({ error: "Faltan datos obligatorios (name, price, restaurantId)" });
    }

    const newProduct = await prisma.product.create({
      data: {
        name,
        description,
        price: Number(price),
        imageUrl,
        restaurantId,
        optionGroups: {
          create: optionGroups?.map(g => ({
            name: g.name,
            isRequired: g.isRequired,
            maxSelections: g.maxSelections,
            choices: {
              create: g.choices?.map(c => ({
                name: c.name,
                additionalPrice: Number(c.additionalPrice || 0)
              })) || []
            }
          })) || []
        }
      },
      include: {
        optionGroups: { include: { choices: true } }
      }
    });
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ error: "Error al crear producto", detail: error.message });
  }
});

// ── PUT /api/products/:id ────────────────────────────────────────────────────
// Actualiza un producto existente
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, imageUrl, optionGroups } = req.body;

    // Si mandan optionGroups, hacemos un reseteo de sus opciones (delete + create)
    // Es el approach más sencillo y robusto para catálogos pequeños 
    if (optionGroups) {
      await prisma.productOptionGroup.deleteMany({ where: { productId: id } })
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(price && { price: Number(price) }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(optionGroups && {
          optionGroups: {
            create: optionGroups.map(g => ({
              name: g.name,
              isRequired: g.isRequired,
              maxSelections: g.maxSelections,
              choices: {
                create: g.choices?.map(c => ({
                  name: c.name,
                  additionalPrice: Number(c.additionalPrice || 0)
                })) || []
              }
            }))
          }
        })
      },
      include: {
        optionGroups: { include: { choices: true } }
      }
    });
    res.json(updatedProduct);
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Error al actualizar producto", detail: error.message });
  }
});

// ── DELETE /api/products/:id ─────────────────────────────────────────────────
// Elimina un producto del catálogo
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.product.delete({ where: { id } });
    res.json({ success: true, message: "Producto eliminado" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar producto", detail: error.message });
  }
});

module.exports = router;
