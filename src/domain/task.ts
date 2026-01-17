// src/domain/task.ts

export enum TaskStatus {
  TODO = "to_do",
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  DONE = "done",
}

export type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  createdAt: string;
};

export const STATUS_TRANSITION: Record<TaskStatus, TaskStatus | null> = {
  [TaskStatus.TODO]: TaskStatus.PENDING,
  [TaskStatus.PENDING]: TaskStatus.IN_PROGRESS,
  [TaskStatus.IN_PROGRESS]: TaskStatus.DONE,
  [TaskStatus.DONE]: null,
};
