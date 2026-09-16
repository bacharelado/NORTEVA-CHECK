import {
  AuthorizationStatus,
  DiagnosticStatus,
  FindingStatus,
  Prisma,
  RiskLevel,
  UserRole
} from "@prisma/client";
import { Company, Diagnostic, Finding } from "./types";
import { getDiagnosticAccess, canAuthorize, canCreateDiagnostic, canCreateFinding } from "./access";
import { recordAudit } from "./audit";
import { prisma } from "./prisma";

export const defaultScope = [
  "Exposição externa",
  "DNS e domínio",
  "TLS",
  "Contas e MFA",
  "Backups",
  "Acessos",
  "Dispositivos",
  "Boas práticas de dados"
];

const findingStatuses = new Set<FindingStatus>(["OPEN", "MITIGATED", "ACCEPTED"]);
const riskLevels = new Set<RiskLevel>(["CRITICAL", "HIGH", "MEDIUM", "LOW", "OK"]);

function toCompany(company: {
  id: string;
  name: string;
  document: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  createdAt: Date;
}): Company {
  return {
    id: company.id,
    name: company.name,
    ...(company.document ? { document: company.document } : {}),
    ...(company.contactName ? { contactName: company.contactName } : {}),
    ...(company.contactEmail ? { contactEmail: company.contactEmail } : {}),
    ...(company.contactPhone ? { contactPhone: company.contactPhone } : {}),
    createdAt: company.createdAt.toISOString()
  };
}

function toDiagnostic(diagnostic: {
  id: string;
  companyId: string;
  status: DiagnosticStatus;
  authorizedAt: Date | null;
  scope: Prisma.JsonValue;
  scopeVersion: string;
  createdAt: Date;
  updatedAt: Date;
  findings: Array<{
    id: string;
    category: string;
    title: string;
    description: string;
    evidence: string;
    level: RiskLevel;
    recommendation: string;
    status: FindingStatus;
  }>;
}): Diagnostic {
  const scope = Array.isArray(diagnostic.scope)
    ? diagnostic.scope.filter((item): item is string => typeof item === "string")
    : [];

  return {
    id: diagnostic.id,
    companyId: diagnostic.companyId,
    status: diagnostic.status,
    ...(diagnostic.authorizedAt ? { authorizedAt: diagnostic.authorizedAt.toISOString() } : {}),
    scope,
    scopeVersion: diagnostic.scopeVersion,
    findings: diagnostic.findings.map(toFinding),
    createdAt: diagnostic.createdAt.toISOString(),
    updatedAt: diagnostic.updatedAt.toISOString()
  };
}

function toFinding(finding: {
  id: string;
  category: string;
  title: string;
  description: string;
  evidence: string;
  level: RiskLevel;
  recommendation: string;
  status: FindingStatus;
}): Finding {
  return {
    id: finding.id,
    category: finding.category,
    title: finding.title,
    description: finding.description,
    evidence: finding.evidence,
    level: finding.level,
    recommendation: finding.recommendation,
    status: finding.status
  };
}

const diagnosticInclude = {
  findings: {
    orderBy: { createdAt: "asc" as const }
  }
};

export async function createDiagnostic(companyId: string, scope: string[] = defaultScope) {
  const diagnostic = await prisma.diagnostic.create({
    data: { companyId, scope, scopeVersion: "1", status: DiagnosticStatus.DRAFT },
    include: diagnosticInclude
  });
  return toDiagnostic(diagnostic);
}

export async function getCompany(companyId: string) {
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  return company ? toCompany(company) : null;
}

export async function createDiagnosticForUser(userId: string, scope: string[] = defaultScope) {
  const membership = await prisma.membership.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { companyId: true, role: true }
  });
  if (!membership) return null;
  if (!canCreateDiagnostic(membership.role)) return null;

  const diagnostic = await createDiagnostic(membership.companyId, scope);
  await recordAudit({
    userId,
    companyId: membership.companyId,
    action: "diagnostic.created",
    resource: "diagnostic",
    resourceId: diagnostic.id
  });
  return { company: await getCompany(membership.companyId), diagnostic };
}

