// E:\CRM\CRM\api\index.js  — ESM, минимальная версия
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
// UPDATE /api/clients/:id
app.put('/api/clients/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = clients.findIndex(c => c.id === id);
  if (idx === -1) return res.status(404).json({ ok: false, error: 'not_found' });
  const { name, phone } = req.body || {};
  clients[idx] = { ...clients[idx], ...(name ? { name } : {}), ...(phone !== undefined ? { phone } : {}) };
  res.json({ ok: true, data: clients[idx] });
});

// DELETE /api/clients/:id
app.delete('/api/clients/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = clients.findIndex(c => c.id === id);
  if (idx === -1) return res.status(404).json({ ok: false, error: 'not_found' });
  clients.splice(idx, 1);
  res.json({ ok: true });
});

// ===== Start =====
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log('API listening on http://localhost:' + PORT);
});
