const express  = require('express');
const path      = require('path');
const fs        = require('fs');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Archivo de pedidos persistentes ────────────────────────
const ORDERS_FILE = path.join(__dirname, 'pedidos.json');

function loadOrders() {
  try {
    if (fs.existsSync(ORDERS_FILE)) {
      return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Error leyendo pedidos.json:', e.message);
  }
  return [];
}

function saveOrders(orders) {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf8');
  } catch (e) {
    console.error('Error guardando pedidos.json:', e.message);
  }
}

let orders = loadOrders();

// ── Middleware ──────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS (útil si el frontend corre en otro puerto)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Archivos estáticos
app.use(express.static(path.join(__dirname)));

// ── Logger de peticiones ────────────────────────────────────
app.use((req, res, next) => {
  const now = new Date().toLocaleTimeString('es-MX');
  console.log(`[${now}] ${req.method} ${req.url}`);
  next();
});

// ── Rutas ───────────────────────────────────────────────────

// Página principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'herencia-picante.html'));
});

// ── POST /api/pedido — Nuevo pedido ────────────────────────
app.post('/api/pedido', (req, res) => {
  const { nombre, direccion, ciudad, telefono, pago, items, total } = req.body;

  if (!nombre || !direccion || !telefono) {
    return res.status(400).json({ error: 'Faltan datos obligatorios: nombre, dirección y teléfono.' });
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'El pedido no contiene productos.' });
  }

  const ordenNum = '#HP-' + Math.floor(1000 + Math.random() * 9000);
  const orden = {
    id:      ordenNum,
    fecha:   new Date().toISOString(),
    estado:  'pendiente',
    cliente: { nombre, direccion, ciudad: ciudad || 'Nuevo Laredo', telefono },
    pago:    pago || 'entrega',
    items,
    total:   Number(total) || 0,
  };

  orders.push(orden);
  saveOrders(orders);   // Guarda en disco para no perder pedidos al reiniciar

  console.log(`\n🌶️  NUEVO PEDIDO: ${ordenNum}`);
  console.log(`   👤 ${nombre}  📞 ${telefono}`);
  console.log(`   📍 ${direccion}, ${ciudad || 'Nuevo Laredo'}`);
  console.log(`   💳 Pago: ${pago}  |  💰 Total: $${total} MXN`);
  console.log(`   🛒 Productos: ${items.map(i => i.nombre || i.name).join(', ')}\n`);

  res.json({
    success:  true,
    ordenNum,
    mensaje:  '¡Pedido confirmado! Te contactaremos pronto por WhatsApp.',
  });
});

// ── GET /api/pedidos — Ver todos los pedidos (admin) ───────
app.get('/api/pedidos', (req, res) => {
  const estado = req.query.estado;  // ?estado=pendiente
  const result = estado ? orders.filter(o => o.estado === estado) : orders;
  res.json({ total: result.length, pedidos: result });
});

// ── PATCH /api/pedido/:id — Actualizar estado ───────────────
app.patch('/api/pedido/:id', (req, res) => {
  const orden = orders.find(o => o.id === req.params.id);
  if (!orden) return res.status(404).json({ error: 'Pedido no encontrado.' });

  const { estado } = req.body;
  const estadosValidos = ['pendiente', 'confirmado', 'en camino', 'entregado', 'cancelado'];
  if (!estadosValidos.includes(estado)) {
    return res.status(400).json({ error: `Estado inválido. Opciones: ${estadosValidos.join(', ')}` });
  }

  orden.estado = estado;
  saveOrders(orders);

  console.log(`📦 Pedido ${orden.id} → estado: "${estado}"`);
  res.json({ success: true, orden });
});

// ── GET /api/productos — Lista de productos ────────────────
app.get('/api/productos', (req, res) => {
  res.json([
    {
      id:           1,
      nombre:       'Herencia Suave Roja',
      descripcion:  'Salsa tradicional hecha con chile, tomate y cebolla.',
      precio:       60,
      picante:      1,
      presentacion: '500 ml',
      disponible:   true,
    },
    {
      id:           2,
      nombre:       'Herencia Verde Noble',
      descripcion:  'Salsa verde con jalapeño, habanero y calabaza.',
      precio:       60,
      picante:      2,
      presentacion: '500 ml',
      disponible:   true,
    },
    {
      id:           3,
      nombre:       'Piquín Salvaje',
      descripcion:  'Salsa intensa preparada con chile piquín silvestre.',
      precio:       60,
      picante:      4,
      presentacion: '500 ml',
      disponible:   true,
    },
    {
      id:           4,
      nombre:       'Árbol Implacable',
      descripcion:  'Salsa de chile de árbol con picor potente y persistente.',
      precio:       60,
      picante:      5,
      presentacion: '500 ml',
      disponible:   true,
    },
  ]);
});

// ── GET /api/stats — Estadísticas rápidas ──────────────────
app.get('/api/stats', (req, res) => {
  const total    = orders.reduce((s, o) => s + o.total, 0);
  const estados  = {};
  orders.forEach(o => { estados[o.estado] = (estados[o.estado] || 0) + 1; });

  res.json({
    totalPedidos:  orders.length,
    totalVentas:   `$${total} MXN`,
    porEstado:     estados,
  });
});

// ── 404 ─────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada.' });
});

// ── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('🌶️  ═══════════════════════════════════════');
  console.log('       HERENCIA PICANTE — Servidor Web     ');
  console.log('       Nuevo Laredo, Tamaulipas, México    ');
  console.log('🌶️  ═══════════════════════════════════════');
  console.log(`\n✅  http://localhost:${PORT}`);
  console.log(`📦  Pedidos guardados en: pedidos.json`);
  console.log('    Presiona Ctrl+C para detener\n');
});
