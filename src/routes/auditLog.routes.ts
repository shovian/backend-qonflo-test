// src/routes/auditLog.routes.ts

import { Router } from "express";
import { AuditLogRepository } from "../repositories/auditLog.repository";

const router = Router();

/**
 * GET /tasks/:id/audit-logs
 */
router.get("/tasks/:id/audit-logs", (req, res) => {
  const logs = AuditLogRepository.findByTaskId(req.params.id);
  res.json(logs);
});

export default router;
