const API_BASE   = import.meta.env.VITE_API_BASE;   // http://localhost:3000/api
const CODEX_BASE = import.meta.env.VITE_CODEX_BASE; // http://localhost:3000/api/codex

export async function apiGet(path: string) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

export async function apiPost(path: string, body: any) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

export async function codexGet(path: string) {
  const res = await fetch(`${CODEX_BASE}${path}`);
  if (!res.ok) throw new Error(`Codex ${res.status}`);
  return res.json();
}
