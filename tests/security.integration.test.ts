import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { DiagnosticStatus, UserRole } from "@prisma/client";
import { randomBytes, randomUUID } from "node:crypto";
import { prisma } from "../lib/prisma";
import { deleteSessionToken, sessionTokenHash } from "../lib/auth";
import { addFindingForUser, authorizeDiagnosticForUser, getDiagnosticForUser } from "../lib/store";

const runIntegration = Boolean(process.env.TEST_DATABASE_URL && process.env.DATABASE_URL);

describe.skipIf(!runIntegration)("tenant access and diagnostic authorization", () => {
  const suffix = randomUUID();
  let companyA: { id: string };
  let companyB: { id: string };
  let ownerA: { id: string };
  let adminA: { id: string };
  let memberA: { id: string };
  let ownerB: { id: string };
  let diagnosticA: { id: string };
  let diagnosticB: { id: string };
  let diagnosticAdmin: { id: string };

  beforeAll(async () => {
    companyA = await prisma.company.create({ data: { name: `Empresa A ${suffix}` } });
    companyB = await prisma.company.create({ data: { name: `Empresa B ${suffix}` } });
    ownerA = await prisma.user.create({ data: { name: "Owner A", email: `owner-${suffix}@example.invalid`, passwordHash: "test-only", memberships: { create: { companyId: companyA.id, role: UserRole.OWNER } } } });
    adminA = await prisma.user.create({ data: { name: "Admin A", email: `admin-${suffix}@example.invalid`, passwordHash: "test-only", memberships: { create: { companyId: companyA.id, role: UserRole.ADMIN } } } });
    memberA = await prisma.user.create({ data: { name: "Member A", email: `member-${suffix}@example.invalid`, passwordHash: "test-only", memberships: { create: { companyId: companyA.id, role: UserRole.MEMBER } } } });
    ownerB = await prisma.user.create({ data: { name: "Owner B", email: `owner-b-${suffix}@example.invalid`, passwordHash: "test-only", memberships: { create: { companyId: companyB.id, role: UserRole.OWNER } } } });
    diagnosticA = await prisma.diagnostic.create({ data: { companyId: companyA.id, scope: ["dominio.example"], scopeVersion: "1", status: DiagnosticStatus.DRAFT } });
    diagnosticB = await prisma.diagnostic.create({ data: { companyId: companyB.id, scope: ["outro.example"], scopeVersion: "1", status: DiagnosticStatus.DRAFT } });
    diagnosticAdmin = await prisma.diagnostic.create({ data: { companyId: companyA.id, scope: ["admin.example"], scopeVersion: "2", status: DiagnosticStatus.DRAFT } });
  });

  afterAll(async () => {
    const userIds = [ownerA?.id, adminA?.id, memberA?.id, ownerB?.id].filter(Boolean);
    const companyIds = [companyA?.id, companyB?.id].filter(Boolean);
    const diagnosticIds = [diagnosticA?.id, diagnosticB?.id, diagnosticAdmin?.id].filter(Boolean);
    await prisma.auditLog.deleteMany({ where: { OR: [{ userId: { in: userIds } }, { companyId: { in: companyIds } }] } });
    await prisma.session.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.diagnosticAuthorization.deleteMany({ where: { diagnosticId: { in: diagnosticIds } } });
    await prisma.finding.deleteMany({ where: { diagnosticId: { in: diagnosticIds } } });
    await prisma.diagnostic.deleteMany({ where: { id: { in: diagnosticIds } } });
    await prisma.membership.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await prisma.company.deleteMany({ where: { id: { in: companyIds } } });
    await prisma.$disconnect();
  });

  it("A: user A can access diagnostic A", async () => {
    await expect(getDiagnosticForUser(memberA.id, diagnosticA.id)).resolves.toMatchObject({ id: diagnosticA.id, companyId: companyA.id });
  });

  it("B: user A cannot access diagnostic B", async () => {
    await expect(getDiagnosticForUser(ownerA.id, diagnosticB.id)).resolves.toBeNull();
  });

  it("C: user B can access diagnostic B", async () => {
    await expect(getDiagnosticForUser(ownerB.id, diagnosticB.id)).resolves.toMatchObject({ id: diagnosticB.id, companyId: companyB.id });
  });

  it("D: user B cannot access diagnostic A", async () => {
    await expect(getDiagnosticForUser(ownerB.id, diagnosticA.id)).resolves.toBeNull();
  });

  it("E: unauthenticated or unknown users cannot access a protected diagnostic", async () => {
    await expect(getDiagnosticForUser("user-that-does-not-exist", diagnosticA.id)).resolves.toBeNull();
  });

  it("F: MEMBER cannot authorize or create findings", async () => {
    await expect(authorizeDiagnosticForUser(memberA.id, diagnosticA.id, "terms-v1")).resolves.toMatchObject({ kind: "forbidden" });
    await expect(addFindingForUser(memberA.id, diagnosticA.id, {
      category: "TLS", title: "Finding de teste", description: "Descrição de teste", evidence: "Evidência sintética", level: "LOW", recommendation: "Revisar configuração", status: "OPEN"
    })).resolves.toMatchObject({ kind: "forbidden" });
  });

  it("G: OWNER and ADMIN can authorize with a persisted scope and terms", async () => {
    const ownerResult = await authorizeDiagnosticForUser(ownerA.id, diagnosticA.id, "terms-v1", new Date("2026-01-01T00:00:00.000Z"), new Date("2026-12-31T23:59:59.000Z"));
    expect(ownerResult.kind).toBe("ok");
    if (ownerResult.kind !== "ok") return;

    const adminResult = await authorizeDiagnosticForUser(adminA.id, diagnosticAdmin.id, "terms-v2");
    expect(adminResult.kind).toBe("ok");
    if (adminResult.kind !== "ok") return;

    const authorization = await prisma.diagnosticAuthorization.findUnique({ where: { id: ownerResult.authorizationId } });
    expect(authorization).toMatchObject({ diagnosticId: diagnosticA.id, companyId: companyA.id, authorizedById: ownerA.id, termsVersion: "terms-v1", scopeVersion: "1", status: "APPROVED" });
    expect(authorization?.scope).toEqual(["dominio.example"]);
    expect(authorization?.startsAt?.toISOString()).toBe("2026-01-01T00:00:00.000Z");
    expect(authorization?.endsAt?.toISOString()).toBe("2026-12-31T23:59:59.000Z");
    await expect(prisma.auditLog.findFirst({ where: { action: "diagnostic.authorized", resourceId: ownerResult.authorizationId, userId: ownerA.id } })).resolves.not.toBeNull();
  });

  it("H: logout invalidates the persisted session token", async () => {
    const token = randomBytes(32).toString("base64url");
    const session = await prisma.session.create({ data: { userId: ownerA.id, tokenHash: sessionTokenHash(token), expiresAt: new Date(Date.now() + 60_000) } });
    await deleteSessionToken(token);
    await expect(prisma.session.findUnique({ where: { id: session.id } })).resolves.toBeNull();
  });
});
