import { prisma } from "./prisma";

export async function recordAudit(input: {
  userId?: string;
  companyId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, string>;
}) {
  return prisma.auditLog.create({
    data: {
      userId: input.userId,
      companyId: input.companyId,
      action: input.action,
      resource: input.resource,
      resourceId: input.resourceId,
      metadata: input.metadata
    }
  });
}
