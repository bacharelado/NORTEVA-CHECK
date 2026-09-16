import { NextResponse } from "next/server";
import { deleteCurrentSession, getCurrentUser } from "../../../../lib/auth";
import { recordAudit } from "../../../../lib/audit";
import { hasValidSameOrigin } from "../../../../lib/csrf";

export async function POST(request: Request) {
  if (!hasValidSameOrigin(request)) {
    return NextResponse.json({ error: "Origem da requisição não permitida." }, { status: 403 });
  }
  const user = await getCurrentUser();
  if (user) await recordAudit({ userId: user.id, action: "auth.logout", resource: "session" });
  await deleteCurrentSession();
  return NextResponse.json({ ok: true });
}
