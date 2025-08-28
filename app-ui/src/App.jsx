import ClientsList from './ClientsList';
import { useEffect, useMemo, useState } from "react";
import * as db from "./idb";
const { clients: C, deals: D } = db.STORES_CONST;

const statuses = ["new", "in_progress", "won", "lost"];

export default function App() {
  const [tab, setTab] = useState("clients");
  const [clients, setClients] = useState([]);
  const [deals, setDeals] = useState([]);
  const [q, setQ] = useState("");

  // формы
  const [cName, setCName] = useState("");
  const [cPhone, setCPhone] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cNotes, setCNotes] = useState("");

  const [dTitle, setDTitle] = useState("");
  const [dClientId, setDClientId] = useState("");
  const [dAmount, setDAmount] = useState("");
  const [dStatus, setDStatus] = useState("new");

  const filteredClients = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return clients;
    return clients.filter(c =>
      [c.name, c.phone, c.email, c.notes].filter(Boolean).some(v => String(v).toLowerCase().includes(s))
    );
  }, [clients, q]);

  const dealsWithClient = useMemo(() => {
    const m = new Map(clients.map(c => [c.id, c.name]));
    return deals.map(d => ({ ...d, clientName: m.get(d.clientId) || `#${d.clientId}` }));
  }, [deals, clients]);

  useEffect(() => { refresh(); }, []);
  async function refresh() {
    const [cs, ds] = await Promise.all([db.all(C), db.all(D)]);
    setClients(cs);
    setDeals(ds);
  }

  // клиенты
  async function addClient(e) {
    e.preventDefault();
    if (!cName.trim()) return alert("Имя обязательно");
    await db.add(C, { name: cName.trim(), phone: cPhone.trim() || null, email: cEmail.trim() || null, notes: cNotes.trim() || "" });
    setCName(""); setCPhone(""); setCEmail(""); setCNotes("");
    await refresh();
  }
  async function removeClient(id) {
    const boundDeals = deals.filter(d => d.clientId === id).length;
    if (boundDeals && !confirm(`У клиента есть ${boundDeals} сделок. Удалить вместе с ними?`)) return;
    // удалить связанные сделки
    for (const d of deals.filter(x => x.clientId === id)) await db.del(D, d.id);
    await db.del(C, id);
    await refresh();
  }

  // сделки
  async function addDeal(e) {
    e.preventDefault();
    if (!dTitle.trim()) return alert("Название обязательно");
    const cid = Number(dClientId);
    if (!cid) return alert("Выбери клиента");
    await db.add(D, { title: dTitle.trim(), clientId: cid, amount: dAmount ? Number(dAmount) : null, status: dStatus });
    setDTitle(""); setDClientId(""); setDAmount(""); setDStatus("new");
    await refresh();
  }
  async function updateDealStatus(id, status) {
    const curr = deals.find(d => d.id === id);
    if (!curr) return;
    await db.put(D, { ...curr, status });
    await refresh();
  }
  async function removeDeal(id) { await db.del(D, id); await refresh(); }

  // экспорт/импорт
  async function exportJSON() {
    const data = await db.dumpDB();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `crm_export_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
  async function importJSON(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    await db.importDB(JSON.parse(text));
    await refresh();
    e.target.value = "";
  }

  return (
    // ВАЖНО: единый родитель для всего JSX
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={{margin:0}}>Zero-Install CRM (IndexedDB)</h1>
        <div>
          <button style={tab === "clients" ? s.btnActive : s.btn} onClick={() => setTab("clients")}>Клиенты</button>
          <button style={tab === "deals" ? s.btnActive : s.btn} onClick={() => setTab("deals")}>Сделки</button>
        </div>
      </div>

      <div style={s.toolbar}>
        <input style={s.search} placeholder="Поиск по клиентам / заметкам / email / телефону" value={q} onChange={e=>setQ(e.target.value)} />
        <div style={{display:"flex", gap:8}}>
          <button style={s.btn} onClick={exportJSON}>Экспорт</button>
          <label style={s.btnLabel}>
            Импорт
            <input type="file" accept="application/json" onChange={importJSON} style={{display:"none"}} />
          </label>
        </div>
      </div>

      {tab === "clients" ? (
        <div style={s.grid2}>
          <form onSubmit={addClient} style={s.card}>
            <h2>Новый клиент</h2>
            <label style={s.lbl}>Имя*<input style={s.inp} value={cName} onChange={e=>setCName(e.target.value)} /></label>
            <label style={s.lbl}>Телефон<input style={s.inp} value={cPhone} onChange={e=>setCPhone(e.target.value)} /></label>
            <label style={s.lbl}>Email<input style={s.inp} value={cEmail} onChange={e=>setCEmail(e.target.value)} /></label>
            <label style={s.lbl}>Заметки<textarea style={s.ta} value={cNotes} onChange={e=>setCNotes(e.target.value)} /></label>
            <button style={s.btnPrimary}>Сохранить</button>
          </form>

          <div style={s.card}>
            <h2>Клиенты ({filteredClients.length})</h2>
            {filteredClients.length === 0 ? <p>Нет записей</p> : (
              <ul style={s.list}>
                {filteredClients.map(c => (
                  <li key={c.id} style={s.item}>
                    <div>
                      <strong>{c.name}</strong>
                      <div style={s.sub}>{[c.phone, c.email, c.notes].filter(Boolean).join(" · ")}</div>
                    </div>
                    <button style={s.btnDanger} onClick={()=>removeClient(c.id)}>Удалить</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : (
        <div style={s.grid2}>
          <form onSubmit={addDeal} style={s.card}>
            <h2>Новая сделка</h2>
            <label style={s.lbl}>Название*<input style={s.inp} value={dTitle} onChange={e=>setDTitle(e.target.value)} /></label>
            <label style={s.lbl}>Клиент*
              <select style={s.inp} value={dClientId} onChange={e=>setDClientId(e.target.value)}>
                <option value="">— выбери клиента —</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label style={s.lbl}>Сумма<input style={s.inp} type="number" value={dAmount} onChange={e=>setDAmount(e.target.value)} /></label>
            <label style={s.lbl}>Статус
              <select style={s.inp} value={dStatus} onChange={e=>setDStatus(e.target.value)}>
                {statuses.map(s=> <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <button style={s.btnPrimary}>Сохранить</button>
          </form>

          <div style={s.card}>
            <h2>Сделки ({dealsWithClient.length})</h2>
            {dealsWithClient.length === 0 ? <p>Нет записей</p> : (
              <ul style={s.list}>
                {dealsWithClient.map(d => (
                  <li key={d.id} style={s.item}>
                    <div>
                      <strong>{d.title}</strong> — {d.clientName}
                      <div style={s.sub}>
                        {d.amount != null ? `Сумма: ${d.amount} · ` : ""}Статус: {d.status}
                      </div>
                    </div>
                    <div style={{display:"flex", gap:6}}>
                      {statuses.map(st => (
                        <button key={st} style={d.status===st? s.btnActiveSmall : s.btnSmall} onClick={()=>updateDealStatus(d.id, st)}>{st}</button>
                      ))}
                      <button style={s.btnDanger} onClick={()=>removeDeal(d.id)}>Удалить</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* --- Блок для проверки API --- */}
      <div style={{marginTop:16}}>
        <div style={s.card}>
          <ClientsList />
        </div>
      </div>
    </div>
  );
}

const s = {
  page:{fontFamily:"system-ui, Arial", background:"#0b0d10", color:"#e9eef3", minHeight:"100vh", padding:"20px"},
  header:{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16},
  btn:{background:"#20262d", color:"#e9eef3", border:"1px solid #2e3742", padding:"8px 12px", borderRadius:8, cursor:"pointer"},
  btnActive:{background:"#3b82f6", color:"#fff", border:"1px solid #3b82f6", padding:"8px 12px", borderRadius:8, cursor:"pointer"},
  btnSmall:{background:"#20262d", color:"#e9eef3", border:"1px solid #2e3742", padding:"4px 8px", borderRadius:6, cursor:"pointer", fontSize:12},
  btnActiveSmall:{background:"#3b82f6", color:"#fff", border:"1px solid #3b82f6", padding:"4px 8px", borderRadius:6, cursor:"pointer", fontSize:12},
  btnPrimary:{background:"#22c55e", color:"#0b0d10", border:"none", padding:"10px 14px", borderRadius:8, cursor:"pointer", fontWeight:700, marginTop:8},
  btnDanger:{background:"#ef4444", color:"#fff", border:"none", padding:"8px 12px", borderRadius:8, cursor:"pointer"},
  btnLabel:{background:"#20262d", color:"#e9eef3", border:"1px solid #2e3742", padding:"8px 12px", borderRadius:8, cursor:"pointer"},
  toolbar:{display:"flex", justifyContent:"space-between", gap:12, marginBottom:16},
  search:{flex:1, padding:"10px 12px", borderRadius:8, border:"1px solid #2e3742", background:"#0f1318", color:"#e9eef3"},
  grid2:{display:"grid", gridTemplateColumns:"1fr 1fr", gap:16},
  card:{background:"#0f1318", border:"1px solid #2e3742", borderRadius:12, padding:16, boxShadow:"0 4px 12px rgba(0,0,0,.25)"},
  lbl:{display:"block", fontSize:14, marginBottom:8},
  inp:{width:"100%", padding:"10px 12px", borderRadius:8, border:"1px solid #2e3742", background:"#0b0d10", color:"#e9eef3", marginTop:6},
  ta:{width:"100%", padding:"10px 12px", minHeight:70, borderRadius:8, border:"1px solid #2e3742", background:"#0b0d10", color:"#e9eef3", marginTop:6},
  list:{listStyle:"none", padding:0, margin:0},
  item:{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:"1px solid #2e3742"},
  sub:{opacity:.8, fontSize:13, marginTop:4}
};
