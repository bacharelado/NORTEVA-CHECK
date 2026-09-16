import { FindingStatus, RiskLevel } from "@prisma/client";
import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../lib/auth";
import { addFindingForUser } from "../../../../../lib/store";
import { Finding } from "../../../../../lib/types";
import { hasValidSameOrigin } from "../../../../../lib/csrf";

const riskLevels = new Set<RiskLevel>(["CRITICAL", "HIGH", "MEDIUM", "LOW", "OK"]);
const findingStatuses = new Set<FindingStatus>(["OPEN", "MITIGATED", "ACCEPTED"]);

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!hasValidSameOrigin(request)) {
    return NextResponse.json({ error: "Origem da requisição não permitida." }, { status: 403 });
  }
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });

  const { id } = await context.params;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo JSON inválido." }, { status: 400 });
  }

  const level = String(body.level ?? "") as RiskLevel;
  const status = String(body.status ?? "OPEN") as FindingStatus;
  const finding: Omit<Finding, "id"> = {
    category: String(body.category ?? "").trim(),
    title: String(body.title ?? "").trim(),
    description: String(body.description ?? "").trim(),
    evidence: String(body.evidence ?? "").trim(),
    level,
    recommendation: String(body.recommendation ?? "").trim(),
    status
  };

  if (!finding.category || !finding.title || !finding.description || !finding.evidence || !finding.recommendation || !riskLevels.has(level) || !findingStatuses.has(status)) {
    return NextResponse.json({ error: "Categoria, título, descrição, evidência, nível e recomendação válidos são obrigatórios." }, { status: 400 });
  }

  try {
    const result = await addFindingForUser(user.id, id, finding);
    if (result.kind === "not_found" || result.kind === "forbidden") {
      return NextResponse.json({ error: "Diagnóstico não encontrado." }, { status: 404 });
    }
    if (result.kind === "invalid") {
      return NextResponse.json({ error: "Nível ou status de finding inválido." }, { status: 400 });
    }
    if (result.kind === "invalid_state") {
      return NextResponse.json({ error: "O diagnóstico não pode receber findings no estado atual." }, { status: 409 });
    }
    return NextResponse.json(result.diagnostic, { status: 201 });
  } catch (error) {
    console.error("Failed to add finding", error);
    return NextResponse.json({ error: "Não foi possível incluir o finding." }, { status: 500 });
  }
}
