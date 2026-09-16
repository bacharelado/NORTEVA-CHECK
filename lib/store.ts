import { DiagnosticStatus, FindingStatus, Prisma, RiskLevel } from "@prisma/client";
import { Company, Diagnostic, Finding } from "./types";
import { prisma } from "./prisma";

const defaultScope = [
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

export async function createCompany(input: Omit<Company, "id" | "createdAt">) {
  const company = await prisma.company.create({
    data: {
      name: input.name,
      ...(input.document ? { document: input.document } : {}),
      ...(input.contactName ? { contactName: input.contactName } : {}),
      ...(input.contactEmail ? { contactEmail: input.contactEmail } : {}),
      ...(input.contactPhone ? { contactPhone: input.contactPhone } : {})
    }
  });

  return toCompany(company);
}

export async function createDiagnostic(companyId: string, scope: string[] = defaultScope) {
  const diagnostic = await prisma.diagnostic.create({
    data: {
      companyId,
      scope,
      status: DiagnosticStatus.DRAFT
    },
    include: diagnosticInclude
  });

  return toDiagnostic(diagnostic);
}

export async function createCompanyAndDiagnostic(input: Omit<Company, "id" | "createdAt">, scope: string[] = defaultScope) {
  return prisma.$transaction(async (transaction) => {
    const company = await transaction.company.create({
      data: {
        name: input.name,
        ...(input.document ? { document: input.document } : {}),
        ...(input.contactName ? { contactName: input.contactName } : {}),
        ...(input.contactEmail ? { contactEmail: input.contactEmail } : {}),
        ...(input.contactPhone ? { contactPhone: input.contactPhone } : {})
      }
    });

    const diagnostic = await transaction.diagnostic.create({
      data: {
        companyId: company.id,
        scope,
        status: DiagnosticStatus.DRAFT
      },
      include: diagnosticInclude
    });

    return { company: toCompany(company), diagnostic: toDiagnostic(diagnostic) };
  });
}

export async function authorizeDiagnostic(diagnosticId: string) {
  const current = await prisma.diagnostic.findUnique({
    where: { id: diagnosticId },
    select: { status: true }
  });

  if (!current) {
    return null;
  }

  if (current.status !== DiagnosticStatus.DRAFT && current.status !== DiagnosticStatus.AUTHORIZED) {
    throw new Error("Diagnostic cannot be authorized from its current status");
  }

  const diagnostic = await prisma.diagnostic.update({
    where: { id: diagnosticId },
    data: {
      status: DiagnosticStatus.AUTHORIZED,
      authorizedAt: new Date()
    },
    include: diagnosticInclude
  });

  return toDiagnostic(diagnostic);
}

export async function getDiagnostic(diagnosticId: string) {
  const diagnostic = await prisma.diagnostic.findUnique({
    where: { id: diagnosticId },
    include: diagnosticInclude
  });

  return diagnostic ? toDiagnostic(diagnostic) : null;
}

export async function addFinding(diagnosticId: string, finding: Omit<Finding, "id">) {
  const diagnostic = await prisma.diagnostic.findUnique({
    where: { id: diagnosticId },
    select: { status: true }
  });

  if (!diagnostic || (diagnostic.status !== DiagnosticStatus.AUTHORIZED && diagnostic.status !== DiagnosticStatus.IN_PROGRESS) || !riskLevels.has(finding.level) || !findingStatuses.has(finding.status)) {
    return null;
  }

  await prisma.finding.create({
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

  return getDiagnostic(diagnosticId);
}

export { defaultScope };
