import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../lib/auth";
import { authorizeDiagnosticForUser } from "../../../../../lib/store";
import { hasValidSameOrigin } from "../../../../../lib/csrf";

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

  const termsVersion = String(body.termsVersion ?? "").trim();
  const startsAt = body.startsAt ? new Date(String(body.startsAt)) : undefined;
  const endsAt = body.endsAt ? new Date(String(body.endsAt)) : undefined;
  if (!termsVersion || (startsAt && Number.isNaN(startsAt.getTime())) || (endsAt && Number.isNaN(endsAt.getTime()))) {
    return NextResponse.json({ error: "Versão do termo e datas válidas são obrigatórias." }, { status: 400 });
  }

  try {
    const result = await authorizeDiagnosticForUser(user.id, id, termsVersion, startsAt, endsAt);
    if (result.kind === "not_found" || result.kind === "forbidden") {
      return NextResponse.json({ error: "Diagnóstico não encontrado." }, { status: 404 });
    }
    if (result.kind === "invalid_state") {
      return NextResponse.json({ error: "O diagnóstico não pode ser autorizado no estado atual." }, { status: 409 });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to authorize diagnostic", error);
    return NextResponse.json({ error: "Não foi possível autorizar o diagnóstico." }, { status: 500 });
  }
}
