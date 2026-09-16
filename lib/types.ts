export type RiskLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "OK";

export type CheckStatus = "DRAFT" | "AUTHORIZED" | "IN_PROGRESS" | "COMPLETED";

export type Company = {
  id: string;
  name: string;
  document?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  createdAt: string;
};

export type Finding = {
  id: string;
  category: string;
  title: string;
  description: string;
  evidence: string;
  level: RiskLevel;
  recommendation: string;
  status: "OPEN" | "MITIGATED" | "ACCEPTED";
};

export type Diagnostic = {
  id: string;
  companyId: string;
  status: CheckStatus;
  authorizedAt?: string;
  scope: string[];
  findings: Finding[];
  createdAt: string;
  updatedAt: string;
};

export const riskWeight: Record<RiskLevel, number> = {
  CRITICAL: 5,
  HIGH: 4,
  MEDIUM: 3,
  LOW: 2,
  OK: 0
};

export function calculateAttention(findings: Finding[]) {
  if (!findings.length) return 0;
  const total = findings.reduce((sum, finding) => sum + riskWeight[finding.level], 0);
  const max = findings.length * riskWeight.CRITICAL;
  return Math.max(0, Math.min(100, Math.round((total / max) * 100)));
}

export function levelLabel(level: RiskLevel) {
  return { CRITICAL: "Crítico", HIGH: "Alto", MEDIUM: "Médio", LOW: "Baixo", OK: "OK" }[level];
}
