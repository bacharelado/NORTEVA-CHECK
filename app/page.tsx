"use client";

import { useState } from "react";

const risks = [
  ["red", "MFA não habilitado em contas críticas", "Aumenta o impacto de comprometimento de credenciais.", "ALTO"],
  ["red", "Backup sem teste recente de restauração", "A existência do backup não confirma capacidade de recuperação.", "ALTO"],
  ["yellow", "Registros DNS precisam de revisão", "Configurações públicas devem ser revisadas e documentadas.", "MÉDIO"],
  ["green", "TLS dentro do padrão esperado", "Nenhuma ação prioritária indicada neste item.", "OK"]
];

export default function Home() {
  const [started, setStarted] = useState(false);
  const [company, setCompany] = useState("");
  const [authorized, setAuthorized] = useState(false);

  const start = () => setStarted(true);

  return (
    <main className="app">
      <nav className="nav">
        <div className="brand"><div className="logo">N</div><div>NORTEVA <span>CHECK</span></div></div>
        <div className="navlinks"><a href="#produto">Produto</a><a href="#diagnostico">Diagnóstico</a><a href="#relatorio">Relatório</a><a href="#preco">Investimento</a></div>
        <button className="btn primary" onClick={start}>Iniciar CHECK</button>
      </nav>

      <section className="hero" id="produto">
        <div>
          <div className="kicker">Diagnóstico de segurança digital</div>
          <h1>Descubra onde sua empresa está exposta.</h1>
          <p>O NORTEVA CHECK transforma uma avaliação autorizada de segurança em um diagnóstico claro, priorizado e acionável.</p>
          <div className="actions"><button className="btn primary" onClick={start}>Quero fazer o diagnóstico</button><a className="btn" href="#diagnostico">Ver como funciona</a></div>
        </div>
        <div className="heroCard">
          <div className="cardTop"><strong>Panorama da segurança</strong><span className="status">DIAGNÓSTICO ATIVO</span></div>
          <div className="score">63%<small>postura atual</small></div>
          <div className="progress"><i /></div>
          <p style={{color:"var(--muted)",fontSize:13}}>8 de 8 etapas planejadas • 5 pontos de atenção • 12 recomendações</p>
        </div>
      </section>

      <section className="grid" id="diagnostico">
        <div className="sectionTitle"><div><h2>Experiência do cliente</h2><p>Do primeiro clique até o plano de correção.</p></div></div>
        <div className="steps">
          {[['01','Solicitação e autorização','O responsável informa a empresa, define o escopo e autoriza o diagnóstico.'],['02','Coleta e análise','A avaliação reúne evidências técnicas e informações fornecidas pelo cliente, dentro do escopo.'],['03','Dashboard','O cliente acompanha o andamento e recebe um panorama simples da situação.'],['04','Resultados','Cada achado é separado em fato observado, risco e recomendação.'],['05','Plano de correção','Os pontos são organizados por prioridade, esforço e próxima ação.'],['06','Relatório','O diagnóstico completo fica disponível para consulta e exportação.']].map(([n,t,p])=><article className="step panel" key={n}><div className="stepNum">ETAPA {n}</div><h3>{t}</h3><p>{p}</p></article>)}
        </div>

        <div className="sectionTitle"><div><h2>Dashboard do diagnóstico</h2><p>Uma visão executiva antes dos detalhes técnicos.</p></div></div>
        <div className="metrics">
          <div className="metric"><span>Nível de exposição</span><b>Médio</b><span>Requer atenção planejada</span></div>
          <div className="metric"><span>Riscos encontrados</span><b>5</b><span>2 altos • 2 médios • 1 baixo</span></div>
          <div className="metric"><span>Itens analisados</span><b>8/8</b><span>Diagnóstico concluído</span></div>
          <div className="metric"><span>Correções</span><b>12</b><span>Ações recomendadas</span></div>
        </div>

        <div className="layout" style={{marginTop:16}}>
          <div className="panel"><h3>Principais resultados</h3>{risks.map(([level,title,desc,badge])=><div className="risk" key={title}><div className={`dot ${level}`} /><div><strong>{title}</strong><small>{desc}</small></div><span className="badge">{badge}</span></div>)}</div>
          <div className="panel"><h3>Plano de correção</h3><div className="risk"><div className="dot red"/><div><strong>Ativar MFA</strong><small>Contas críticas</small></div><span className="badge">1–2 dias</span></div><div className="risk"><div className="dot red"/><div><strong>Testar backups</strong><small>Restaurabilidade</small></div><span className="badge">2–3 dias</span></div><div className="risk"><div className="dot yellow"/><div><strong>Revisar DNS</strong><small>Registros públicos</small></div><span className="badge">1–2 dias</span></div><div className="risk"><div className="dot yellow"/><div><strong>Revisar acessos</strong><small>Usuários</small></div><span className="badge">3–5 dias</span></div></div>
        </div>

        <div className="sectionTitle" id="relatorio"><div><h2>Relatório executivo</h2><p>O cliente não precisa ser especialista em segurança para entender o resultado.</p></div></div>
        <div className="panel"><div className="layout"><div><div className="kicker">RELATÓRIO DE DIAGNÓSTICO</div><h2 style={{fontSize:34,margin:"14px 0"}}>Segurança digital da empresa</h2><p style={{color:"var(--muted)",lineHeight:1.7}}>Resumo executivo, escopo avaliado, evidências relevantes, riscos priorizados e plano de correção. O relatório diferencia claramente o que foi observado do que é recomendação.</p></div><div className="panel"><div className="kicker">ÍNDICE DE ATENÇÃO</div><div style={{fontSize:54,fontWeight:900,margin:"12px 0"}}>63</div><div className="progress"><i /></div><p style={{color:"var(--muted)",fontSize:13}}>Indicador demonstrativo da experiência.</p></div></div></div>

        <div className="cta" id="preco"><div><h2>Pronto para descobrir seus pontos de atenção?</h2><p>Diagnóstico inicial por R$ 197. Primeiros 5 clientes por R$ 97.</p></div><button className="btn primary" onClick={start}>Solicitar diagnóstico</button></div>
      </section>

      {started && <div style={{position:"fixed",inset:0,background:"rgba(2,7,13,.82)",backdropFilter:"blur(8px)",zIndex:50,display:"grid",placeItems:"center",padding:20}}><div className="panel" style={{maxWidth:520,width:"100%"}}><div className="cardTop"><div><div className="kicker">NORTEVA CHECK</div><h2 style={{margin:"8px 0 0"}}>Solicitar diagnóstico</h2></div><button className="btn" onClick={()=>setStarted(false)}>Fechar</button></div><p style={{color:"var(--muted)",lineHeight:1.6}}>Informe a empresa para iniciar a solicitação. A execução técnica depende de autorização e escopo definidos.</p><input value={company} onChange={e=>setCompany(e.target.value)} placeholder="Nome da empresa" style={{width:"100%",padding:14,borderRadius:10,border:"1px solid var(--line)",background:"#07111d",color:"white",marginBottom:12}}/><label style={{display:"flex",gap:10,alignItems:"flex-start",color:"var(--muted)",fontSize:13,marginBottom:18}}><input type="checkbox" checked={authorized} onChange={e=>setAuthorized(e.target.checked)} />Confirmo que sou responsável ou estou autorizado a solicitar o diagnóstico para esta empresa.</label><button className="btn primary" disabled={!company || !authorized} onClick={()=>{setStarted(false);alert(`Solicitação registrada para ${company}. Próximo passo: definir escopo e autorização.`)}} style={{width:"100%",opacity:company&&authorized?1:.5}}>Continuar</button></div></div>}

      <footer className="footer"><span>NORTEVA CHECK • Segurança digital prática</span><span>Diagnóstico autorizado • Privacidade • Evidências</span></footer>
    </main>
  );
}
