import { NextResponse } from "next/server";
import { deleteCurrentSession, getCurrentUser } from "../../../../lib/auth";
import { recordAudit } from "../../../../lib/audit";

export async function POST() {
  const user = await getCurrentUser();
  if (user) await recordAudit({ userId: user.id, action: "auth.logout", resource: "session" });
  await deleteCurrentSession();
  return NextResponse.json({ ok: true });
}
