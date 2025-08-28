// --- системные импорты для путей (нужны для раздачи статики)
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- API
import express from 'express';

const app = express();
app.use(express.json());

// ===== Health =====
app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'api', ts: Date.now() });
});

// ===== Данные в памяти =====
const clients = [
  { id: 1, name: 'Иван',  phone: '+7-900-000-00-01' },
  { id: 2, name: 'Ольга', phone: '+7-900-000-00-02' },
];

// ===== Роуты клиентов =====
app.get('/api/clients', (req, res) => {
  res.json({ ok: true, data: clients });
});

app.get('/api/clients/:id', (req, res) => {
  const item = clients.find(c => c.id === Number(req.params.id));
  if (!item) return res.status(404).json({ ok: false, error: 'not_found' });
  res.json({ ok: true, data: item });
});

app.post('/api/clients', (req, res) => {
  const { name, phone } = req.body || {};
  if (!name) return res.status(400).json({ ok: false, error: 'name_required' });
  const id = (clients[clients.length - 1]?.id || 0) + 1;
  clients.push({ id, name, phone: phone ?? null });
  res.status(201).json({ ok: true, data: { id } });
});

app.put('/api/clients/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = clients.findIndex(c => c.id === id);
  if (idx === -1) return res.status(404).json({ ok: false, error: 'not_found' });
  const { name, phone } = req.body || {};
  clients[idx] = { ...clients[idx], ...(name ? { name } : {}), ...(phone !== undefined ? { phone } : {}) };
  res.json({ ok: true, data: clients[idx] });
});

app.delete('/api/clients/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = clients.findIndex(c => c.id === id);
  if (idx === -1) return res.status(404).json({ ok: false, error: 'not_found' });
  clients.splice(idx, 1);
  res.json({ ok: true });
});

// ===== Раздача собранного UI (Vite build) =====
const distDir = path.join(__dirname, '..', 'app-ui', 'dist');

// статика фронта
app.use(express.static(distDir));

// все не-API маршруты — в SPA
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ ok: false, error: 'not_found' });
  }
  res.sendFile(path.join(distDir, 'index.html'));
});

// ===== Start =====
const PORT = process.env.PORT || 3001; // на Replit приходит свой PORT
app.listen(PORT, () => {
  console.log('Server listening on http://localhost:' + PORT);
});

