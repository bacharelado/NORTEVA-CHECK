import { NextResponse } from "next/server";
import { createCompany, createDiagnostic } from "../../../lib/store";

export async function POST(request: Request) {
  const body = await request.json();
  const name = String(body.companyName ?? "").trim();
  const contactName = String(body.contactName ?? "").trim();
  const contactEmail = String(body.contactEmail ?? "").trim();
  const contactPhone = String(body.contactPhone ?? "").trim();
  const authorized = body.authorized === true;

  if (!name || !authorized) {
    return NextResponse.json({ error: "Empresa e autorização são obrigatórias." }, { status: 400 });
  }

  const company = createCompany({ name, contactName, contactEmail, contactPhone });
  const diagnostic = createDiagnostic(company.id, [
    "Exposição externa",
    "DNS e domínio",
    "TLS",
    "Contas e MFA",
    "Backups",
    "Acessos",
    "Dispositivos",
    "Boas práticas de dados"
  ]);

  return NextResponse.json({ company, diagnostic }, { status: 201 });
}
