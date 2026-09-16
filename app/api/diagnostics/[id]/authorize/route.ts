import { NextResponse } from "next/server";
import { authorizeDiagnostic } from "../../../../../lib/store";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const diagnostic = authorizeDiagnostic(id);
  if (!diagnostic) return NextResponse.json({ error: "Diagnóstico não encontrado." }, { status: 404 });
  return NextResponse.json(diagnostic);
}
