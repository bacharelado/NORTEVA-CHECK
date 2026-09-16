import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth";
import { getDiagnosticForUser } from "../../../../lib/store";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });

  const { id } = await context.params;
  const diagnostic = await getDiagnosticForUser(user.id, id);
  if (!diagnostic) return NextResponse.json({ error: "Diagnóstico não encontrado." }, { status: 404 });
  return NextResponse.json(diagnostic);
}
