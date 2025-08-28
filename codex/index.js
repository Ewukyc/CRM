import express from "express";
const app = express();
app.get("/health", (_req,res)=>res.json({ ok:true, service:"codex", ts:Date.now() }));
app.listen(4000, ()=>console.log("CODEX on 4000"));
