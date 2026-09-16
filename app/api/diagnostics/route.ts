import { NextResponse } from "next/server";
import { createCompanyAndDiagnostic, defaultScope } from "../../../lib/store";

export async function POST(request: Request) {
  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo JSON inválido." }, { status: 400 });
  }

  const name = String(body.companyName ?? "").trim();
  const contactName = String(body.contactName ?? "").trim();
  const contactEmail = String(body.contactEmail ?? "").trim();
  const contactPhone = String(body.contactPhone ?? "").trim();
  const authorized = body.authorized === true;

  if (!name || !authorized) {
    return NextResponse.json({ error: "Empresa e autorização são obrigatórias." }, { status: 400 });
  }

  try {
    const { company, diagnostic } = await createCompanyAndDiagnostic({ name, contactName, contactEmail, contactPhone }, defaultScope);
    return NextResponse.json({ company, diagnostic }, { status: 201 });
  } catch (error) {
    console.error("Failed to create diagnostic", error);
    return NextResponse.json({ error: "Não foi possível criar o diagnóstico." }, { status: 500 });
  }
}
