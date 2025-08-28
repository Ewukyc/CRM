import { useEffect, useState } from "react";
import { apiGet, codexGet } from "./api/client";

export default function App() {
  const [apiMsg, setApiMsg] = useState("…");
  const [cxMsg, setCxMsg] = useState("…");

  useEffect(() => {
    apiGet("/hello")
      .then(d => setApiMsg(d.message))
      .catch(e => setApiMsg("Ошибка API: " + e.message));

    codexGet("/health")
      .then(_ => setCxMsg("Codex OK"))
      .catch(e => setCxMsg("Ошибка Codex: " + e.message));
  }, []);

  return (
    <div>
      <h1>CRM UI</h1>
      <p>API: {apiMsg}</p>
      <p>Codex: {cxMsg}</p>
    </div>
  );
}
