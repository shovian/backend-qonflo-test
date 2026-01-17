// src/routes/task.routes.ts

import { Router } from 'express';
import { TaskService } from '../services/task.service';
import { TaskStatus } from '../domain/task';
import {
	TaskNotFoundError,
	InvalidStatusTransitionError,
} from '../errors/domainErrors';

const router = Router();

/**
 * GET /tasks
 */
router.get('/', (_req, res) => {
	const tasks = TaskService.getAllTasks();
	res.json(tasks);
});
/**
 * GET /task/:id
 */
router.get('/:id', (_req, res) => {
	const tasks = TaskService.getAllTasks();
	const task = tasks.find((t) => t.id === _req.params.id);
	if (!task) {
		return res.status(404).json({ message: 'Task not found' });
	}
	res.json(task);
});
/**
 * POST /tasks
 * body: { title: string }
 */
router.post('/', (req, res) => {
	const { title } = req.body;

	if (!title) {
		return res.status(400).json({ message: 'title is required' });
	}

	const task = TaskService.createTask(title);
	res.status(201).json(task);
});

/**
 * DELETE /tasks/:id
 */
router.delete('/:id', (req, res) => {
	try {
		TaskService.deleteTask(req.params.id);
		res.status(204).send();
	} catch (err) {
		if (err instanceof TaskNotFoundError) {
			return res.status(404).json({ message: err.message });
		}
		res.status(500).json({ message: 'Internal server error' });
	}
});

/**
 * PUT /tasks/:id/status
 * body: { status: TaskStatus, actor: string }
 */
router.put('/:id/status', (req, res) => {
	const { status, actor } = req.body;

	if (!status || !actor) {
		return res.status(400).json({ message: 'status and actor are required' });
	}

	try {
		const task = TaskService.updateStatus(
			req.params.id,
			status as TaskStatus,
			actor,
		);
		res.json(task);
	} catch (err) {
		if (err instanceof TaskNotFoundError) {
			return res.status(404).json({ message: err.message });
		}
		if (err instanceof InvalidStatusTransitionError) {
			return res.status(400).json({ message: err.message });
		}
		res.status(500).json({ message: 'Internal server error' });
	}
});

export default router;
