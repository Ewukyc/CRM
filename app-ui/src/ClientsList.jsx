import { useEffect, useState } from 'react'

export default function ClientsList() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [raw, setRaw] = useState(null)

  async function load() {
    try {
      setLoading(true)
      setError('')
      const res = await fetch('/api/clients', { headers: { 'Accept': 'application/json' } })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setRaw(data)
      // Поддерживаем обе формы ответа: массив ИЛИ { ok, data: [...] }
      const arr = Array.isArray(data) ? data : (data?.data ?? [])
      setClients(arr)
    } catch (e) {
      setError(String(e))
      setClients([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h2 style={{marginTop:0}}>Клиенты из API</h2>
        <button onClick={load} style={{padding:'6px 10px', borderRadius:8, border:'1px solid #2e3742', background:'#20262d', color:'#e9eef3'}}>Обновить</button>
      </div>

      {loading && <p>Загрузка…</p>}
      {error && <p style={{color:'#ef4444'}}>Ошибка: {error}</p>}

      {clients.length === 0 && !loading ? (
        <p>Нет записей</p>
      ) : (
        <ul style={{paddingLeft:18}}>
          {clients.map(c => (
            <li key={c.id}>{c.name} — {c.phone}</li>
          ))}
        </ul>
      )}

      {/* Диагностика: покажем сырые данные ответа */}
      <details style={{marginTop:12}}>
        <summary>Показать сырой ответ</summary>
        <pre style={{whiteSpace:'pre-wrap'}}>{JSON.stringify(raw, null, 2)}</pre>
      </details>
    </div>
  )
}