export async function getDiagnostic(diagnosticId: string) {
  const diagnostic = await prisma.diagnostic.findUnique({
    where: { id: diagnosticId },
    include: diagnosticInclude
  });
  return diagnostic ? toDiagnostic(diagnostic) : null;
}

export async function getDiagnosticForUser(userId: string, diagnosticId: string) {
  const access = await getDiagnosticAccess(userId, diagnosticId);
  if (!access) return null;

  const diagnostic = await getDiagnostic(diagnosticId);
  if (diagnostic) {
    await recordAudit({
      userId,
      companyId: access.companyId,
      action: "diagnostic.read",
      resource: "diagnostic",
      resourceId: diagnosticId
    });
  }
  return diagnostic;
}

export async function authorizeDiagnosticForUser(
  userId: string,
  diagnosticId: string,
  termsVersion: string,
  startsAt?: Date,
  endsAt?: Date
) {
  const access = await getDiagnosticAccess(userId, diagnosticId);
  if (!access || !canAuthorize(access.role)) return { kind: "forbidden" as const };

  const current = await prisma.diagnostic.findUnique({
    where: { id: diagnosticId },
    select: { status: true, scope: true, scopeVersion: true, companyId: true }
  });
  if (!current) return { kind: "not_found" as const };
  if (current.status !== DiagnosticStatus.DRAFT && current.status !== DiagnosticStatus.AUTHORIZED) {
    return { kind: "invalid_state" as const };
  }
  if (current.scope === null) return { kind: "invalid_state" as const };

  const now = new Date();
  const result = await prisma.$transaction(async (transaction) => {
    const authorization = await transaction.diagnosticAuthorization.create({
      data: {
        diagnosticId,
        companyId: current.companyId,
        authorizedById: userId,
        status: AuthorizationStatus.APPROVED,
        scope: current.scope as Prisma.InputJsonValue,
        scopeVersion: current.scopeVersion,
        termsVersion,
        startsAt: startsAt ?? now,
        endsAt
      }
    });
    const diagnostic = await transaction.diagnostic.update({
      where: { id: diagnosticId },
      data: { status: DiagnosticStatus.AUTHORIZED, authorizedAt: now },
      include: diagnosticInclude
    });
    return { authorization, diagnostic };
  });

  await recordAudit({
    userId,
    companyId: access.companyId,
    action: "diagnostic.authorized",
    resource: "diagnostic_authorization",
    resourceId: result.authorization.id,
    metadata: { diagnosticId, termsVersion }
  });
  return { kind: "ok" as const, diagnostic: toDiagnostic(result.diagnostic), authorizationId: result.authorization.id };
}

export async function addFindingForUser(userId: string, diagnosticId: string, finding: Omit<Finding, "id">) {
  const access = await getDiagnosticAccess(userId, diagnosticId);
  if (!access || !canCreateFinding(access.role)) return { kind: "forbidden" as const };
  if (!riskLevels.has(finding.level) || !findingStatuses.has(finding.status)) return { kind: "invalid" as const };

  const diagnostic = await prisma.diagnostic.findUnique({
    where: { id: diagnosticId },
    select: { status: true }
  });
  if (!diagnostic) return { kind: "not_found" as const };
  if (diagnostic.status !== DiagnosticStatus.AUTHORIZED && diagnostic.status !== DiagnosticStatus.IN_PROGRESS) {
    return { kind: "invalid_state" as const };
  }

  const created = await prisma.finding.create({
    data: {
      diagnosticId,
      category: finding.category,
      title: finding.title,
      description: finding.description,
      evidence: finding.evidence,
      level: finding.level,
      recommendation: finding.recommendation,
      status: finding.status
    }
  });
  await recordAudit({
    userId,
    companyId: access.companyId,
    action: "finding.created",
    resource: "finding",
    resourceId: created.id,
    metadata: { diagnosticId }
  });
  return { kind: "ok" as const, diagnostic: await getDiagnostic(diagnosticId) };
}

export { UserRole };
