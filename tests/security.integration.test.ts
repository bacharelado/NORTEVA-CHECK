import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { DiagnosticStatus, UserRole } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { prisma } from "../lib/prisma";
import { addFindingForUser, authorizeDiagnosticForUser, getDiagnosticForUser } from "../lib/store";

const runIntegration = Boolean(process.env.TEST_DATABASE_URL && process.env.DATABASE_URL);

describe.skipIf(!runIntegration)("tenant access and diagnostic authorization", () => {
  const suffix = randomUUID();
  let companyA: { id: string };
  let companyB: { id: string };
  let ownerA: { id: string };
  let memberA: { id: string };
  let diagnosticA: { id: string };
  let diagnosticB: { id: string };

  beforeAll(async () => {
    companyA = await prisma.company.create({ data: { name: `Empresa A ${suffix}` } });
    companyB = await prisma.company.create({ data: { name: `Empresa B ${suffix}` } });
    ownerA = await prisma.user.create({ data: { name: "Owner A", email: `owner-${suffix}@example.invalid`, passwordHash: "test-only", memberships: { create: { companyId: companyA.id, role: UserRole.OWNER } } } });
    memberA = await prisma.user.create({ data: { name: "Member A", email: `member-${suffix}@example.invalid`, passwordHash: "test-only", memberships: { create: { companyId: companyA.id, role: UserRole.MEMBER } } } });
    diagnosticA = await prisma.diagnostic.create({ data: { companyId: companyA.id, scope: ["dominio.example"], scopeVersion: "1", status: DiagnosticStatus.DRAFT } });
    diagnosticB = await prisma.diagnostic.create({ data: { companyId: companyB.id, scope: ["outro.example"], scopeVersion: "1", status: DiagnosticStatus.DRAFT } });
  });

  afterAll(async () => {
    await prisma.auditLog.deleteMany({ where: { userId: { in: [ownerA?.id, memberA?.id].filter(Boolean) } } });
    await prisma.diagnosticAuthorization.deleteMany({ where: { diagnosticId: { in: [diagnosticA?.id, diagnosticB?.id].filter(Boolean) } } });
    await prisma.finding.deleteMany({ where: { diagnosticId: { in: [diagnosticA?.id, diagnosticB?.id].filter(Boolean) } } });
    await prisma.diagnostic.deleteMany({ where: { id: { in: [diagnosticA?.id, diagnosticB?.id].filter(Boolean) } } });
    await prisma.membership.deleteMany({ where: { userId: { in: [ownerA?.id, memberA?.id].filter(Boolean) } } });
    await prisma.user.deleteMany({ where: { id: { in: [ownerA?.id, memberA?.id].filter(Boolean) } } });
    await prisma.company.deleteMany({ where: { id: { in: [companyA?.id, companyB?.id].filter(Boolean) } } });
    await prisma.$disconnect();
  });

  it("A: authenticated member can access a diagnostic in its company", async () => {
    await expect(getDiagnosticForUser(memberA.id, diagnosticA.id)).resolves.toMatchObject({ id: diagnosticA.id, companyId: companyA.id });
  });

  it("B: an unknown user cannot access a protected diagnostic", async () => {
    await expect(getDiagnosticForUser("user-that-does-not-exist", diagnosticA.id)).resolves.toBeNull();
  });

  it("C: a user from company A cannot access company B", async () => {
    await expect(getDiagnosticForUser(ownerA.id, diagnosticB.id)).resolves.toBeNull();
  });

  it("D: a member without permission cannot authorize or create findings", async () => {
    await expect(authorizeDiagnosticForUser(memberA.id, diagnosticA.id, "terms-v1")).resolves.toMatchObject({ kind: "forbidden" });
    await expect(addFindingForUser(memberA.id, diagnosticA.id, {
      category: "TLS",
      title: "Finding de teste",
      description: "Descrição de teste",
      evidence: "Evidência sintética",
      level: "LOW",
      recommendation: "Revisar configuração",
      status: "OPEN"
    })).resolves.toMatchObject({ kind: "forbidden" });
  });

  it("E: authorization creates a formal record and audit event", async () => {
    const result = await authorizeDiagnosticForUser(ownerA.id, diagnosticA.id, "terms-v1");
    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") return;

    const authorization = await prisma.diagnosticAuthorization.findUnique({ where: { id: result.authorizationId } });
    expect(authorization).toMatchObject({ diagnosticId: diagnosticA.id, companyId: companyA.id, authorizedById: ownerA.id, termsVersion: "terms-v1", status: "APPROVED" });
    await expect(prisma.auditLog.findFirst({ where: { action: "diagnostic.authorized", resourceId: result.authorizationId, userId: ownerA.id } })).resolves.not.toBeNull();
  });
});
