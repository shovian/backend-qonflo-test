// src/repositories/task.repository.ts

import { Task, TaskStatus } from "../domain/task";

const tasks: Task[] = [];

export const TaskRepository = {
  findAll(): Task[] {
    return tasks;
  },

  findById(id: string): Task | undefined {
    return tasks.find((t) => t.id === id);
  },

  create(task: Task): Task {
    tasks.push(task);
    return task;
  },

  delete(id: string): void {
    const index = tasks.findIndex((t) => t.id === id);
    if (index !== -1) tasks.splice(index, 1);
  },

  updateStatus(id: string, status: TaskStatus): Task | undefined {
    const task = this.findById(id);
    if (!task) return undefined;

    task.status = status;
    return task;
  },
};
