import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth";
import { getDefaultCompanyAccess } from "../../../../lib/access";
import { getCompany } from "../../../../lib/store";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });
  const access = await getDefaultCompanyAccess(user.id);
  const company = access ? await getCompany(access.companyId) : null;
  return NextResponse.json({ user, company, role: access?.role ?? null });
}
