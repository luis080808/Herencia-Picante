const express = require('express');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the current folder
app.use(express.static(path.join(__dirname)));

// ── Routes ──────────────────────────────────────────────────

// Home — serve the main HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'herencia-picante.html'));
});

// ── API: Recibir pedido ─────────────────────────────────────
// Cuando el cliente confirma su pedido, guarda los datos aquí
const orders = [];

app.post('/api/pedido', (req, res) => {
  const { nombre, direccion, ciudad, telefono, pago, items, total } = req.body;

  if (!nombre || !direccion || !telefono) {
    return res.status(400).json({ error: 'Faltan datos del cliente.' });
  }

  const ordenNum = '#HP-' + Math.floor(1000 + Math.random() * 9000);
  const orden = {
    id: ordenNum,
    fecha: new Date().toISOString(),
    cliente: { nombre, direccion, ciudad, telefono },
    pago: pago || 'entrega',
    items: items || [],
    total: total || 0,
  };

  orders.push(orden);

  console.log(`\n✅ Nuevo pedido recibido: ${ordenNum}`);
  console.log(`   Cliente: ${nombre} | Tel: ${telefono}`);
  console.log(`   Total: $${total} MXN | Pago: ${pago}`);

  res.json({ success: true, ordenNum, mensaje: '¡Pedido confirmado! Te contactaremos por WhatsApp.' });
});

// ── API: Ver pedidos (admin) ────────────────────────────────
app.get('/api/pedidos', (req, res) => {
  res.json({ total: orders.length, pedidos: orders });
});

// ── API: Productos disponibles ──────────────────────────────
app.get('/api/productos', (req, res) => {
  const productos = [
    {
      id: 1,
      nombre: 'Herencia Suave Roja',
      descripcion: 'Salsa tradicional hecha con chile, tomate y cebolla.',
      precio: 60,
      picante: 1,
      presentacion: '500 ml',
    },
    {
      id: 2,
      nombre: 'Herencia Verde Noble',
      descripcion: 'Salsa verde con jalapeño, habanero y calabaza.',
      precio: 60,
      picante: 2,
      presentacion: '500 ml',
    },
    {
      id: 3,
      nombre: 'Piquín Salvaje',
      descripcion: 'Salsa intensa preparada con chile piquín silvestre.',
      precio: 60,
      picante: 4,
      presentacion: '500 ml',
    },
    {
      id: 4,
      nombre: 'Árbol Implacable',
      descripcion: 'Salsa de chile de árbol con picor potente y persistente.',
      precio: 60,
      picante: 5,
      presentacion: '500 ml',
    },
  ];
  res.json(productos);
});

// ── Start server ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('🌶️  ================================');
  console.log('   HERENCIA PICANTE — Servidor Web');
  console.log('   Nuevo Laredo, Tamaulipas');
  console.log('🌶️  ================================');
  console.log(`\n✅ Servidor corriendo en: http://localhost:${PORT}`);
  console.log('   Presiona Ctrl+C para detener\n');
});
