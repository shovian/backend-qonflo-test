// src/repositories/auditLog.repository.ts

import { AuditLog } from "../domain/auditLog";

const auditLogs: AuditLog[] = [];

export const AuditLogRepository = {
  append(log: AuditLog): void {
    auditLogs.push(log);
  },

  findByTaskId(taskId: string): AuditLog[] {
    return auditLogs.filter((log) => log.taskId === taskId);
  },
};
