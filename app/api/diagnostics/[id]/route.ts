import { NextResponse } from "next/server";
import { getDiagnostic } from "../../../../lib/store";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const diagnostic = await getDiagnostic(id);

  if (!diagnostic) return NextResponse.json({ error: "Diagnóstico não encontrado." }, { status: 404 });
  return NextResponse.json(diagnostic);
}
