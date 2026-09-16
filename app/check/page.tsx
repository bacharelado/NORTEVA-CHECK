"use client";

import { FormEvent, useState } from "react";

export default function CheckPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ id: string; company: string } | null>(null);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/diagnostics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyName: form.get("companyName"),
        contactName: form.get("contactName"),
        contactEmail: form.get("contactEmail"),
        contactPhone: form.get("contactPhone"),
        authorized: form.get("authorized") === "on"
      })
    });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(data.error ?? "Não foi possível criar o diagnóstico.");
      return;
    }
    setResult({ id: data.diagnostic.id, company: data.company.name });
  }

  if (result) {
    return (
      <main className="app" style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
        <section className="panel" style={{ maxWidth: 620, width: "100%" }}>
          <div className="kicker">SOLICITAÇÃO RECEBIDA</div>
          <h1 style={{ margin: "12px 0" }}>CHECK criado para {result.company}</h1>
          <p style={{ color: "var(--muted)", lineHeight: 1.7 }}>O diagnóstico foi registrado no backend. O próximo passo é formalizar o escopo e iniciar a análise somente dentro da autorização concedida.</p>
          <div className="metric" style={{ marginTop: 20 }}><span>ID do diagnóstico</span><b style={{ fontSize: 20 }}>{result.id}</b><span>Status: DRAFT</span></div>
          <a className="btn primary" href="/" style={{ marginTop: 20 }}>Voltar ao produto</a>
        </section>
      </main>
    );
  }

  return (
    <main className="app" style={{ minHeight: "100vh", padding: 24 }}>
      <section style={{ maxWidth: 760, margin: "0 auto", paddingTop: 70 }}>
        <div className="kicker">NORTEVA CHECK</div>
        <h1 style={{ margin: "12px 0" }}>Solicitar diagnóstico</h1>
        <p style={{ color: "var(--muted)", lineHeight: 1.7 }}>Preencha os dados da empresa. Nenhuma análise técnica será executada automaticamente; a etapa seguinte é definir e confirmar o escopo autorizado.</p>
        <form className="panel" onSubmit={submit} style={{ marginTop: 28, display: "grid", gap: 14 }}>
          <input name="companyName" required placeholder="Nome da empresa" />
          <input name="contactName" placeholder="Responsável" />
          <input name="contactEmail" type="email" placeholder="E-mail" />
          <input name="contactPhone" placeholder="Telefone" />
          <label style={{ display: "flex", gap: 10, alignItems: "flex-start", color: "var(--muted)", fontSize: 13, lineHeight: 1.5 }}><input name="authorized" type="checkbox" required />Confirmo que sou responsável ou estou autorizado a solicitar este diagnóstico para a empresa informada.</label>
          {error && <div style={{ color: "#ff8c8c" }}>{error}</div>}
          <button className="btn primary" type="submit" disabled={loading}>{loading ? "Registrando..." : "Criar solicitação"}</button>
        </form>
      </section>
    </main>
  );
}
