"use client";

import { useEffect, useState } from "react";

type Account = {
  user: { id: string; name: string; email: string };
  company: { id: string; name: string } | null;
  role: "OWNER" | "ADMIN" | "MEMBER" | null;
};

export default function AccountPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/auth/me").then(async (response) => {
      const data = await response.json();
      if (!response.ok) {
        window.location.href = "/login";
        return;
      }
      setAccount(data);
    }).catch(() => setError("Não foi possível carregar a sessão."));
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  if (error) return <main className="app" style={{ padding: 40 }}><div className="panel">{error}</div></main>;
  if (!account) return <main className="app" style={{ padding: 40 }}><div className="panel">Carregando sessão...</div></main>;

  return (
    <main className="app" style={{ minHeight: "100vh", padding: 24 }}>
      <section style={{ maxWidth: 760, margin: "0 auto", paddingTop: 70 }}>
        <div className="kicker">SESSÃO AUTENTICADA</div>
        <h1 style={{ margin: "12px 0" }}>Olá, {account.user.name}</h1>
        <div className="panel" style={{ display: "grid", gap: 12 }}>
          <div><strong>E-mail</strong><div style={{ color: "var(--muted)", marginTop: 6 }}>{account.user.email}</div></div>
          <div><strong>Empresa atual</strong><div style={{ color: "var(--muted)", marginTop: 6 }}>{account.company?.name ?? "Nenhuma empresa associada"}</div></div>
          <div><strong>Papel</strong><div style={{ color: "var(--muted)", marginTop: 6 }}>{account.role ?? "Sem papel"}</div></div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
            <a className="btn primary" href="/check">Solicitar diagnóstico</a>
            <button className="btn" type="button" onClick={logout}>Sair</button>
          </div>
        </div>
      </section>
    </main>
  );
}
