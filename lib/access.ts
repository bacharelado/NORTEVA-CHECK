import { UserRole } from "@prisma/client";
import { prisma } from "./prisma";

export type CompanyAccess = {
  companyId: string;
  role: UserRole;
};

export function canAuthorize(role: UserRole) {
  return role === UserRole.OWNER || role === UserRole.ADMIN;
}

export function canCreateFinding(role: UserRole) {
  return role === UserRole.OWNER || role === UserRole.ADMIN;
}

export function canCreateDiagnostic(role: UserRole) {
  return role === UserRole.OWNER || role === UserRole.ADMIN;
}

export async function getCompanyAccess(userId: string, companyId: string): Promise<CompanyAccess | null> {
  const membership = await prisma.membership.findUnique({
    where: { userId_companyId: { userId, companyId } },
    select: { companyId: true, role: true }
  });
  return membership ?? null;
}

export async function getDefaultCompanyAccess(userId: string) {
  const membership = await prisma.membership.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { companyId: true, role: true }
  });
  return membership ?? null;
}

export async function getDiagnosticAccess(userId: string, diagnosticId: string) {
  const diagnostic = await prisma.diagnostic.findUnique({
    where: { id: diagnosticId },
    select: { companyId: true }
  });
  if (!diagnostic) return null;
  const companyAccess = await getCompanyAccess(userId, diagnostic.companyId);
  return companyAccess ? { diagnosticId, ...companyAccess } : null;
}
