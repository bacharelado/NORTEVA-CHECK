"use client";

import { FormEvent, useState } from "react";

export default function LoginPage() {
  const [register, setRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const payload = register
      ? {
          name: String(form.get("name") ?? ""),
          companyName: String(form.get("companyName") ?? ""),
          email: String(form.get("email") ?? ""),
          password: String(form.get("password") ?? "")
        }
      : { email: String(form.get("email") ?? ""), password: String(form.get("password") ?? "") };

    const response = await fetch(register ? "/api/auth/register" : "/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(data.error ?? "Não foi possível concluir a operação.");
      return;
    }
    window.location.href = "/account";
  }

  return (
    <main className="app" style={{ minHeight: "100vh", padding: 24 }}>
      <section style={{ maxWidth: 520, margin: "0 auto", paddingTop: 70 }}>
        <div className="kicker">NORTEVA CHECK</div>
        <h1 style={{ margin: "12px 0" }}>{register ? "Criar acesso" : "Entrar"}</h1>
        <p style={{ color: "var(--muted)", lineHeight: 1.7 }}>
          {register ? "Crie o primeiro acesso da sua empresa. A conta será responsável pela organização inicial." : "Use seu acesso para consultar somente os diagnósticos da sua empresa."}
        </p>
        <form className="panel" onSubmit={submit} style={{ marginTop: 28, display: "grid", gap: 14 }}>
          {register && <input name="name" required placeholder="Seu nome" />}
          {register && <input name="companyName" required placeholder="Nome da empresa" />}
          <input name="email" type="email" required placeholder="E-mail" autoComplete="email" />
          <input name="password" type="password" required minLength={12} placeholder="Senha (mínimo de 12 caracteres)" autoComplete={register ? "new-password" : "current-password"} />
          {error && <div style={{ color: "#ff8c8c" }}>{error}</div>}
          <button className="btn primary" type="submit" disabled={loading}>{loading ? "Aguarde..." : register ? "Criar conta" : "Entrar"}</button>
        </form>
        <button className="btn" type="button" onClick={() => { setRegister(!register); setError(""); }} style={{ marginTop: 14 }}>
          {register ? "Já tenho uma conta" : "Criar uma conta"}
        </button>
      </section>
    </main>
  );
}
