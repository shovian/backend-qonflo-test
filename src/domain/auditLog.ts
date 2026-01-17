// src/domain/auditLog.ts

import { TaskStatus } from "./task";

export type AuditLog = {
  id: string;
  taskId: string;
  actor: string;
  fromStatus: TaskStatus;
  toStatus: TaskStatus;
  timestamp: string;
};
