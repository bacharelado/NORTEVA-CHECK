import { Company, Diagnostic, Finding } from "./types";

const companies = new Map<string, Company>();
const diagnostics = new Map<string, Diagnostic>();

function id(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

export function createCompany(input: Omit<Company, "id" | "createdAt">) {
  const company: Company = { ...input, id: id("cmp"), createdAt: new Date().toISOString() };
  companies.set(company.id, company);
  return company;
}

export function createDiagnostic(companyId: string, scope: string[]) {
  const now = new Date().toISOString();
  const diagnostic: Diagnostic = {
    id: id("chk"),
    companyId,
    status: "DRAFT",
    scope,
    findings: [],
    createdAt: now,
    updatedAt: now
  };
  diagnostics.set(diagnostic.id, diagnostic);
  return diagnostic;
}

export function authorizeDiagnostic(diagnosticId: string) {
  const diagnostic = diagnostics.get(diagnosticId);
  if (!diagnostic) return null;
  diagnostic.status = "AUTHORIZED";
  diagnostic.authorizedAt = new Date().toISOString();
  diagnostic.updatedAt = new Date().toISOString();
  diagnostics.set(diagnostic.id, diagnostic);
  return diagnostic;
}

export function getDiagnostic(id: string) {
  return diagnostics.get(id) ?? null;
}

export function addFinding(diagnosticId: string, finding: Omit<Finding, "id">) {
  const diagnostic = diagnostics.get(diagnosticId);
  if (!diagnostic) return null;
  diagnostic.findings.push({ ...finding, id: id("fnd") });
  diagnostic.updatedAt = new Date().toISOString();
  diagnostics.set(diagnostic.id, diagnostic);
  return diagnostic;
}
