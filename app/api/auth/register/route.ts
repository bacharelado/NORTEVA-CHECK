import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { createSession } from "../../../../lib/auth";
import { hashPassword } from "../../../../lib/password";
import { prisma } from "../../../../lib/prisma";
import { recordAudit } from "../../../../lib/audit";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo JSON inválido." }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const companyName = String(body.companyName ?? "").trim();

  if (!name || !companyName || !email.includes("@") || password.length < 12) {
    return NextResponse.json({ error: "Nome, empresa, e-mail válido e senha com pelo menos 12 caracteres são obrigatórios." }, { status: 400 });
  }

  try {
    const user = await prisma.$transaction(async (transaction) => {
      const createdUser = await transaction.user.create({
        data: { name, email, passwordHash: await hashPassword(password) }
      });
      const company = await transaction.company.create({ data: { name, contactName: name, contactEmail: email } });
      await transaction.membership.create({ data: { userId: createdUser.id, companyId: company.id, role: "OWNER" } });
      return createdUser;
    });

    await createSession(user.id);
    await recordAudit({ userId: user.id, action: "auth.registered", resource: "user", resourceId: user.id });
    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Este e-mail já está cadastrado." }, { status: 409 });
    }
    console.error("Failed to register user", error);
    return NextResponse.json({ error: "Não foi possível criar a conta." }, { status: 500 });
  }
}
