import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { authorizeDiagnostic } from "../../../../../lib/store";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    const diagnostic = await authorizeDiagnostic(id);
    if (!diagnostic) return NextResponse.json({ error: "Diagnóstico não encontrado." }, { status: 404 });
    return NextResponse.json(diagnostic);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Diagnóstico não encontrado." }, { status: 404 });
    }

    console.error("Failed to authorize diagnostic", error);
    return NextResponse.json({ error: "Não foi possível autorizar o diagnóstico." }, { status: 500 });
  }
}
