import { FindingStatus, RiskLevel } from "@prisma/client";
import { NextResponse } from "next/server";
import { addFinding, getDiagnostic } from "../../../../../lib/store";
import { Finding } from "../../../../../lib/types";

const riskLevels = new Set<RiskLevel>(["CRITICAL", "HIGH", "MEDIUM", "LOW", "OK"]);
const findingStatuses = new Set<FindingStatus>(["OPEN", "MITIGATED", "ACCEPTED"]);

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
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

  const existing = await getDiagnostic(id);
  if (!existing) return NextResponse.json({ error: "Diagnóstico não encontrado." }, { status: 404 });
  if (existing.status === "DRAFT") {
    return NextResponse.json({ error: "O diagnóstico precisa estar autorizado antes de receber findings." }, { status: 409 });
  }

  try {
    const diagnostic = await addFinding(id, finding);
    if (!diagnostic) return NextResponse.json({ error: "Não foi possível incluir o finding." }, { status: 409 });
    return NextResponse.json(diagnostic, { status: 201 });
  } catch (error) {
    console.error("Failed to add finding", error);
    return NextResponse.json({ error: "Não foi possível incluir o finding." }, { status: 500 });
  }
}
