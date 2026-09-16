import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../lib/auth";
import { createDiagnosticForUser, defaultScope } from "../../../lib/store";
import { hasValidSameOrigin } from "../../../lib/csrf";

export async function POST(request: Request) {
  if (!hasValidSameOrigin(request)) {
    return NextResponse.json({ error: "Origem da requisição não permitida." }, { status: 403 });
  }
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo JSON inválido." }, { status: 400 });
  }

  if (body.authorized !== true) {
    return NextResponse.json({ error: "É necessário confirmar a solicitação do diagnóstico." }, { status: 400 });
  }

  try {
    const result = await createDiagnosticForUser(user.id, defaultScope);
    if (!result) return NextResponse.json({ error: "Usuário sem empresa associada." }, { status: 403 });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Failed to create diagnostic", error);
    return NextResponse.json({ error: "Não foi possível criar o diagnóstico." }, { status: 500 });
  }
}
