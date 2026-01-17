// src/services/task.service.ts

import { Task, TaskStatus, STATUS_TRANSITION } from '../domain/task';
import { AuditLog } from '../domain/auditLog';
import { TaskRepository } from '../repositories/task.repository';
import { AuditLogRepository } from '../repositories/auditLog.repository';
import {
	TaskNotFoundError,
	InvalidStatusTransitionError,
} from '../errors/domainErrors';

export const TaskService = {
	getAllTasks(): Task[] {
		return TaskRepository.findAll();
	},

	createTask(title: string): Task {
		const task: Task = {
			id: crypto.randomUUID(),
			title,
			status: TaskStatus.TODO,
			createdAt: new Date().toISOString(),
		};

		TaskRepository.create(task);
		return task;
	},
	updateStatus(taskId: string, nextStatus: TaskStatus, actor: string): Task {
		const task = TaskRepository.findById(taskId);

		if (!task) {
			throw new TaskNotFoundError('Task not found');
		}

		// Idempotent: same status → no-op
		if (task.status === nextStatus) {
			return task;
		}

		const allowedNext = STATUS_TRANSITION[task.status];

		if (allowedNext !== nextStatus) {
			throw new InvalidStatusTransitionError(
				`Cannot move from ${task.status} to ${nextStatus}`,
			);
		}

		const previousStatus = task.status;

		// Update task state
		TaskRepository.updateStatus(taskId, nextStatus);

		// Append audit log (append-only)
		const log: AuditLog = {
			id: crypto.randomUUID(),
			taskId: task.id,
			actor,
			fromStatus: previousStatus,
			toStatus: nextStatus,
			timestamp: new Date().toISOString(),
		};

		AuditLogRepository.append(log);

		return task;
	},
	deleteTask(taskId: string): void {
		const task = TaskRepository.findById(taskId);

		if (!task) {
			throw new TaskNotFoundError('Task not found');
		}

		TaskRepository.delete(taskId);
	},
};
