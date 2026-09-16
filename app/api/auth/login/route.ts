import { NextResponse } from "next/server";
import { createSession } from "../../../../lib/auth";
import { verifyPassword } from "../../../../lib/password";
import { prisma } from "../../../../lib/prisma";
import { recordAudit } from "../../../../lib/audit";
import { hasValidSameOrigin } from "../../../../lib/csrf";

export async function POST(request: Request) {
  if (!hasValidSameOrigin(request)) {
    return NextResponse.json({ error: "Origem da requisição não permitida." }, { status: 403 });
  }
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo JSON inválido." }, { status: 400 });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const user = await prisma.user.findUnique({ where: { email } });
  const valid = user?.isActive ? await verifyPassword(password, user.passwordHash) : false;

  if (!user || !valid) {
    return NextResponse.json({ error: "E-mail ou senha inválidos." }, { status: 401 });
  }

  await createSession(user.id);
  await recordAudit({ userId: user.id, action: "auth.login", resource: "session" });
  return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } });
}
