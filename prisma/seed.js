// seed.js: llena la base de datos con datos de prueba para el nuevo demo (Catálogo + Puntos)
// Ejecutar con: npx prisma db push && node prisma/seed.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed de la base de datos...");

  // 1. Limpiar la BD para empezar fresco (descomentar si es necesario limpiar a mano)
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.restaurant.deleteMany();

  // 2. Crear las 3 sucursales
  const restaurantesData = [
    { id: "sucursal-centro", name: "FideliResto - Centro" },
    { id: "sucursal-norte", name: "FideliResto - Norte" },
    { id: "sucursal-sur", name: "FideliResto - Sur" },
  ];

  for (const r of restaurantesData) {
    await prisma.restaurant.create({
      data: {
        id: r.id,
        name: r.name,
      },
    });
    console.log(`✅ Sucursal creada: ${r.name}`);
  }

  // 3. Crear productos para el catálogo MUNDIAL de restaurantes (solo les pondremos al Centro por ahora para el demo rápido, o a todas si queremos)
  const productosData = [
    {
      name: "Hamburguesa Doble Queso",
      description: "Doble carne smasheada, doble cheddar, cebolla crispy y salsa de la casa.",
      price: 6500,
      imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800",
      optionGroups: {
        create: [
          {
            name: "Elegí tu bebida",
            isRequired: true,
            maxSelections: 1,
            choices: {
              create: [
                { name: "Pepsi Línea", additionalPrice: 1500 },
                { name: "Paso de los Toros", additionalPrice: 1500 },
                { name: "Agua Mineral", additionalPrice: 1000 },
                { name: "Sin Bebida", additionalPrice: 0 }
              ]
            }
          },
          {
            name: "Agregados Extra",
            isRequired: false,
            maxSelections: 3,
            choices: {
              create: [
                { name: "Extra Carne Smash", additionalPrice: 2000 },
                { name: "Extra Cheddar", additionalPrice: 800 },
                { name: "Panceta Crispy", additionalPrice: 1200 }
              ]
            }
          }
        ]
      }
    },
    {
      name: "Mila Napolitana con Fritas",
      description: "Clásica milanesa de ternera con salsa de tomate, jamón, queso gratinado y porción de papas.",
      price: 8500,
      imageUrl: "https://images.unsplash.com/photo-1598514982205-f36b96d1e8dd?auto=format&fit=crop&q=80&w=800",
      optionGroups: {
        create: [
          {
            name: "Guarnición",
            isRequired: true,
            maxSelections: 1,
            choices: {
              create: [
                { name: "Papas Fritas", additionalPrice: 0 },
                { name: "Puré de Papas", additionalPrice: 0 },
                { name: "Ensalada Mixta", additionalPrice: 0 }
              ]
            }
          }
        ]
      }
    },
    {
      name: "Pizza Margarita",
      description: "Masa madre, salsa de tomate italiana, mozzarella fior di latte y albahaca fresca.",
      price: 8200,
      imageUrl: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&q=80&w=800",
    },
    {
      name: "Gaseosa Cola 500ml",
      description: "Bebida refrescante línea cola.",
      price: 1500,
      imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=800",
    }
  ];

  for (const r of restaurantesData) {
    for (const p of productosData) {
      await prisma.product.create({
        data: {
          ...p,
          restaurantId: r.id,
        },
      });
    }
    console.log(`🛒 Productos cargados para la sucursal: ${r.name}`);
  }

  // 4. Crear un Cliente Demo con 6 puntos (a punto de ganar la recompensa de los 7 pts)
  const clienteDemo = await prisma.customer.create({
    data: {
      name: "Cliente Demo",
      phone: "+5491100000000",
      totalPoints: 6, // 6 puntos, al pedir ganará 1 extra y llegará a 7
      restaurantId: "sucursal-centro",
    },
  });
  console.log(`👤 Cliente Demo creado con ${clienteDemo.totalPoints} puntos.`);

  console.log("\n🎉 Seed completado! La base de datos tiene catálogo, sucursales y un cliente demo.");
}

main()
  .catch((e) => {
    console.error("❌ Error en el seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
